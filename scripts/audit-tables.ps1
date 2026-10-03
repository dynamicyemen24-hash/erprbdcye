$ErrorActionPreference = 'SilentlyContinue'
$files = @(Get-ChildItem src\components -File -Filter '*.tsx') +
@(Get-ChildItem src\components -Recurse -File -Filter '*.tsx' |
Where-Object { $_.Directory.Name -ne 'components' })

$th = 0; $thScope = 0; $tables = 0; $tableNoScope = 0
$perFile = @{}
foreach ($f in $files) {
$t = Get-Content $f.FullName -Raw
$rel = $f.FullName -replace '.*src\\', 'src\'
foreach ($m in [regex]::Matches($t, '<th\b[^>]*>')) {
$th++
if ($m.Value -match 'scope=') { $thScope++ }
$perFile[$rel] = 1 + $perFile[$rel]
}
if ($t -match '<table') {
$tables++
if ($t -notmatch 'scope=') { $tableNoScope++ }
}
}

"TABLE ACCESSIBILITY BASELINE (WCAG 1.3.1):"
"  <th> total          : $th"
"  <th> with scope     : $thScope"
"  files with <table>  : $tables"
"  files missing scope : $tableNoScope"
"  TH without scope    : $($th - $thScope)"
""
"  per-file <th> count (top 12):"
$perFile.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 12 |
ForEach-Object { "    {0,4}  {1}" -f $_.Value, $_.Key }
""
"LABEL BINDING (WCAG 1.3.1 / 4.1.2):"
"  <label> tags  : " + (Select-String -Path $files.FullName -Pattern '<label' | Measure-Object).Count
"  htmlFor=      : " + (Select-String -Path $files.FullName -Pattern 'htmlFor' | Measure-Object).Count
