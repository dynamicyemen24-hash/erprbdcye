import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../templates';

describe('Email Templates', () => {
  const templates = ['passwordReset', 'welcome', 'securityAlert', 'notification', 'approvalRequest', 'exportReady'] as const;
  for (const type of templates) {
    it(`${type} renders in English`, () => {
      const result = renderTemplate(type, { code: '123456', email: 'test@test.com', tempPassword: 'pass', ip: '1.2.3.4', location: 'Test', device: 'Chrome', timestamp: new Date().toISOString(), title: 'Test', body: 'Body', requesterName: 'User', requestType: 'Approval', exportType: 'CSV', fileSize: '1MB', downloadUrl: '#' }, 'en');
      expect(result.subject).toBeTruthy();
      expect(result.html).toContain('UAMEX');
    });
    it(`${type} renders in Arabic`, () => {
      const result = renderTemplate(type, { code: '123456', email: 'test@test.com', tempPassword: 'pass', ip: '1.2.3.4', location: 'Test', device: 'Chrome', timestamp: new Date().toISOString(), title: 'Test', body: 'Body', requesterName: 'User', requestType: 'Approval', exportType: 'CSV', fileSize: '1MB', downloadUrl: '#' }, 'ar');
      expect(result.subject).toBeTruthy();
      expect(result.html).toContain('rtl');
    });
  }
});
