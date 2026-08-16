#!/bin/bash
sed -i '3016,3140c\' src/components/DashboardView.tsx
sed -i '3016r patch_insights.tsx' src/components/DashboardView.tsx
