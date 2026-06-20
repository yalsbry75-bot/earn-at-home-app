/**
 * Ad Service - Abstraction Layer
 * Provides unified interface for different ad providers
 * Supports: Web (current), Unity (future), AdMob (future)
 */

import { WebAdProvider } from './providers/WebAdProvider';
import { FutureUnityProvider } from './providers/FutureUnityProvider';
import { FutureAdMobProvider } from './providers/FutureAdMobProvider';
import type { IAdProvider, AdRewardRequest, AdRewardResponse } from './types';

// ============= Ad Service Singleton =============

class AdService {
  private providers: Map<string, IAdProvider> = new Map();
  private currentProvider: string = 'web';

  constructor() {
    // Initialize available providers
    this.providers.set('web', new WebAdProvider());
    this.providers.set('unity', new FutureUnityProvider());
    this.providers.set('admob', new FutureAdMobProvider());
  }

  /**
   * Set active ad provider
   */
  setProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider '${providerName}' not found`);
    }
    this.currentProvider = providerName;
  }

  /**
   * Get current provider
   */
  getProvider(): IAdProvider {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider '${this.currentProvider}' not initialized`);
    }
    return provider;
  }

  /**
   * Show ad and handle reward
   */
  async showAd(adType: 'banner' | 'interstitial' | 'rewarded'): Promise<AdRewardResponse> {
    const provider = this.getProvider();
    return provider.showAd(adType);
  }

  /**
   * Create reward (server-side via Cloud Function)
   */
  async createReward(request: AdRewardRequest): Promise<AdRewardResponse> {
    const provider = this.getProvider();
    return provider.createReward(request);
  }

  /**
   * Get ad statistics
   */
  async getStats(): Promise<any> {
    const provider = this.getProvider();
    return provider.getStats();
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(providerName: string): boolean {
    return this.providers.has(providerName);
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton instance
export const adService = new AdService();

// Export types
export type { IAdProvider, AdRewardRequest, AdRewardResponse } from './types';
