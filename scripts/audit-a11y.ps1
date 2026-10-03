$ErrorActionPreference = 'SilentlyContinue'

# WCAG 2.4.7 Focus Visible: count elements that suppress the native focus
# indicator (outline-none) WITHOUT supplying any replacement affordance.
$dead = 0
$deadFiles = @{}
foreach ($f in Get-ChildItem src -Recurse -Include '*.tsx' -File) {
  $text = Get-Content $f.FullName -Raw
  foreach ($m in [regex]::Matches($text, '[^\r\n]*outline-none[^\r\n]*')) {
    $line = $m.Value
    if ($line -match 'focus:ring|focus-visible|focus:border|focus:outline|focus:shadow|ux-focus') { continue }
    $dead++
    $rel = $f.FullName -replace '.*src\\', 'src\'
    $deadFiles[$rel] = 1 + $deadFiles[$rel]
  }
}
"WCAG 2.4.7  focus suppressed with NO replacement: $dead occurrences"
"  (across $($deadFiles.Keys.Count) files)"
""
"  top offenders:"
$deadFiles.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 8 | ForEach-Object {
  "    {0,4}  {1}" -f $_.Value, $_.Key
}
""

# Nielsen #1 / WCAG 4.1.3: what feedback do views actually use?
"FEEDBACK CHANNELS IN THE VIEW LAYER:"
foreach ($k in @('useToast', 'toast(', 'alert(', 'window.alert', 'Notification', 'setSuccess', 'setError(')) {
  $n = (Select-String -Path src\components\*.tsx -Pattern ([regex]::Escape($k)) | Measure-Object).Count
  "  {0,-14} {1,5}" -f $k, $n
}
""

# Is ToastProvider even mounted?
"ToastProvider mount check:"
Get-ChildItem src -Recurse -Include '*.tsx' | Select-String -Pattern 'ToastProvider' |
  ForEach-Object { "  " + ($_.Path -replace '.*src\\', 'src\') + ':' + $_.LineNumber }
""

# WCAG 1.3.1: hand-rolled tables missing header scope
$tbl = 0; $noScope = 0
foreach ($f in Get-ChildItem src\components -Filter '*.tsx') {
  $t = Get-Content $f.FullName -Raw
  if ($t -match '<table') {
    $tbl++
    if ($t -notmatch 'scope=') { $noScope++ }
  }
}
"WCAG 1.3.1  files with hand-rolled <table>: $tbl   without scope headers: $noScope"
