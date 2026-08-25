import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, ShieldCheck, MapPin, Loader2, AlertTriangle } from 'lucide-react';

interface AssetAuditViewProps {
  lang: 'ar' | 'en';
}

interface AuditedAsset {
  id: string;
  asset_code: string | null;
  name_ar: string;
  name_en: string | null;
  location: string | null;
  last_audit_at: string | null;
}

export default function AssetAuditView({ lang }: AssetAuditViewProps) {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<AuditedAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startScanner = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error', err);
      setScanning(false);
      setError(lang === 'ar' ? 'تعذر الوصول إلى الكاميرا. تحقق من الأذونات.' : 'Camera access failed. Check permissions.');
    }
  };

  // Manual code entry fallback (barcode OCR is not available in-browser)
  const handleAudit = async (codeInput: string) => {
    const code = codeInput.trim();
    if (!code) return;
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('rbd_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Resolve the asset by its code
      const res = await fetch(`/api/tables/assets?asset_code=${encodeURIComponent(code)}`, { headers });
      if (!res.ok) throw new Error(`lookup failed (${res.status})`);
      const data = await res.json();
      const rows = Array.isArray(data?.data) ? data.data : [];
      const asset: AuditedAsset | undefined = rows[0];
      if (!asset) {
        setError(lang === 'ar' ? `لم يتم العثور على أصل بالرمز ${code}.` : `No asset found with code ${code}.`);
        return;
      }

      // Persist the physical verification
      const putRes = await fetch(`/api/tables/assets/${asset.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ last_audit_at: new Date().toISOString() })
      });
      if (!putRes.ok) throw new Error(`audit write failed (${putRes.status})`);

      setLastScanned({ ...asset, last_audit_at: new Date().toISOString() });
      setScanning(false);
      stopStream();
    } catch (err) {
      console.error('[AssetAudit] Failed:', err);
      setError(lang === 'ar' ? 'تعذر حفظ نتيجة التدقيق. حاول مجدداً.' : 'Could not save the audit result. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        {lang === 'ar' ? 'تدقيق الأصول (IPSAS)' : 'Asset Audit (IPSAS)'}
      </h3>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

      {!scanning ? (
        <div className="space-y-3">
          <button
            onClick={startScanner}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            {lang === 'ar' ? 'فتح الكاميرا للتحقق الميداني' : 'Open Camera for Field Verification'}
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('assetCode') as HTMLInputElement);
              handleAudit(input.value);
            }}
            className="flex gap-2"
          >
            <input
              name="assetCode"
              type="text"
              placeholder={lang === 'ar' ? 'أدخل رمز الأصل يدوياً (مثال: AST-001)' : 'Enter asset code manually (e.g. AST-001)'}
              className="flex-1 px-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-800 dark:bg-zinc-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {lang === 'ar' ? 'توثيق التدقيق' : 'Record Audit'}
            </button>
          </form>
        </div>
      ) : (
        <div className="relative aspect-video bg-zinc-950 rounded-xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-2 border-emerald-500 m-12"></div>
          <p className="absolute bottom-2 inset-x-0 text-center text-[10px] font-bold text-white/80">
            {lang === 'ar'
              ? 'التحقق البصري فقط — أدخل رمز الأصل يدوياً لتوثيق التدقيق.'
              : 'Visual check only — enter the asset code manually to record the audit.'}
          </p>
        </div>
      )}

      {lastScanned && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">{lang === 'ar' ? 'تم توثيق تدقيق الأصل:' : 'Asset audit recorded:'}</p>
            <p className="text-lg font-black">{lastScanned.asset_code || lastScanned.name_ar}</p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
              {lastScanned.location || (lang === 'ar' ? 'بدون موقع مسجل' : 'No location on file')}
              {' • '}
              {new Date(lastScanned.last_audit_at!).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
            </p>
          </div>
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
      )}
    </div>
  );
}
