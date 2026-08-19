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
  } catch (e) { console.error('[Export] Failed to trigger celebration confetti:', e); }
}

export async function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  try {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    fireCelebrationConfetti();
  } catch (err) {
    console.error('Excel Export Error:', err);
  }
}

export async function exportToCSV(data: any[], fileName: string) {
  try {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    fireCelebrationConfetti();
  } catch (err) {
    console.error('CSV Export Error:', err);
  }
}
