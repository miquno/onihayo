import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { AuthConfig } from './config';

export interface AccountMailer {
  sendLink(email: string, link: URL, purpose: 'sign_in' | 'recover'): Promise<void>;
}

/** The SDK obtains credentials from the deployment environment, never from source code. */
export function createSesMailer(config: AuthConfig): AccountMailer {
  const client = new SESClient({ region: 'eu-central-1' });
  return {
    async sendLink(email, link, purpose) {
      const subject = purpose === 'recover' ? 'Restore access to Onihayo' : 'Your Onihayo link';
      const introduction =
        purpose === 'recover'
          ? 'Use this link to restore access to your Onihayo account.'
          : 'Use this link to create or sign in to your Onihayo account.';
      await client.send(
        new SendEmailCommand({
          Source: config.emailFrom,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Charset: 'UTF-8', Data: subject },
            Body: {
              Text: {
                Charset: 'UTF-8',
                Data: `${introduction}\n\n${link.toString()}\n\nThis link expires in 30 minutes and works once. If you did not request it, ignore this email.`
              }
            }
          }
        })
      );
    }
  };
}
