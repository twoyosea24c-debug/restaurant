import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { defaultStoreId } from "./seed";

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  notificationEmail: string;
};

function envConfig(): SmtpConfig | null {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.MAIL_FROM) return null;
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM,
    notificationEmail: process.env.NOTIFICATION_EMAIL ?? "",
  };
}

async function storedConfig(): Promise<SmtpConfig | null> {
  const setting = await prisma.notificationSetting.findUnique({ where: { storeId: defaultStoreId } });
  if (!setting?.enabled || !setting.smtpHost || !setting.mailFrom) return null;
  return {
    host: setting.smtpHost,
    port: setting.smtpPort,
    user: setting.smtpUser,
    pass: setting.smtpPass,
    from: setting.mailFrom,
    notificationEmail: setting.notificationEmail,
  };
}

function getTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user
      ? {
          user: config.user,
          pass: config.pass,
        }
      : undefined,
  });
}

export async function sendMail(message: MailMessage, config?: SmtpConfig | null) {
  const resolvedConfig = config ?? envConfig();
  if (!resolvedConfig) {
    console.info(`[mail:skip] ${message.subject} -> ${message.to}`);
    return { skipped: true };
  }

  await getTransporter(resolvedConfig).sendMail({
    from: resolvedConfig.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    replyTo: message.replyTo,
  });

  return { skipped: false };
}

export async function sendAdminNotification(input: {
  storeEmail: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const config = (await storedConfig()) ?? envConfig();
  const to = config?.notificationEmail || input.storeEmail;
  if (!to) {
    console.info(`[mail:skip] ${input.subject} -> no recipient`);
    return { skipped: true };
  }

  return sendMail({
    to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
  }, config);
}

export async function sendCustomerMail(input: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const config = (await storedConfig()) ?? envConfig();
  return sendMail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
  }, config);
}
