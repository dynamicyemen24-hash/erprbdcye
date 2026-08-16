#!/bin/bash
sed -i 's/<div className="flex justify-between items-center pb-2 border-b border-zinc-150">/<ChartContainer height="100%">/g' src/components/DashboardView.tsx
sed -i 's/<div>//g' src/components/DashboardView.tsx
