import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Mailjet, {
  Client as MJClient,
  LibraryResponse as MJResponse,
  SendEmailV3_1 as MJMail,
} from 'node-mailjet';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import ejs from 'ejs';

@Injectable()
export class MailService implements OnModuleInit {
  private mailjet: MJClient | undefined;

  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    await this.init();
  }

  private async init() {
    this.mailjet = new Mailjet({
      apiKey: this.config.get('MJ_APIKEY_PUBLIC')!,
      apiSecret: this.config.get('MJ_APIKEY_PRIVATE')!,
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    ejsStr: string,
    replacements?: Record<string, string>,
    attachments?: MJMail.Attachment[],
  ): Promise<boolean> {
    // replace placeholders in html
    let html = ejs.render(ejsStr, replacements);
    if (replacements) {
      for (const [key, value] of Object.entries(replacements)) {
        html = html.replaceAll(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    const fromEmail = this.config.get('MJ_FROM_EMAIL');
    const fromName = this.config.get('MJ_FROM_NAME');

    if (!this.mailjet) {
      this.logger.error('Mailjet not initialized');
      return false;
    }

    // send mail
    try {
      const result: MJResponse<MJMail.Response> = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: fromEmail,
                Name: fromName,
              },
              To: [
                {
                  Email: to,
                },
              ],
              Subject: subject,
              // TextPart: text,
              HTMLPart: html,
              Attachments: attachments,
            },
          ],
        });
      this.logger.debug(
        'Send email result:\n' + JSON.stringify(result.body, null, 2),
      );
      const { Status, Errors } = result.body.Messages[0];
      if (Errors && Errors?.length > 0) {
        this.logger.error('Error sending email to ' + to);
        this.logger.error(
          Errors.map(
            (e) =>
              `${e.ErrorCode} - ${e.ErrorIdentifier}: ${e.ErrorMessage} - status code ${e.StatusCode} - related to ${e.ErrorRelatedTo}`,
          ).join('\n'),
        );
      }
      const success = Status === 'success';

      this.logger.info(
        `Email to ${to} with subject ${subject} ${
          success
            ? `sent from ${fromEmail} (${fromName}) successfully`
            : 'failed'
        }`,
      );
      return success;
    } catch (error) {
      this.logger.error('Error sending email');
      this.logger.error(error);
      console.error(error);
      return false;
    }
  }
}
