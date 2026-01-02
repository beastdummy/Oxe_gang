/**
 * ox_core Framework Backend for Gang Script
 * Client-side implementation
 */

import { cache } from '@overextended/ox_lib/client';

interface GangData {
  name: string;
  label: string;
  rank: number;
  rankLabel: string;
}

export class OxCoreGangFramework {
  private currentGang: GangData | null = null;

  /**
   * Get resource name safely
   */
  private getResourceName(): string {
    return cache.resource || GetCurrentResourceName();
  }

  /**
   * Get player's current gang data
   */
  getPlayerGang(): GangData | null {
    return this.currentGang;
  }

  /**
   * Set player gang data (called from server)
   */
  setPlayerGang(gangData: GangData | null): void {
    this.currentGang = gangData;
  }

  /**
   * Get player's gang name
   */
  getGangName(): string | null {
    return this.currentGang?.name || null;
  }

  /**
   * Get player's gang rank
   */
  getGangRank(): number {
    return this.currentGang?.rank || 0;
  }

  /**
   * Get player's gang rank label
   */
  getGangRankLabel(): string {
    return this.currentGang?.rankLabel || 'None';
  }

  /**
   * Check if player is in a gang
   */
  isInGang(): boolean {
    return this.currentGang !== null;
  }

  /**
   * Check if player has specific rank or higher
   */
  hasRank(requiredRank: number): boolean {
    if (!this.currentGang) return false;
    return this.currentGang.rank >= requiredRank;
  }

  /**
   * Request gang menu from server
   */
  openGangMenu(): void {
    if (!this.isInGang()) {
      console.log('You are not in a gang');
      return;
    }

    emitNet(`${this.getResourceName()}:gang:requestMenu`);
  }

  /**
   * Request to create a gang
   */
  createGang(gangName: string, label: string): void {
    emitNet(`${this.getResourceName()}:gang:create`, gangName, label);
  }

  /**
   * Request to invite player to gang
   */
  inviteToGang(targetId: number): void {
    if (!this.hasRank(2)) {
      console.log('Insufficient rank to invite members');
      return;
    }

    emitNet(`${this.getResourceName()}:gang:invite`, targetId);
  }

  /**
   * Request to kick member from gang
   */
  kickMember(identifier: string): void {
    if (!this.hasRank(3)) {
      console.log('Insufficient rank to kick members');
      return;
    }

    emitNet(`${this.getResourceName()}:gang:kick`, identifier);
  }

  /**
   * Request to promote gang member
   */
  promoteMember(identifier: string): void {
    if (!this.hasRank(3)) {
      console.log('Insufficient rank to promote members');
      return;
    }

    emitNet(`${this.getResourceName()}:gang:promote`, identifier);
  }

  /**
   * Request to demote gang member
   */
  demoteMember(identifier: string): void {
    if (!this.hasRank(3)) {
      console.log('Insufficient rank to demote members');
      return;
    }

    emitNet(`${this.getResourceName()}:gang:demote`, identifier);
  }

  /**
   * Leave current gang
   */
  leaveGang(): void {
    if (!this.isInGang()) {
      console.log('You are not in a gang');
      return;
    }

    emitNet(`${this.getResourceName()}:gang:leave`);
  }

  /**
   * Display gang notification
   */
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // You can integrate with ox_lib notifications here
    console.log(`[Gang ${type}]: ${message}`);
  }

  /**
   * Update gang data from server
   */
  updateGangData(gangData: GangData | null): void {
    this.setPlayerGang(gangData);
    
    if (gangData) {
      this.showNotification(`Gang updated: ${gangData.label}`, 'info');
    } else {
      this.showNotification('You have left the gang', 'info');
    }
  }
}

// Export singleton instance
export const oxCoreGang = new OxCoreGangFramework();

// Setup client-side event handlers
const resourceName = cache.resource || GetCurrentResourceName();
onNet(`${resourceName}:gang:updateData`, (gangData: GangData | null) => {
  oxCoreGang.updateGangData(gangData);
});
