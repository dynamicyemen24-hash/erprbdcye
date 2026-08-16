with open('src/App.tsx', 'r') as f:
    content = f.read()

target = "          {/* Offline Read-Only Banner */}"
replacement = """          {/* Enterprise Session Timeout Warning */}
          {isSessionWarning && currentUser && (
            <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {lang === 'ar' ? 'تحذير: سيتم تسجيل الخروج قريباً لعدم النشاط' : 'Warning: Session expiring soon due to inactivity'}
                </span>
              </div>
              <button 
                onClick={resetSession}
                className="px-3 py-1 bg-amber-800 hover:bg-amber-900 rounded text-xs font-black transition-colors"
              >
                {lang === 'ar' ? 'متابعة العمل' : 'Keep Session Alive'}
              </button>
            </div>
          )}

          {/* Offline Read-Only Banner */}"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
