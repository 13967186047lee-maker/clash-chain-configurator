import { buildMihomoConfig } from '@/lib/mihomo';

export default class ConfigConfigurator {
  private providers: ProxyProviderExtend[] = [];
  private proxyNodes: ProxyNode[] = [];

  setProviders(providers: ProxyProviderExtend[]) {
    this.providers = providers;
  }

  setFinalProxyNodes(proxyNodes: ProxyNode[]) {
    this.proxyNodes = proxyNodes;
  }

  get result() {
    return buildMihomoConfig({ providers: this.providers, proxyNodes: this.proxyNodes });
  }

  get content() {
    return this.result.content;
  }
}
