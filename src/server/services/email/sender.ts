import nodemailer from 'nodemailer';
import { emailConfig, EmailConfig } from './config';
import { renderTemplate, EmailTemplateType } from './templates';

let transporter: any = null;

function getTransporter(): any {
  if (transporter) return transporter;
  if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
    transporter = nodemailer.createTransport(emailConfig.smtp);
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export interface EmailResult { success: boolean; messageId?: string; error?: string; }

export async function sendEmail(to: string, templateType: EmailTemplateType, data: Record<string, any>, lang: 'ar' | 'en' = 'en'): Promise<EmailResult> {
  try {
    const template = renderTemplate(templateType, data, lang);
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${templateType} (${info.messageId || 'console'})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function sendBulkEmail(recipients: string[], templateType: EmailTemplateType, data: Record<string, any>, lang: 'ar' | 'en' = 'en'): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  for (const recipient of recipients) {
    results.push(await sendEmail(recipient, templateType, data, lang));
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}
