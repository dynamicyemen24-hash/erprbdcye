with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove the old block
target_old = """  // Enterprise Feature: Session Timeout Security
  const { isWarning: isSessionWarning, resetSession } = useSessionTimeout({
    timeoutMinutes: 30, // Auto-logout after 30 mins of inactivity
    isActive: !!currentUser,
    onTimeout: () => {
      setCurrentUser(null);
      setAuthenticatedModules([]);
      alert(lang === 'ar' ? 'تم تسجيل الخروج تلقائياً لعدم النشاط (حماية أمنية).' : 'Automatically logged out due to inactivity (Security protection).');
    }
  });"""

content = content.replace(target_old, "")

# 2. Add it below currentUser
target_new = "  const [currentUser, setCurrentUser] = useState<User | null>(() => {"
replacement_new = """  const [currentUser, setCurrentUser] = useState<User | null>(() => {
"""

# Wait, currentUser has an initialization block.
# Let's find exactly where it is.
