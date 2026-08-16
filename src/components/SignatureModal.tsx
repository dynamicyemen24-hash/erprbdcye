
import React, { useState } from 'react';
import { Fingerprint, Lock, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { createSignature } from '../core/security/signature';
import { logAuditEvent } from '../lib/audit';

interface SignatureModalProps {
  lang: 'ar' | 'en';
  currentUser: any;
  actionDetails: string;
  onSign: (signature: any) => void;
  onCancel: () => void;
}

export default function SignatureModal({ lang, currentUser, actionDetails, onSign, onCancel }: SignatureModalProps) {
  const [signing, setSigning] = useState(false);
  const [signedSignature, setSignedSignature] = useState<any>(null);

  const handleSign = async () => {
    setSigning(true);
    const signature = await createSignature(currentUser.id, actionDetails);
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'SIGN', 'توقيع إلكتروني', 'Digital Signature', 'security', 'high', actionDetails, 'success');
    setSignedSignature(signature);
    onSign(signature);
    setSigning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-zinc-800 shadow-2xl">
        {!signedSignature ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black">{lang === 'ar' ? 'التوقيع الرقمي المعتمد' : 'Electronic Signature Required'}</h3>
              <p className="text-xs text-zinc-500 mt-2">{lang === 'ar' ? 'يرجى التوقيع للمتابعة' : 'Please sign to proceed with this sensitive action'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-2 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleSign} disabled={signing} className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white flex items-center justify-center gap-2">
                {signing ? (lang === 'ar' ? 'يتم التوقيع...' : 'Signing...') : (lang === 'ar' ? 'توقيع' : 'Sign')}
                <Lock className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-lg font-black mb-2">{lang === 'ar' ? 'تم التوقيع بنجاح' : 'Signed Successfully'}</h3>
            <div className="flex justify-center p-4 bg-white rounded-lg border border-slate-200 mb-4">
              <QRCodeSVG value={`https://rohaama.org/verify?hash=${signedSignature.hash}`} size={128} />
            </div>
            <p className="text-xs text-zinc-500 mb-6">{lang === 'ar' ? 'يمكن مسح هذا الرمز للتحقق من صحة التوقيع' : 'Scan this code to verify signature validity'}</p>
            <button onClick={onCancel} className="w-full py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
