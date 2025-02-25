import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service'; // Assuming your mail service is in mail/mail.service.ts
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DeliveryStatus,
  Newsletter,
  NewsletterDelivery,
  SubscriptionStatus,
} from '@prisma/client';
import { render } from 'ejs';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { addMinutes, subMinutes } from 'date-fns';
import wait from 'wait';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class NewsletterService {
  private readonly CACHE_KEY = 'scheduled_newsletters';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async subscribe(memberId: number): Promise<HttpStatus.OK> {
    await this.prisma.member.update({
      where: { id: memberId },
      data: {
        newsletterSubscriptionStatus: SubscriptionStatus.SUBSCRIBED,
        newsletterSubscribedAt: new Date(),
        newsletterUnsubscribedAt: null,
      },
    });
    return HttpStatus.OK;
  }

  async unsubscribe(memberId: number): Promise<HttpStatus.OK> {
    await this.prisma.member.update({
      where: { id: memberId },
      data: {
        newsletterSubscriptionStatus: SubscriptionStatus.UNSUBSCRIBED,
        newsletterUnsubscribedAt: new Date(),
      },
    });
    return HttpStatus.OK;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendScheduledNewsletters() {
    this.logger.debug('Checking for scheduled newsletters..');

    const now = new Date();
    let newslettersToSend: (Newsletter & {
      deliveries: NewsletterDelivery[];
    })[] = null;

    try {
      newslettersToSend = await this.cacheManager.get(this.CACHE_KEY);
      if (newslettersToSend) {
        this.logger.debug('Scheduled newsletters retrieved from cache');
      }
    } catch (cacheError) {
      this.logger.error('Error retrieving newsletters from cache', cacheError);
      // If cache retrieval fails, fallback to fetching from DB
      newslettersToSend = null; // Ensure we fetch from DB in case of cache error
    }

    if (!newslettersToSend) {
      this.logger.debug(
        'Scheduled newsletters not found in cache, fetching from DB',
      );
      newslettersToSend = await this.prisma.newsletter.findMany({
        where: {
          scheduledAt: {
            // leave a 5-minute buffer to allow for some delay
            lte: addMinutes(now, 3),
            gte: subMinutes(now, 2),
          },
          status: {
            in: [DeliveryStatus.PENDING, DeliveryStatus.FAILED],
          },
        },
        include: {
          deliveries: true, // to avoid re-fetching deliveries later if needed.
        },
      });

      try {
        await this.cacheManager.set(
          this.CACHE_KEY,
          newslettersToSend,
          this.CACHE_DURATION,
        );
        this.logger.debug('Scheduled newsletters saved to cache for 1 hour');
      } catch (cacheError) {
        this.logger.error('Error saving newsletters to cache', cacheError);
        // Non-critical error, continue without cache
      }
    }

    if (!newslettersToSend || newslettersToSend.length === 0) {
      this.logger.debug('No newsletters scheduled to send at this time');
      return;
    }

    this.logger.info(
      `Found ${newslettersToSend.length} newsletters scheduled for sending`,
    );

    for (const newsletter of newslettersToSend) {
      this.logger.info(
        `Processing newsletter: ${newsletter.id} - ${newsletter.subject}`,
      );

      try {
        await this.prisma.newsletter.update({
          where: { id: newsletter.id },
          data: { status: DeliveryStatus.SENDING },
        });

        const subscribedMembers = await this.prisma.member.findMany({
          where: {
            id: {
              notIn: newsletter.deliveries.map((d) => d.memberId),
            },
            newsletterSubscriptionStatus: SubscriptionStatus.SUBSCRIBED,
          },
        });

        this.logger.info(
          `Found ${subscribedMembers.length} subscribers for newsletter: ${newsletter.id}`,
        );

        for (const member of subscribedMembers) {
          try {
            const renderedHtml = render(newsletter.ejsString, { member }); // pass member data to EJS

            const sendResult = await this.mailService.sendEmail(
              {
                email: member.email,
                name: `${member.firstName} ${member.lastName}`,
              },
              newsletter.subject,
              renderedHtml,
              {}, // replacements if any, can be extended
              [], // attachments if any
            );

            if (sendResult) {
              await this.prisma.newsletterDelivery.create({
                data: {
                  newsletterId: newsletter.id,
                  memberId: member.id,
                  status: DeliveryStatus.SENT,
                  sentAt: new Date(),
                },
              });
              this.logger.info(
                `Email sent to member ${member.id} for newsletter ${newsletter.id}`,
              );
            } else {
              this.logger.error(
                `No sendResult for member ${member.id} for newsletter ${newsletter.id}`,
              );
              throw new InternalServerErrorException(
                `No sendResult for member ${member.id} for newsletter ${newsletter.id}`,
              );
            }
          } catch (memberSendError) {
            this.logger.error(
              `Error sending email to member ${member.id} for newsletter ${newsletter.id}:`,
              memberSendError,
            );
            await this.prisma.newsletterDelivery.create({
              data: {
                newsletterId: newsletter.id,
                memberId: member.id,
                status: DeliveryStatus.FAILED,
              },
            });
          }

          // add a delay between sending emails to avoid rate limiting
          await wait(500);
        }
        this.logger.info(
          `Newsletter ${newsletter.id} sending process completed`,
        );
        await this.prisma.newsletter.update({
          where: { id: newsletter.id },
          data: { status: DeliveryStatus.SENT }, // mark newsletter as fully SENT
        });
      } catch (newsletterError) {
        this.logger.error(
          `Error processing newsletter ${newsletter.id}:`,
          newsletterError,
        );
        await this.prisma.newsletter.update({
          where: { id: newsletter.id },
          data: { status: DeliveryStatus.FAILED }, // mark newsletter as FAILED if overall process fails
        });
      }
    }
  }
}
