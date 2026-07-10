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

export type MailerProviderType = 'console' | 'smtp';

export type SmtpMailerConfig = {
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  from?: string;
};

export type MailerConfig = {
  provider?: MailerProviderType;
  smtp?: SmtpMailerConfig;
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

class SmtpMailer implements Mailer {
  constructor(
    private readonly logger: Logger,
    private readonly config: SmtpMailerConfig
  ) {}

  async sendEmail(input: SendEmailInput) {
    const recipients = toRecipientList(input.to);
    const messageId = `smtp-shell-${crypto.randomUUID()}`;

    this.logger.info(
      {
        mailer: 'smtp-shell',
        messageId,
        to: recipients,
        subject: input.subject,
        smtpHost: this.config.host,
        smtpPort: this.config.port,
        from: this.config.from,
        metadata: input.metadata,
      },
      'SMTP provider shell accepted email'
    );

    return {
      messageId,
      provider: 'smtp-shell',
    };
  }
}

let cachedMailer: Mailer | null = null;

export function createMailer(logger?: Logger, config?: MailerConfig): Mailer {
  const appLogger = logger ?? createLogger({ level: getEnv().APP_LOG_LEVEL });
  if (config?.provider === 'smtp') {
    return new SmtpMailer(appLogger, config.smtp ?? {});
  }
  return new ConsoleMailer(appLogger);
}

export function getMailer(): Mailer {
  if (!cachedMailer) {
    cachedMailer = createMailer();
  }

  return cachedMailer;
}
