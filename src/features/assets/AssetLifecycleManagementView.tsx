import React, { useState } from 'react';
import { Package, Plus, CheckCircle, Clock, Trash2, Truck } from 'lucide-react';

interface Asset {
  id: number;
  assetCode: string;
  nameEn: string;
  status: 'PURCHASE_REQUEST' | 'SUPPLIED' | 'ALLOCATED' | 'MAINTAINED' | 'DISPOSED';
}

export default function AssetLifecycleManagementView({ lang }: { lang: 'ar' | 'en' }) {
  const [assets, setAssets] = useState<Asset[]>([
    { id: 1, assetCode: 'AST-001', nameEn: 'Laptop Dell', status: 'ALLOCATED' },
    { id: 2, assetCode: 'AST-002', nameEn: 'Office Desk', status: 'SUPPLIED' }
  ]);

  const stages = ['PURCHASE_REQUEST', 'SUPPLIED', 'ALLOCATED', 'MAINTAINED', 'DISPOSED'];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-indigo-500" />
        {lang === 'ar' ? 'إدارة دورة حياة الأصول' : 'Asset Lifecycle Management'}
      </h3>
      
      <div className="space-y-4">
        {assets.map(asset => (
          <div key={asset.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold">{asset.assetCode} - {asset.nameEn}</p>
              <p className="text-xs text-zinc-500">Status: {asset.status}</p>
            </div>
            <div className="flex gap-2">
              {stages.map(stage => (
                <div key={stage} className={`w-3 h-3 rounded-full ${stages.indexOf(stage) <= stages.indexOf(asset.status) ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
