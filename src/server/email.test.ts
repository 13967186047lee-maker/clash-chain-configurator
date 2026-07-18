import { describe, expect, it } from 'vitest';
import { emailTemplate } from './email';

describe('email templates', () => {
  it('renders registration code in HTML and plain text', () => {
    const template = emailTemplate('123456', 'registration');
    expect(template.subject).toContain('注册验证码');
    expect(template.html).toContain('123456');
    expect(template.text).toContain('10 分钟');
  });

  it('explains the zero-knowledge password boundary on resets', () => {
    const template = emailTemplate('654321', 'password_reset');
    expect(template.subject).toContain('密码重置验证码');
    expect(template.text).toContain('不会改变保险库密码');
    expect(template.html).toContain('654321');
  });
});
