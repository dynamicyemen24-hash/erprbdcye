import { sendEmail as _sendEmail, sendBulkEmail } from './sender';
export { _sendEmail as sendEmail, sendBulkEmail };
export type { EmailResult } from './sender';
export { renderTemplate } from './templates';
export type { EmailTemplateType } from './templates';

export const sendPasswordReset = (to: string, code: string, lang: 'ar' | 'en' = 'en') => _sendEmail(to, 'passwordReset', { code }, lang);
export const sendWelcome = (to: string, email: string, tempPassword: string, lang: 'ar' | 'en' = 'en') => _sendEmail(to, 'welcome', { email, tempPassword }, lang);
export const sendSecurityAlert = (to: string, ip: string, location: string, device: string, lang: 'ar' | 'en' = 'en') => _sendEmail(to, 'securityAlert', { ip, location, device, timestamp: new Date().toISOString() }, lang);
export const sendNotification = (to: string, title: string, body: string, actionUrl?: string, lang: 'ar' | 'en' = 'en') => _sendEmail(to, 'notification', { title, body, actionUrl }, lang);
export const sendApprovalRequest = (to: string, requesterName: string, requestType: string, amount?: string, approvalUrl?: string, lang: 'ar' | 'en' = 'en') => _sendEmail(to, 'approvalRequest', { requesterName, requestType, amount, approvalUrl }, lang);
export const sendExportReady = (to: string, exportType: string, fileSize: string, downloadUrl: string, lang: 'ar' | 'en' = 'en') => _sendEmail(to, 'exportReady', { exportType, fileSize, downloadUrl }, lang);
