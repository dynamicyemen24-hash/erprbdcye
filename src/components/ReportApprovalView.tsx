
import React from 'react';
import ElectronicSignatureModule from './ElectronicSignatureModule';
import { approveFinancialReport, FinancialReport } from '../core/ledger/reportApproval';

interface ReportApprovalViewProps {
  report: FinancialReport;
  lang: 'ar' | 'en';
  currentUser: any;
}

export default function ReportApprovalView({ report, lang, currentUser }: ReportApprovalViewProps) {
  const handleVerifiedSign = async (signature: any) => {
    const result = await approveFinancialReport(report.id, signature, {
      email: currentUser?.email,
      name: currentUser?.name,
      role: currentUser?.role
    });
    if (result.success) {
      alert(lang === 'ar' ? 'تم اعتماد التقرير بنجاح' : 'Report approved successfully');
    } else {
      alert(lang === 'ar' ? result.message : result.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-sm font-bold mb-4">{lang === 'ar' ? 'اعتماد التقرير المالي' : 'Approve Financial Report'}</h2>
      <ElectronicSignatureModule
        lang={lang}
        currentUser={currentUser}
        actionDetails={`Approve Report ${report.id} for period ${report.period}`}
        onVerifiedSign={handleVerifiedSign}
      >
        {(triggerSignature) => (
          <button 
            onClick={triggerSignature}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg"
          >
            {lang === 'ar' ? 'اعتماد التقرير' : 'Approve Report'}
          </button>
        )}
      </ElectronicSignatureModule>
    </div>
  );
}
