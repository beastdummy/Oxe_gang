/**
 * qbx_core Framework Backend for Gang Script
 * Client-side implementation
 */

interface QBPlayerData {
  gang: {
    name: string;
    label: string;
    grade: {
      level: number;
      name: string;
    };
  };
}

interface QBCore {
  Functions: {
    GetPlayerData: () => QBPlayerData;
  };
}

interface GangData {
  name: string;
  label: string;
  grade: number;
  gradeName: string;
}

export class QbxCoreGangFramework {
  private QBCore: QBCore | null = null;
  private currentGang: GangData | null = null;

  constructor() {
    // Handle both sync and async QBCore initialization
    try {
      const coreExport = (global as any).exports?.['qbx_core']?.GetCoreObject;
      if (coreExport) {
        const result = coreExport();
        if (result && typeof result.then === 'function') {
          // Async
          result.then((core: QBCore) => {
            this.QBCore = core;
            this.loadGangData();
          });
        } else {
          // Sync
          this.QBCore = result;
          this.loadGangData();
        }
      }
    } catch (error) {
      console.error('Failed to initialize QBCore:', error);
    }
  }

  /**
   * Load gang data from QBCore player data
   */
  loadGangData(): void {
    if (!this.QBCore) return;

    const playerData = this.QBCore.Functions.GetPlayerData();
    if (playerData.gang && playerData.gang.name !== 'none') {
      this.currentGang = {
        name: playerData.gang.name,
        label: playerData.gang.label,
        grade: playerData.gang.grade.level,
        gradeName: playerData.gang.grade.name,
      };
    } else {
      this.currentGang = null;
    }
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
   * Get player's gang grade
   */
  getGangGrade(): number {
    return this.currentGang?.grade || 0;
  }

  /**
   * Get player's gang grade name
   */
  getGangGradeName(): string {
    return this.currentGang?.gradeName || 'None';
  }

  /**
   * Check if player is in a gang
   */
  isInGang(): boolean {
    return this.currentGang !== null && this.currentGang.name !== 'none';
  }

  /**
   * Check if player has specific grade or higher
   */
  hasGrade(requiredGrade: number): boolean {
    if (!this.currentGang) return false;
    return this.currentGang.grade >= requiredGrade;
  }

  /**
   * Request gang menu from server
   */
  openGangMenu(): void {
    if (!this.isInGang()) {
      this.showNotification('You are not in a gang', 'error');
      return;
    }

    emitNet('qbx_gang:server:requestMenu');
  }

  /**
   * Request to create a gang
   */
  createGang(gangName: string, label: string): void {
    emitNet('qbx_gang:server:createGang', gangName, label);
  }

  /**
   * Request to invite player to gang
   */
  inviteToGang(targetId: number): void {
    if (!this.hasGrade(2)) {
      this.showNotification('Insufficient grade to invite members', 'error');
      return;
    }

    emitNet('qbx_gang:server:invitePlayer', targetId);
  }

  /**
   * Request to kick member from gang
   */
  kickMember(citizenid: string): void {
    if (!this.hasGrade(3)) {
      this.showNotification('Insufficient grade to kick members', 'error');
      return;
    }

    emitNet('qbx_gang:server:kickMember', citizenid);
  }

  /**
   * Request to promote gang member
   */
  promoteMember(citizenid: string): void {
    if (!this.hasGrade(3)) {
      this.showNotification('Insufficient grade to promote members', 'error');
      return;
    }

    emitNet('qbx_gang:server:promoteMember', citizenid);
  }

  /**
   * Request to demote gang member
   */
  demoteMember(citizenid: string): void {
    if (!this.hasGrade(3)) {
      this.showNotification('Insufficient grade to demote members', 'error');
      return;
    }

    emitNet('qbx_gang:server:demoteMember', citizenid);
  }

  /**
   * Leave current gang
   */
  leaveGang(): void {
    if (!this.isInGang()) {
      this.showNotification('You are not in a gang', 'error');
      return;
    }

    emitNet('qbx_gang:server:leaveGang');
  }

  /**
   * Display gang notification
   */
  showNotification(message: string, type: 'success' | 'error' | 'primary' = 'primary'): void {
    try {
      const notifyExport = (global as any).exports?.['qbx_core']?.Notify;
      if (notifyExport) {
        notifyExport(message, type);
      } else {
        console.log(`[Gang ${type}]: ${message}`);
      }
    } catch (error) {
      console.log(`[Gang ${type}]: ${message}`);
    }
  }

  /**
   * Update gang data from server
   */
  updateGangData(gangData: GangData | null): void {
    this.setPlayerGang(gangData);

    if (gangData) {
      this.showNotification(`Gang updated: ${gangData.label}`, 'primary');
    } else {
      this.showNotification('You have left the gang', 'primary');
    }
  }
}

// Export singleton instance
export const qbxCoreGang = new QbxCoreGangFramework();

// Setup client-side event handlers
onNet('qbx_gang:client:updateData', (gangData: GangData | null) => {
  qbxCoreGang.updateGangData(gangData);
});

// Update gang data when player data is updated
onNet('QBCore:Player:SetPlayerData', (playerData: QBPlayerData) => {
  if (playerData.gang && playerData.gang.name !== 'none') {
    qbxCoreGang.setPlayerGang({
      name: playerData.gang.name,
      label: playerData.gang.label,
      grade: playerData.gang.grade.level,
      gradeName: playerData.gang.grade.name,
    });
  } else {
    qbxCoreGang.setPlayerGang(null);
  }
});
