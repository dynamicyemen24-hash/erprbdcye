with open('src/App.tsx', 'r') as f:
    content = f.read()

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

target_new = """  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('rbd_user') || localStorage.getItem('roh_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });"""

replacement_new = """  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('rbd_user') || localStorage.getItem('roh_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Enterprise Feature: Session Timeout Security
  const { isWarning: isSessionWarning, resetSession } = useSessionTimeout({
    timeoutMinutes: 30, // Auto-logout after 30 mins of inactivity
    isActive: !!currentUser,
    onTimeout: () => {
      setCurrentUser(null);
      setAuthenticatedModules([]);
      alert(lang === 'ar' ? 'تم تسجيل الخروج تلقائياً لعدم النشاط (حماية أمنية).' : 'Automatically logged out due to inactivity (Security protection).');
    }
  });"""

content = content.replace(target_new, replacement_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
