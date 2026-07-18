import { describe, expect, it } from 'vitest';
import { validatePublishedMihomoConfig } from './subscription';

describe('published Mihomo subscription validation', () => {
  it('accepts a generated-style configuration', () => {
    expect(() =>
      validatePublishedMihomoConfig('proxy-groups: []\nrules: []\nproxies: []'),
    ).not.toThrow();
  });

  it('rejects arbitrary YAML and aliases', () => {
    expect(() => validatePublishedMihomoConfig('message: hello')).toThrow(/proxy-groups/);
    expect(() => validatePublishedMihomoConfig('proxy-groups: &groups []\nrules: []')).toThrow(
      /锚点/,
    );
  });
});
