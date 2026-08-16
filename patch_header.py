with open('src/components/GlobalEnterpriseHeader.tsx', 'r') as f:
    content = f.read()

target = '''        {/* Universal Command Center Launcher */}'''
replacement = '''        {/* Nexora AI Copilot Trigger */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="hidden sm:flex px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg text-xs font-black shadow-xs transition-all items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title={lang === 'ar' ? 'مساعد الذكاء الاصطناعي التشغيلي' : 'Nexora AI Copilot'}
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden xl:inline">Copilot AI</span>
          </button>
        )}

        {/* Universal Command Center Launcher */}'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/GlobalEnterpriseHeader.tsx', 'w') as f:
        f.write(content)
else:
    print("Target not found")
