import { DiscoveryParams, DiscoveryProvider, DiscoveryResult } from "./types";

export class ManualProvider implements DiscoveryProvider {
  readonly name = "manual";

  async discover(params: DiscoveryParams): Promise<DiscoveryResult[]> {
    // Manual provider is a no-op placeholder for future integrations
    return [];
  }
}
