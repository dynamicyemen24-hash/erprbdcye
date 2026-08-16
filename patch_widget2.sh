#!/bin/bash
# Delete lines 3034 to 3048 (the old header)
sed -i '3034,3048d' src/components/DashboardView.tsx
# Replace the ResponsiveContainer with ChartContainer
sed -i 's/<div className="h-64 flex items-center justify-center">/<ChartContainer height="100%">/g' src/components/DashboardView.tsx
sed -i 's/<ResponsiveContainer width="100%" height="100%">//g' src/components/DashboardView.tsx
