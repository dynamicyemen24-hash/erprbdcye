#!/bin/bash
find src -type f -name "*.tsx" -exec sed -i 's/border-zinc-200/border-slate-200/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/border-zinc-100/border-slate-100/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/bg-zinc-50 /bg-slate-50 /g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/bg-zinc-50\//bg-slate-50\//g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/bg-zinc-100 /bg-slate-100 /g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/bg-zinc-100\//bg-slate-100\//g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/text-zinc-500/text-slate-500/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/text-zinc-600/text-slate-600/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/text-zinc-700/text-slate-700/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/text-zinc-800/text-slate-800/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/text-zinc-900/text-slate-900/g' {} +
