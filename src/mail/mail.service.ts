import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import ejs from 'ejs';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class MailService {
  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async sendEmail(
    to: { email: string; name: string },
    subject: string,
    ejsStr: string,
    replacements?: Record<string, string>,
    attachments?: any[],
    sandboxMode: boolean = false,
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
    const apiKeyPublic = this.config.get('MJ_APIKEY_PUBLIC');
    const apiKeyPrivate = this.config.get('MJ_APIKEY_PRIVATE');

    if (!apiKeyPublic || !apiKeyPrivate) {
      this.logger.error('Mailjet API keys not configured.');
      return false;
    }

    this.logger.debug(
      `Sending email to ${to.email} (${to.name || '-'}) with subject ${subject} from ${fromEmail} (${fromName})`,
    );

    try {
      const response: AxiosResponse = await axios.post(
        'https://api.mailjet.com/v3.1/send',
        {
          SandboxMode: sandboxMode,
          Messages: [
            {
              From: {
                Email: fromEmail,
                Name: fromName,
              },
              To: [
                {
                  Email: to.email,
                  Name: to.name,
                },
              ],
              Subject: subject,
              HTMLPart: html,
              Attachments: attachments,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(
              `${apiKeyPublic}:${apiKeyPrivate}`,
            ).toString('base64')}`,
          },
        },
      );

      this.logger.debug(
        'Send email result:\n' + JSON.stringify(response.data, null, 2),
      );

      if ([200, 201].includes(response.status)) {
        const { Messages } = response.data;
        if (Messages && Messages.length > 0) {
          const messageResult = Messages[0];
          if (messageResult.Status === 'success') {
            this.logger.info(
              `Email to ${to.email} with subject ${subject} sent successfully from ${fromEmail} (${fromName}) with result ${JSON.stringify(messageResult)}`,
            );
            return true;
          } else if (messageResult.Errors && messageResult.Errors.length > 0) {
            this.logger.error('Error sending email to ' + to.email);
            messageResult.Errors.forEach((e: any) => {
              this.logger.error(
                `${e.ErrorCode} - ${e.ErrorIdentifier}: ${e.ErrorMessage} - status code ${e.StatusCode} - related to ${e.ErrorRelatedTo}`,
              );
            });
            return false;
          }
        }
      } else {
        this.logger.error(
          `Unexpected status code ${response.status} when sending email`,
        );
        this.logger.error(JSON.stringify(response.data, null, 2));
        return false;
      }
      return false;
    } catch (error: any) {
      this.logger.error('Error sending email');
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Axios error: ${error.message}, Status: ${error.response?.status}, Data: ${JSON.stringify(
            error.response?.data,
          )}`,
        );
      } else {
        this.logger.error(JSON.stringify(error));
      }
      return false;
    }
  }
}
