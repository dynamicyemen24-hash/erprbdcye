with open('src/components/UnifiedContextRibbon.tsx', 'r') as f:
    content = f.read()

import re
# Find the end of the file from the copilot button
pattern = r'          {/\* Nexora AI Copilot Trigger \*/}.*?Copilot AI</span>\s*</button>\s*</div>\s*</div>\s*)}\s*</div>\s*\);\s*};\s*export default UnifiedContextRibbon;'

replacement = '''          {/* Nexora AI Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title={isRtl ? 'مساعد الذكاء الاصطناعي التشغيلي' : 'Nexora AI Copilot'}
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Copilot AI</span>
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default UnifiedContextRibbon;'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
with open('src/components/UnifiedContextRibbon.tsx', 'w') as f:
    f.write(new_content)
