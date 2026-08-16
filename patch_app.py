with open('src/App.tsx', 'r') as f:
    content = f.read()

target = "import { useNexoraData, useOrganizationBranding, performanceMonitor } from './core/hooks';"
replacement = """import { useNexoraData, useOrganizationBranding, performanceMonitor } from './core/hooks';
import { useSessionTimeout } from './core/security/useSessionTimeout';
import { SecureStorage } from './core/security/SecureStorage';
import { useTelemetry } from './core/hooks/useTelemetry';"""

content = content.replace(target, replacement)

# Add session timeout usage inside App component
target_app = "  const [authenticatedModules, setAuthenticatedModules] = useState<ActiveTab[]>([]);"
replacement_app = """  const [authenticatedModules, setAuthenticatedModules] = useState<ActiveTab[]>([]);

  // Enterprise Feature: Session Timeout Security
  const { isWarning: isSessionWarning, resetSession } = useSessionTimeout({
    timeoutMinutes: 30, // Auto-logout after 30 mins of inactivity
    isActive: !!currentUser,
    onTimeout: () => {
      setCurrentUser(null);
      setAuthenticatedModules([]);
      alert(lang === 'ar' ? 'تم تسجيل الخروج تلقائياً لعدم النشاط (حماية أمنية).' : 'Automatically logged out due to inactivity (Security protection).');
    }
  });

  // Enterprise Feature: Telemetry
  useTelemetry('NexoraOS_AppRoot', true);"""

content = content.replace(target_app, replacement_app)

with open('src/App.tsx', 'w') as f:
    f.write(content)
