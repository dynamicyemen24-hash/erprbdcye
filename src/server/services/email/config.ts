export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'console';
  smtp?: { host: string; port: number; secure: boolean; auth: { user: string; pass: string } };
  from: { name: string; address: string };
}
export const emailConfig: EmailConfig = {
  provider: (process.env.EMAIL_PROVIDER as any) || 'console',
  smtp: process.env.SMTP_HOST ? { host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587'), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' } } : undefined,
  from: { name: process.env.EMAIL_FROM_NAME || 'UAMEX ERP', address: process.env.EMAIL_FROM_ADDRESS || 'noreply@uamex.org' },
};
