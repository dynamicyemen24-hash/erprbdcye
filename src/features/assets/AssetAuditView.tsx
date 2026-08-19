import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, ShieldCheck, MapPin } from 'lucide-react';

interface AssetAuditViewProps {
  lang: 'ar' | 'en';
}

export default function AssetAuditView({ lang }: AssetAuditViewProps) {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanner = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error', err);
      setScanning(false);
    }
  };

  const handleAudit = async (assetId: string) => {
    // Simulated real API call to update Fixed Asset Register
    setLastScanned(assetId);
    setScanning(false);
    // Real implementation would call /api/assets/audit
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        {lang === 'ar' ? 'تدقيق الأصول (IPSAS)' : 'Asset Audit (IPSAS)'}
      </h3>
      
      {!scanning ? (
        <button 
          onClick={startScanner}
          className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          {lang === 'ar' ? 'مسح باركود الأصل' : 'Scan Asset Barcode'}
        </button>
      ) : (
        <div className="relative aspect-video bg-zinc-950 rounded-xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-2 border-emerald-500 m-12"></div>
        </div>
      )}

      {lastScanned && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">{lang === 'ar' ? 'تم تدقيق الأصل:' : 'Asset Audited:'}</p>
            <p className="text-lg font-black">{lastScanned}</p>
          </div>
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
      )}
    </div>
  );
}
