with open('src/app/components/TabContentRenderer.tsx', 'r') as f:
    content = f.read()

# Make sure RequireAuth is imported
if "import { RequireAuth } from '../../core/security/RequireAuth';" not in content:
    content = content.replace(
        "import { ErrorBoundary } from './ErrorBoundary';",
        "import { ErrorBoundary } from './ErrorBoundary';\nimport { RequireAuth } from '../../core/security/RequireAuth';"
    )

old_switch = """      case 'settings':
        return <SettingsView 
          lang={lang}
          theme={theme}
          setTheme={setTheme}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />;
      case 'audit_logs':
        return <AuditLogsView lang={lang} currentUser={currentUser} />;"""

new_switch = """      case 'settings':
        return (
          <RequireAuth allowedRoles={['Administrator']} currentRole={currentUser?.role || 'Staff'} lang={lang}>
            <SettingsView 
              lang={lang}
              theme={theme}
              setTheme={setTheme}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          </RequireAuth>
        );
      case 'audit_logs':
        return (
          <RequireAuth allowedRoles={['Administrator']} currentRole={currentUser?.role || 'Staff'} lang={lang}>
            <AuditLogsView lang={lang} currentUser={currentUser} />
          </RequireAuth>
        );"""

content = content.replace(old_switch, new_switch)

with open('src/app/components/TabContentRenderer.tsx', 'w') as f:
    f.write(content)
