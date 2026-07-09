import { getEnv } from '@trackigniter8/config';
import { createLogger, type Logger } from '@trackigniter8/logger';

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  metadata?: Record<string, unknown>;
};

export type Mailer = {
  sendEmail: (input: SendEmailInput) => Promise<{ messageId: string; provider: string }>;
};

function toRecipientList(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

class ConsoleMailer implements Mailer {
  constructor(private readonly logger: Logger) {}

  async sendEmail(input: SendEmailInput) {
    const recipients = toRecipientList(input.to);
    const messageId = `dev-${crypto.randomUUID()}`;

    this.logger.info(
      {
        mailer: 'console',
        messageId,
        to: recipients,
        subject: input.subject,
        metadata: input.metadata,
      },
      'Simulated email send'
    );

    return {
      messageId,
      provider: 'console',
    };
  }
}

let cachedMailer: Mailer | null = null;

export function createMailer(logger?: Logger): Mailer {
  const appLogger = logger ?? createLogger({ level: getEnv().APP_LOG_LEVEL });
  return new ConsoleMailer(appLogger);
}

export function getMailer(): Mailer {
  if (!cachedMailer) {
    cachedMailer = createMailer();
  }

  return cachedMailer;
}
