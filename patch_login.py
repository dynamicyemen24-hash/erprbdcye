import re

with open('src/components/LoginView.tsx', 'r') as f:
    content = f.read()

# Add imports for Firebase Auth
if "import { auth, googleAuthProvider }" not in content:
    content = content.replace(
        "import { useEnterprise } from '../core/context/EnterpriseContext';",
        "import { useEnterprise } from '../core/context/EnterpriseContext';\nimport { auth, googleAuthProvider } from '../lib/firebase';\nimport { signInWithPopup } from 'firebase/auth';"
    )

old_handle = """  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate standard server authentication check
    // Since this is a client-side database simulation, we validate against the seeded users list
    setTimeout(() => {
      const match = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (match) {
        // Successful login
        onLoginSuccess({
          id: match.id,
          email: match.email || 'executive@rohamaab.org',
          name: lang === 'ar' ? (match.name_ar || match.name || '') : (match.name || match.name_ar || ''),
          role: match.email?.toLowerCase() === 'executive@rohamaab.org' ? 'Administrator' : 'Staff'
        });
      } else if (email === 'executive@rohamaab.org' && password === 'admin123') {
        onLoginSuccess({
          id: defaultUser.id,
          email: defaultUser.email,
          name: defaultUser.name,
          role: defaultUser.role
        });
      } else {
        setError(lang === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Invalid credentials.');
        setLoading(false);
      }
    }, 1500);
  };"""

new_handle = """  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Connect to secure Firebase Authentication Gate
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      
      // Map Firebase user to NexoraOS expected User format
      onLoginSuccess({
        id: user.uid,
        email: user.email || 'executive@rohamaab.org',
        name: user.displayName || 'Enterprise User',
        role: user.email === 'dynamicyemen24@gmail.com' || user.email === 'executive@rohamaab.org' ? 'Administrator' : 'Staff',
      });
      
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setError(lang === 'ar' ? 'فشل تسجيل الدخول أو تم إلغاؤه.' : 'Authentication failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace(old_handle, new_handle)

with open('src/components/LoginView.tsx', 'w') as f:
    f.write(content)
