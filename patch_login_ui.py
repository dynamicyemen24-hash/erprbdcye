import re

with open('src/components/LoginView.tsx', 'r') as f:
    content = f.read()

# Replace the email/password fields and buttons with a single Google sign in button
old_form = r"""            {/\* Email input \*/}.*?{/\* Credentials Info block \*/}"""

new_form = """            {/* Google Login button */}
            <div className="space-y-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-700 text-zinc-950 font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-amber-600/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin"></span>
                    {lang === 'ar' ? 'جاري التحقق...' : 'Authenticating...'}
                  </span>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    {lang === 'ar' ? 'تسجيل الدخول باستخدام حساب جوجل (الموظفين)' : 'Secure Sign in with Google (Staff)'}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Credentials Info block */}"""

content = re.sub(old_form, new_form, content, flags=re.DOTALL)

with open('src/components/LoginView.tsx', 'w') as f:
    f.write(content)
