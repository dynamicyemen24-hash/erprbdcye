$ErrorActionPreference = 'SilentlyContinue'
$views = Get-ChildItem src\components -File -Filter '*.tsx'

$usesDS = 0
foreach ($v in $views) {
  $t = Get-Content $v.FullName -Raw
  if ($t -match 'from\s+["'']\.\./design-system') { $usesDS++ }
}
"DESIGN-SYSTEM ADOPTION in src/components: $usesDS / $($views.Count) views"
""

"RAW HTML PRIMITIVES IN VIEWS (bypass the design system):"
foreach ($p in @('<button', '<table', '<thead', '<input', '<select', '<textarea', '<form')) {
  $n = (Select-String -Path src\components\*.tsx -Pattern ([regex]::Escape($p)) | Measure-Object).Count
  "  {0,-12} {1,5}" -f $p, $n
}
""

"WCAG / ARIA COVERAGE ACROSS THE VIEW LAYER:"
$checks = [ordered]@{
  'aria-label        ' = 'aria-label'
  'aria-live (status) ' = 'aria-live'
  'aria-expanded      ' = 'aria-expanded'
  'aria-busy          ' = 'aria-busy'
  'aria-describedby   ' = 'aria-describedby'
  'aria-invalid       ' = 'aria-invalid'
  'role= (explicit)   ' = 'role="'
  'focus-visible      ' = 'focus-visible'
  'sr-only            ' = 'sr-only'
  'prefers-reduced    ' = 'motion-reduce'
  'autoFocus          ' = 'autoFocus'
}
foreach ($k in $checks.Keys) {
  $n = (Select-String -Path src\components\*.tsx -Pattern ([regex]::Escape($checks[$k])) | Measure-Object).Count
  "  $k $n"
}
""

"UX STATE COVERAGE (Nielsen #9 - error recognition / #2 - match to real world):"
foreach ($k in @('EmptyState', 'ErrorState', 'Skeleton', 'Spinner', 'useToast', 'ConfirmDialog', 'DataTable')) {
  $files = (Select-String -Path src\components\*.tsx -Pattern ([regex]::Escape($k)) -List | Measure-Object).Count
  "  {0,-14} used by {1,3} view file(s)" -f $k, $files
}
""

"MEGA-COMPONENTS (> 800 lines = unreviewable, unmaintainable):"
$views | ForEach-Object {
  $l = (Get-Content $_.FullName | Measure-Object -Line).Lines
  if ($l -gt 800) { [pscustomobject]@{ Lines = $l; File = $_.Name } }
} | Sort-Object Lines -Descending | Format-Table -AutoSize | Out-String -Width 90
