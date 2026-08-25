import { sanitizeHtml } from './htmlSanitizer';

const DEFAULT_ORG_NAME_AR = "جمعية رُحماء بينهم للعمل الإنساني والتنمية";
const DEFAULT_ORG_NAME_EN = "Rohama'a Baynahum Charity Foundation";
const SYSTEM_NAME = "NexoraOS™";

function getActiveOrgName(lang: 'ar' | 'en' = 'ar'): string {
  try {
    const savedName = localStorage.getItem('rbd_org_name');
    if (savedName && savedName.trim() !== '') return savedName;
  } catch (e) {
    // Fail silently in non-browser environments
  }
  return lang === 'ar' ? DEFAULT_ORG_NAME_AR : DEFAULT_ORG_NAME_EN;
}

export function getCustomFooterHTML(lang?: 'ar' | 'en'): string {
  const currentLang = lang || (document.documentElement?.dir === 'ltr' ? 'en' : 'ar');
  const footerAr = localStorage.getItem('rbd_report_footer_text_ar') || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية - نظام التشغيل المؤسسي الذكي NexoraOS™';
  const footerEn = localStorage.getItem('rbd_report_footer_text_en') || 'Rohamaa Baynahum Charity Foundation - NexoraOS™ Enterprise Intelligent System';
  const showSignatures = localStorage.getItem('rbd_report_signature_blocks') === 'true';
  const footerText = currentLang === 'ar' ? footerAr : footerEn;
  const accentColor = localStorage.getItem('rbd_report_accent_color') || '#059669';

  let footerHTML = '';

  if (showSignatures) {
    footerHTML += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 50px; margin-bottom: 30px; font-family: sans-serif; direction: ${currentLang === 'ar' ? 'rtl' : 'ltr'};">
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 11px; font-weight: bold; color: #475569;">${currentLang === 'ar' ? 'مُعِد التقرير' : 'Prepared By'}</div>
          <div style="margin-top: 35px; border-top: 1px dashed #cbd5e1; width: 60%; margin-left: auto; margin-right: auto;"></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${currentLang === 'ar' ? 'التوقيع والختم' : 'Signature & Stamp'}</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 11px; font-weight: bold; color: #475569;">${currentLang === 'ar' ? 'المدير المالي' : 'Financial Director'}</div>
          <div style="margin-top: 35px; border-top: 1px dashed #cbd5e1; width: 60%; margin-left: auto; margin-right: auto;"></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${currentLang === 'ar' ? 'التوقيع والختم' : 'Signature & Stamp'}</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 11px; font-weight: bold; color: #475569;">${currentLang === 'ar' ? 'الاعتماد والموافقة' : 'Authorized Approval'}</div>
          <div style="margin-top: 35px; border-top: 1px dashed #cbd5e1; width: 60%; margin-left: auto; margin-right: auto;"></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${currentLang === 'ar' ? 'التوقيع والختم' : 'Signature & Stamp'}</div>
        </div>
      </div>
    `;
  }

  footerHTML += `
    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-family: sans-serif; font-size: 11px; color: #64748b; direction: ${currentLang === 'ar' ? 'rtl' : 'ltr'};">
      <div style="font-weight: 600; margin-bottom: 4px; color: ${accentColor};">${footerText}</div>
      <div style="font-size: 10px; color: #94a3b8; font-mono">${SYSTEM_NAME} Security Portal • ${new Date().toLocaleString(currentLang === 'ar' ? 'ar-YE' : 'en-US')}</div>
    </div>
  `;

  return footerHTML;
}

export function getBrandingHTML(isPrint: boolean = false) {
  const currentLang = document.documentElement?.dir === 'ltr' ? 'en' : 'ar';
  const date = new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US');
  let activeLogo = '/LogoRohamaab.png';

  try {
    const savedLogo = localStorage.getItem('rbd_logo_url');
    if (savedLogo) activeLogo = savedLogo;
  } catch (e) {
    // Fail silently
  }

  const titleAr = localStorage.getItem('rbd_report_header_title_ar') || getActiveOrgName('ar');
  const titleEn = localStorage.getItem('rbd_report_header_title_en') || getActiveOrgName('en');
  const subtitleAr = localStorage.getItem('rbd_report_header_subtitle_ar') || 'نظام التشغيل المؤسسي الذكي - NexoraOS™';
  const subtitleEn = localStorage.getItem('rbd_report_header_subtitle_en') || 'Intelligent Enterprise Operating System';
  const layout = localStorage.getItem('rbd_report_header_layout') || 'classic'; // 'classic', 'centered', 'split'
  const accentColor = localStorage.getItem('rbd_report_accent_color') || '#059669';
  const showDate = localStorage.getItem('rbd_report_show_date') !== 'false';
  const showLogo = localStorage.getItem('rbd_report_show_logo') !== 'false';

  const title = currentLang === 'ar' ? titleAr : titleEn;
  const subtitle = currentLang === 'ar' ? subtitleAr : subtitleEn;

  const isRtl = currentLang === 'ar';
  const textDirection = isRtl ? 'right' : 'left';
  const oppositeDirection = isRtl ? 'left' : 'right';

  let headerHTML = '';

  if (layout === 'centered') {
    headerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding-bottom: 20px; border-bottom: 3px double ${accentColor}; margin-bottom: 20px; font-family: sans-serif; position: relative; width: 100%;">
        ${showLogo ? `<img src="${activeLogo}" style="width: 70px; height: 70px; margin-bottom: 10px; object-fit: contain;" />` : ''}
        <h1 style="color: ${accentColor}; margin: 0 0 5px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${title}</h1>
        <p style="color: #64748b; margin: 0; font-size: 13px; font-weight: 500;">${subtitle}</p>
        ${showDate ? `
          <div style="margin-top: 10px; color: #94a3b8; font-size: 11px;">
            <span>${currentLang === 'ar' ? 'التاريخ:' : 'Date:'} ${date}</span>
          </div>
        ` : ''}
      </div>
    `;
  } else if (layout === 'split') {
    headerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 2px solid ${accentColor}; margin-bottom: 20px; font-family: sans-serif; width: 100%;">
        <div style="flex: 1; text-align: ${textDirection};">
          ${showLogo ? `<img src="${activeLogo}" style="width: 60px; height: 60px; object-fit: contain;" />` : ''}
        </div>
        <div style="flex: 2; text-align: center;">
          <h1 style="color: ${accentColor}; margin: 0 0 4px 0; font-size: 20px; font-weight: 800;">${title}</h1>
          <p style="color: #64748b; margin: 0; font-size: 12px; font-weight: 500;">${subtitle}</p>
        </div>
        <div style="flex: 1; text-align: ${oppositeDirection}; color: #64748b; font-size: 11px; line-height: 1.5;">
          <div style="font-weight: 600; color: ${accentColor};">${SYSTEM_NAME}</div>
          ${showDate ? `<div>${date}</div>` : ''}
        </div>
      </div>
    `;
  } else {
    // Default 'classic' layout
    headerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 2px solid ${accentColor}; margin-bottom: 20px; font-family: sans-serif; direction: ${isRtl ? 'rtl' : 'ltr'}; width: 100%;">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${showLogo ? `<img src="${activeLogo}" style="width: 55px; height: 55px; object-fit: contain;" />` : ''}
          <div style="text-align: ${textDirection};">
            <h2 style="color: ${accentColor}; margin: 0 0 3px 0; font-size: 18px; font-weight: 800;">${title}</h2>
            <p style="color: #64748b; margin: 0; font-size: 12px; font-weight: 500;">${subtitle}</p>
          </div>
        </div>
        <div style="text-align: ${oppositeDirection}; color: #64748b; font-size: 11px; line-height: 1.5;">
          <div style="font-weight: bold; color: ${accentColor};">${SYSTEM_NAME}</div>
          ${showDate ? `<div>${date}</div>` : ''}
        </div>
      </div>
    `;
  }

  return headerHTML;
}

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.padding = '20px';
  clone.style.backgroundColor = '#ffffff';

  const header = document.createElement('div');
  header.innerHTML = sanitizeHtml(getBrandingHTML());
  clone.prepend(header);

  const footer = document.createElement('div');
  footer.innerHTML = sanitizeHtml(getCustomFooterHTML());
  clone.appendChild(footer);

  document.body.appendChild(clone);

  const html2canvasModule = await import("html2canvas");
  const html2canvas = (html2canvasModule.default || html2canvasModule) as any;
  const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff' });
  document.body.removeChild(clone);

  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 10;

  pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  pdf.save(`${filename}.pdf`);
}

