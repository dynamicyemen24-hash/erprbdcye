/**
 * NexoraOS™ — API Response Helpers
 * Provides structured error handling for API calls, including policy violation detection.
 */

export interface PolicyViolation {
  code: string;
  severity: 'BLOCK' | 'WARN' | 'INFO';
  messageAr: string;
  messageEn: string;
  policyKey: string;
  limit?: number;
  currentValue?: number;
}

export class PolicyViolationError extends Error {
  public violations: PolicyViolation[];
  public environmentMode: string;

  constructor(data: {
    message?: string;
    messageAr?: string;
    violations?: PolicyViolation[];
    environmentMode?: string;
  }) {
    super(data.message || 'Policy Violation');
    this.name = 'PolicyViolationError';
    this.violations = data.violations || [];
    this.environmentMode = data.environmentMode || 'production';
  }

  get blockViolations(): PolicyViolation[] {
    return this.violations.filter(v => v.severity === 'BLOCK');
  }

  get warnViolations(): PolicyViolation[] {
    return this.violations.filter(v => v.severity === 'WARN');
  }

  get primaryMessage(): string {
    return this.blockViolations[0]?.messageEn || this.message;
  }

  get primaryMessageAr(): string {
    return this.blockViolations[0]?.messageAr || this.message;
  }
}

/**
 * Parse an API response and throw structured errors for policy violations.
 * Use this in any fetch() call that may trigger policy enforcement.
 */
export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body.violations && Array.isArray(body.violations)) {
      throw new PolicyViolationError(body);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Read policy warnings from response headers (non-blocking WARN-level violations).
 * Returns parsed warnings or null if none.
 */
export function readPolicyWarnings(response: Response): PolicyViolation[] | null {
  const header = response.headers.get('X-Policy-Warnings');
  if (!header) return null;
  try {
    const parsed = JSON.parse(header);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return null;
}

/**
 * Build request headers with environment mode.
 */
export function buildPolicyHeaders(): Record<string, string> {
  return {
    'x-environment-mode': localStorage.getItem('nexora_environment_mode') || 'production',
  };
}
