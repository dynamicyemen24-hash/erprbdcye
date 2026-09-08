export type EmailTemplateType = 'passwordReset' | 'welcome' | 'securityAlert' | 'notification' | 'approvalRequest' | 'exportReady';

interface EmailTemplate { subject: string; html: string; }

const baseStyle = 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;';
const headerStyle = 'background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;';
const bodyStyle = 'background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;';
const btnStyle = 'display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;';
const footerStyle = 'text-align: center; color: #64748b; font-size: 12px; padding: 20px;';

function wrap(title: string, content: string, lang: 'ar' | 'en') {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return `<!DOCTYPE html><html dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="${baseStyle}"><div style="${headerStyle}"><h1 style="margin:0;font-size:24px">UAMEX ERP™</h1><p style="margin:5px 0 0;opacity:0.9">${lang === 'ar' ? 'نظام إدارة المؤسسات' : 'Enterprise Management System'}</p></div><div style="${bodyStyle}">${content}</div><div style="${footerStyle}"><p>© ${new Date().getFullYear()} UAMEX ERP™. ${lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p></div></body></html>`;
}

export function renderTemplate(type: EmailTemplateType, data: Record<string, any>, lang: 'ar' | 'en' = 'en'): EmailTemplate {
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  switch (type) {
    case 'passwordReset':
      return {
        subject: t('إعادة تعيين كلمة المرور', 'Password Reset'),
        html: wrap(t('إعادة تعيين كلمة المرور', 'Password Reset'), `
          <h2 style="color:#0f172a">${t('إعادة تعيين كلمة المرور', 'Reset Your Password')}</h2>
          <p style="color:#475569">${t('تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك.', 'We received a request to reset your password.')}</p>
          <div style="text-align:center;margin:30px 0"><span style="font-size:32px;font-weight:bold;color:#059669;letter-spacing:8px;background:#f0fdf4;padding:15px 30px;border-radius:8px">${data.code}</span></div>
          <p style="color:#64748b;font-size:14px">${t('صالح لمدة 15 دقيقة فقط. إذا لم تطلب هذا، تجاهل هذه الرسالة.', 'Valid for 15 minutes only. If you didn\'t request this, ignore this email.')}</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:20px"><p style="color:#991b1b;font-size:13px;margin:0">⚠️ ${t('لم تطلب إعادة تعيين كلمة المرور؟ اتصل بفريق الدعم فوراً.', 'Didn\'t request a password reset? Contact support immediately.')}</p></div>`, lang)
      };
    case 'welcome':
      return {
        subject: t('مرحباً بك في نظام UAMEX ERP', 'Welcome to UAMEX ERP'),
        html: wrap(t('مرحباً بك', 'Welcome'), `
          <h2 style="color:#0f172a">${t('مرحباً بك في النظام', 'Welcome to the System')}</h2>
          <p style="color:#475569">${t('تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول بالبيانات التالية:', 'Your account has been created. You can now login with:')}</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;margin:20px 0"><p style="margin:4px 0"><strong>${t('البريد الإلكتروني', 'Email')}:</strong> ${data.email}</p><p style="margin:4px 0"><strong>${t('كلمة المرور المؤقتة', 'Temp Password')}:</strong> ${data.tempPassword}</p></div>
          <p style="color:#64748b;font-size:13px">${t('يرجى تغيير كلمة المرور عند أول تسجيل دخول.', 'Please change your password on first login.')}</p>`, lang)
      };
    case 'securityAlert':
      return {
        subject: t('⚠️ تنبيه أمني - نشاط مشبوه', '⚠️ Security Alert - Suspicious Activity'),
        html: wrap(t('تنبيه أمني', 'Security Alert'), `
          <h2 style="color:#dc2626">${t('تم اكتشاف نشاط مشبوه', 'Suspicious Activity Detected')}</h2>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:15px;margin:20px 0"><p style="margin:4px 0"><strong>${t('العنوان IP', 'IP Address')}:</strong> ${data.ip}</p><p style="margin:4px 0"><strong>${t('الموقع', 'Location')}:</strong> ${data.location || 'N/A'}</p><p style="margin:4px 0"><strong>${t('الجهاز', 'Device')}:</strong> ${data.device || 'N/A'}</p><p style="margin:4px 0"><strong>${t('الوقت', 'Time')}:</strong> ${data.timestamp}</p></div>
          <p style="text-align:center;margin:25px 0"><a href="${data.secureUrl || '#'}" style="${btnStyle}">${t('تأمين الحساب', 'Secure Account')}</a></p>`, lang)
      };
    case 'notification':
      return {
        subject: data.title || t('إشعار جديد', 'New Notification'),
        html: wrap(data.title || t('إشعار', 'Notification'), `
          <h2 style="color:#0f172a">${data.title}</h2><p style="color:#475569">${data.body}</p>
          ${data.actionUrl ? `<p style="text-align:center;margin:25px 0"><a href="${data.actionUrl}" style="${btnStyle}">${t('عرض التفاصيل', 'View Details')}</a></p>` : ''}`, lang)
      };
    case 'approvalRequest':
      return {
        subject: t('طلب موافقة معلق', 'Pending Approval Request'),
        html: wrap(t('طلب موافقة', 'Approval Request'), `
          <h2 style="color:#0f172a">${t('يوجد طلب موافقة معلق', 'Pending Approval Request')}</h2>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;margin:20px 0"><p style="margin:4px 0"><strong>${t('مقدم الطلب', 'Requester')}:</strong> ${data.requesterName}</p><p style="margin:4px 0"><strong>${t('نوع الطلب', 'Type')}:</strong> ${data.requestType}</p><p style="margin:4px 0"><strong>${t('المبلغ', 'Amount')}:</strong> ${data.amount || 'N/A'}</p></div>
          <p style="text-align:center;margin:25px 0"><a href="${data.approvalUrl || '#'}" style="${btnStyle}">${t('مراجعة الطلب', 'Review Request')}</a></p>`, lang)
      };
    case 'exportReady':
      return {
        subject: t('تم التصدير بنجاح', 'Export Ready'),
        html: wrap(t('التصدير جاهز', 'Export Ready'), `
          <h2 style="color:#059669">${t('تم التصدير بنجاح', 'Export Successfully Completed')}</h2>
          <p style="color:#475569">${t('ملف التصدير جاهز للتحميل.', 'Your export file is ready for download.')}</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;margin:20px 0"><p style="margin:4px 0"><strong>${t('النوع', 'Type')}:</strong> ${data.exportType}</p><p style="margin:4px 0"><strong>${t('الحجم', 'Size')}:</strong> ${data.fileSize || 'N/A'}</p></div>
          <p style="text-align:center;margin:25px 0"><a href="${data.downloadUrl || '#'}" style="${btnStyle}">${t('تحميل الملف', 'Download File')}</a></p>
          <p style="color:#64748b;font-size:13px">${t('صالح لمدة 24 ساعة فقط.', 'Valid for 24 hours only.')}</p>`, lang)
      };
    default:
      return { subject: 'Notification', html: '<p>Notification content</p>' };
  }
}