export function printElement(elementId: string) {
  // Save current document title
  const oldTitle = document.title;
  
  // Set temporary document title matching the active screen header for the PDF filename/header
  const activeHeader = document.querySelector('h1, h2');
  if (activeHeader) {
    document.title = activeHeader.textContent?.trim() || oldTitle;
  }
  
  // Trigger high-fidelity browser print
  window.print();
  
  // Restore document title after print dialog closes
  setTimeout(() => {
    document.title = oldTitle;
  }, 1000);
}

/**
 * Creates a resilient print document writer.
 * Opens a real popup when allowed; otherwise buffers the HTML and falls back
 * to the sandbox-safe hidden-iframe printer. Replaces the previously
 * duplicated per-view `mockDoc` shims (single source of truth).
 */
export function createPrintDocument(): { write(html: string): void; close(): void } {
  let printWindow: Window | null = null;
  let bufferedHTML = '';
  try {
    printWindow = window.open('', '_blank');
  } catch {
    // Popup blocked — buffered iframe path will handle printing.
  }

  return {
    write(html: string) {
      if (printWindow) {
        printWindow.document.write(html);
      } else {
        bufferedHTML += html;
      }
    },
    close() {
      if (printWindow) {
        printWindow.document.close();
      } else if (bufferedHTML) {
        printHTML(bufferedHTML);
      }
    }
  };
}

