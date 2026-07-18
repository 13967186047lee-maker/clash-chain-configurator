import * as yaml from 'js-yaml';
import { ApiError } from './security';

export function validatePublishedMihomoConfig(content: string) {
  if (/(^|\s)[&*][A-Za-z0-9_-]+/m.test(content) || /(^|\s)<<\s*:/m.test(content)) {
    throw new ApiError(400, '订阅配置不支持 YAML 锚点、别名或合并键');
  }
  let parsed: unknown;
  try {
    parsed = yaml.load(content, { json: true });
  } catch {
    throw new ApiError(400, '订阅配置不是有效的 YAML');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError(400, '订阅配置必须是 Mihomo 配置对象');
  }
  const config = parsed as Record<string, unknown>;
  if (!Array.isArray(config['proxy-groups']) || !Array.isArray(config.rules)) {
    throw new ApiError(400, '订阅配置缺少 proxy-groups 或 rules');
  }
}
