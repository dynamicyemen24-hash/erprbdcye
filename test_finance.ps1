# Finance Workflow Test Script
# Run: powershell -File D:\projects26\NexoraOS\test_finance.ps1

Write-Host "=== TEST 1: Database Schema Verification ===" -ForegroundColor Cyan
$tables = @('donations', 'transactions', 'transaction_lines', 'journal_entries', 'journal_entry_lines', 'chart_of_accounts', 'fiscal_years', 'audit_logs')
foreach ($t in $tables) {
    try {
        $result = Invoke-Sqlcmd -Query "SELECT COUNT(*) as cnt FROM `$t` LIMIT 1" -ServerInstance "localhost" -Database "nexoraos" 2>$null
        Write-Host "  `$t: EXISTS (rows: $($result.Rows[0].cnt))" -ForegroundColor Green
    } catch {
        Write-Host "  `$t: MISSING" -ForegroundColor Red
    }
}

Write-Host "`n=== TEST 2: Fiscal Years ===" -ForegroundColor Cyan
$fys = Invoke-Sqlcmd -Query "SELECT id, status, start_date, end_date FROM fiscal_years LIMIT 5" -ServerInstance "localhost" -Database "nexoraos" 2>$null
Write-Host "  Found $($fys.Rows.Count) fiscal years" -ForegroundColor Green
foreach ($fy in $fys.Rows) {
    Write-Host "    ID: $($fy.id), status: $($fy.status), period: $($fy.start_date) to $($fy.end_date)" -ForegroundColor Gray
}

Write-Host "`n=== TEST 3: Organizations ===" -ForegroundColor Cyan
$orgs = Invoke-Sqlcmd -Query "SELECT id, name_ar FROM organizations LIMIT 3" -ServerInstance "localhost" -Database "nexoraos" 2>$null
Write-Host "  Found $($orgs.Rows.Count) organizations" -ForegroundColor Green
foreach ($org in $orgs.Rows) {
    Write-Host "    ID: $($org.id), name: $($org.name_ar)" -ForegroundColor Gray
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan