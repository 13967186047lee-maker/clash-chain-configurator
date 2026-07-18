import { defineConfig } from 'vitest/config';
import path from 'node:path';
import * as yaml from 'js-yaml';

export default defineConfig({
  plugins: [
    {
      name: 'yaml-fixture-loader',
      transform(code, id) {
        if (!id.endsWith('.yaml')) return null;
        return { code: `export default ${JSON.stringify(yaml.load(code))}`, map: null };
      },
    },
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
