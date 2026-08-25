// NexoraOS™ Export Helpers — delegates to the enterprise export engine
export async function fireCelebrationConfetti() {
  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = (confettiModule.default || confettiModule) as any;
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#d97706', '#10b981', '#f59e0b']
    });
  } catch (e) { /* silent */ }
}

export async function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  const { exportToExcel: engineExport } = await import('../core/export');
  await engineExport(data, { fileName, lang: 'en', titleAr: sheetName, titleEn: sheetName, sheetName, dateStamp: true });
}

export async function exportToCSV(data: any[], fileName: string) {
  const { exportToCSV: engineExport } = await import('../core/export');
  await engineExport(data, { fileName, lang: 'en', titleAr: 'Data', titleEn: 'Data', dateStamp: true });
}