export function printHTML(htmlContent: string) {
  // Try standard window.open first
  let printWindow: Window | null = null;
  try {
    printWindow = window.open("", "_blank");
  } catch (e) {
    // Suppress error
  }

  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  } else {
    // Sandbox-compatible hidden iframe printing fallback
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.zIndex = "-1";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.write(htmlContent);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  }
}

export function exportToExcel(
  programs: any[],
  projects: any[],
  approvalRequests: any[],
  lang: 'ar' | 'en'
) {
  let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Arabic support

  const title = lang === 'ar' 
    ? "تقرير الأداء المالي والإحصائي الموحد - NexoraOS™"
    : "Unified Financial and Statistical Performance Report - NexoraOS™";
  const org = getActiveOrgName(lang);
  const dateStr = new Date().toLocaleString(lang === 'ar' ? 'ar-YE' : 'en-US');

  csvContent += `"${title}"\n`;
  csvContent += `"${org}"\n`;
  csvContent += `"${lang === 'ar' ? 'تاريخ التصدير' : 'Export Date'}: ${dateStr}"\n\n`;

  // Section 1: KPI Summary
  csvContent += `"${lang === 'ar' ? 'أولاً: ملخص المؤشرات العامة للجمعية' : 'I: General Organization KPI Summary'}"\n`;
  csvContent += `"${lang === 'ar' ? 'المؤشر' : 'Indicator'}","${lang === 'ar' ? 'القيمة' : 'Value'}"\n`;
  
  const activeProgsCount = (programs || []).filter((p: any) => p.status_code === 'active' || p.status === 'active').length || programs.length;
  const totalBudgetVal = (projects || []).reduce((sum, p) => sum + parseFloat(p.budget || '0'), 0);
  const pendingApprovals = (approvalRequests || []).filter((r: any) => r.status === 'pending');
  const pendingSum = pendingApprovals.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);

  if (lang === 'ar') {
    csvContent += `"عدد البرامج النشطة","${activeProgsCount} برامج"\n`;
    csvContent += `"الموازنة الإجمالية للمشاريع","${(totalBudgetVal).toLocaleString()} ر.ي"\n`;
    csvContent += `"طلبات الموافقة المالية المعلقة","${pendingApprovals.length} طلبات"\n`;
    csvContent += `"إجمالي المبالغ المعلقة","${(pendingSum).toLocaleString()} ر.ي"\n\n`;
  } else {
    csvContent += `"Total Active Programs","${activeProgsCount} Programs"\n`;
    csvContent += `"Total Portfolio Budget","${totalBudgetVal.toLocaleString()} YER"\n`;
    csvContent += `"Pending Financial Approvals","${pendingApprovals.length} Requests"\n`;
    csvContent += `"Total Pending Amount","${pendingSum.toLocaleString()} YER"\n\n`;
  }

  // Section 2: Programs Performance
  csvContent += `"${lang === 'ar' ? 'ثانياً: أداء البرامج التنموية المعتمدة' : 'II: Authorized Developmental Programs Performance'}"\n`;
  if (lang === 'ar') {
    csvContent += `"رمز البرنامج","اسم البرنامج","الموازنة المعتمدة","الحالة"\n`;
    programs.forEach(p => {
      csvContent += `"${p.code || ''}","${p.name_ar || ''}","${parseFloat(p.budget || '0').toLocaleString()} ر.ي","${p.status_code || p.status || ''}"\n`;
    });
  } else {
    csvContent += `"Program Code","Program Name","Allocated Budget","Status"\n`;
    programs.forEach(p => {
      csvContent += `"${p.code || ''}","${p.name_en || ''}","${parseFloat(p.budget || '0').toLocaleString()} YER","${p.status_code || p.status || ''}"\n`;
    });
  }
  csvContent += `\n`;

  // Section 3: Projects Performance
  csvContent += `"${lang === 'ar' ? 'ثالثاً: تفاصيل المشاريع التشغيلية الميدانية' : 'III: Detailed Field Projects Execution'}"\n`;
  if (lang === 'ar') {
    csvContent += `"رمز المشروع","اسم المشروع","الموقع","الموازنة","نسبة الإنجاز","المستهدفين","الفعلين","مستوى الخطورة"\n`;
    projects.forEach(p => {
      csvContent += `"${p.code || ''}","${p.name_ar || ''}","${p.location_name || ''}","${parseFloat(p.budget || '0').toLocaleString()} ر.ي","${p.progress_percent || '0'}%","${p.target_beneficiaries || 0}","${p.actual_beneficiaries || 0}","${p.risk_level || ''}"\n`;
    });
  } else {
    csvContent += `"Project Code","Project Name","Location","Budget","Progress","Target Beneficiaries","Actual Reached","Risk Level"\n`;
    projects.forEach(p => {
      csvContent += `"${p.code || ''}","${p.name_en || ''}","${p.location_name || ''}","${parseFloat(p.budget || '0').toLocaleString()} YER","${p.progress_percent || '0'}%","${p.target_beneficiaries || 0}","${p.actual_beneficiaries || 0}","${p.risk_level || ''}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `NexoraOS_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

