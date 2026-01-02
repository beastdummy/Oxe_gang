/**
 * qbx_core Framework Backend for Gang Script
 * Server-side implementation
 */

interface QBPlayer {
  PlayerData: {
    citizenid: string;
    charinfo: {
      firstname: string;
      lastname: string;
    };
    gang: {
      name: string;
      label: string;
      grade: {
        level: number;
        name: string;
      };
    };
  };
  Functions: {
    SetGang: (gang: string, grade: number) => void;
    UpdatePlayerData: () => void;
  };
}

interface QBCore {
  Functions: {
    GetPlayer: (source: number) => QBPlayer | null;
    GetPlayers: () => number[];
  };
  Shared: {
    Gangs: Record<string, GangConfig>;
  };
}

interface GangConfig {
  label: string;
  grades: Record<number, { name: string }>;
}

interface GangMember {
  citizenid: string;
  name: string;
  grade: number;
}

interface Gang {
  name: string;
  label: string;
  members: GangMember[];
  territory?: string;
}

export class QbxCoreGangFramework {
  private QBCore: QBCore | null = null;
  private gangs: Map<string, Gang> = new Map();

  constructor() {
    // @ts-ignore - QBCore is a global export from qbx_core
    global.exports['qbx_core'].GetCoreObject().then((core: QBCore) => {
      this.QBCore = core;
    });
  }

  /**
   * Get player by source ID
   */
  getPlayer(source: number): QBPlayer | null {
    if (!this.QBCore) return null;
    return this.QBCore.Functions.GetPlayer(source);
  }

  /**
   * Get player identifier (citizenid)
   */
  getPlayerIdentifier(source: number): string | null {
    const player = this.getPlayer(source);
    return player?.PlayerData.citizenid || null;
  }

  /**
   * Get player gang
   */
  getPlayerGang(source: number): string | null {
    const player = this.getPlayer(source);
    if (!player) return null;

    return player.PlayerData.gang?.name || null;
  }

  /**
   * Set player gang
   */
  setPlayerGang(source: number, gangName: string, grade: number = 0): boolean {
    const player = this.getPlayer(source);
    if (!player) return false;

    player.Functions.SetGang(gangName, grade);
    player.Functions.UpdatePlayerData();
    return true;
  }

  /**
   * Remove player from gang
   */
  removePlayerFromGang(source: number): boolean {
    const player = this.getPlayer(source);
    if (!player) return false;

    player.Functions.SetGang('none', 0);
    player.Functions.UpdatePlayerData();
    return true;
  }

  /**
   * Create a new gang
   */
  createGang(gangName: string, label: string, creator: number): boolean {
    if (this.gangs.has(gangName)) return false;

    const citizenid = this.getPlayerIdentifier(creator);
    if (!citizenid) return false;

    const player = this.getPlayer(creator);
    if (!player) return false;

    const fullName = `${player.PlayerData.charinfo.firstname} ${player.PlayerData.charinfo.lastname}`;

    this.gangs.set(gangName, {
      name: gangName,
      label: label,
      members: [
        {
          citizenid: citizenid,
          name: fullName,
          grade: 4, // Boss grade
        },
      ],
    });

    // Add to QBCore shared gangs if available
    if (this.QBCore?.Shared.Gangs) {
      this.QBCore.Shared.Gangs[gangName] = {
        label: label,
        grades: {
          0: { name: 'Recruit' },
          1: { name: 'Member' },
          2: { name: 'Enforcer' },
          3: { name: 'Lieutenant' },
          4: { name: 'Boss' },
        },
      };
    }

    this.setPlayerGang(creator, gangName, 4);
    return true;
  }

  /**
   * Get gang information
   */
  getGang(gangName: string): Gang | null {
    return this.gangs.get(gangName) || null;
  }

  /**
   * Add member to gang
   */
  addGangMember(gangName: string, source: number, grade: number = 0): boolean {
    const gang = this.gangs.get(gangName);
    if (!gang) return false;

    const citizenid = this.getPlayerIdentifier(source);
    if (!citizenid) return false;

    const player = this.getPlayer(source);
    if (!player) return false;

    const fullName = `${player.PlayerData.charinfo.firstname} ${player.PlayerData.charinfo.lastname}`;

    gang.members.push({
      citizenid: citizenid,
      name: fullName,
      grade: grade,
    });

    this.setPlayerGang(source, gangName, grade);
    return true;
  }

  /**
   * Remove member from gang
   */
  removeGangMember(gangName: string, citizenid: string): boolean {
    const gang = this.gangs.get(gangName);
    if (!gang) return false;

    gang.members = gang.members.filter((m) => m.citizenid !== citizenid);
    return true;
  }

  /**
   * Get player's gang grade
   */
  getPlayerGangGrade(source: number): number {
    const player = this.getPlayer(source);
    if (!player) return 0;

    return player.PlayerData.gang?.grade?.level || 0;
  }

  /**
   * Update gang member grade
   */
  updateGangMemberGrade(gangName: string, citizenid: string, newGrade: number): boolean {
    const gang = this.gangs.get(gangName);
    if (!gang) return false;

    const member = gang.members.find((m) => m.citizenid === citizenid);
    if (!member) return false;

    member.grade = newGrade;
    return true;
  }

  /**
   * Check if player has permission based on grade
   */
  hasGangPermission(source: number, requiredGrade: number): boolean {
    const playerGrade = this.getPlayerGangGrade(source);
    return playerGrade >= requiredGrade;
  }

  /**
   * Get all online gang members
   */
  getOnlineGangMembers(gangName: string): number[] {
    const players: number[] = [];
    const gang = this.gangs.get(gangName);
    if (!gang || !this.QBCore) return players;

    const allPlayers = this.QBCore.Functions.GetPlayers();
    for (const source of allPlayers) {
      const playerGang = this.getPlayerGang(source);
      if (playerGang === gangName) {
        players.push(source);
      }
    }

    return players;
  }

  /**
   * Delete gang
   */
  deleteGang(gangName: string): boolean {
    const gang = this.gangs.get(gangName);
    if (!gang) return false;

    // Remove gang from all online members
    const onlineMembers = this.getOnlineGangMembers(gangName);
    for (const source of onlineMembers) {
      this.removePlayerFromGang(source);
    }

    // Remove from QBCore shared gangs
    if (this.QBCore?.Shared.Gangs && this.QBCore.Shared.Gangs[gangName]) {
      delete this.QBCore.Shared.Gangs[gangName];
    }

    this.gangs.delete(gangName);
    return true;
  }

  /**
   * Get gang grade name
   */
  getGangGradeName(gangName: string, grade: number): string {
    if (!this.QBCore?.Shared.Gangs) return 'Unknown';

    const gangConfig = this.QBCore.Shared.Gangs[gangName];
    if (!gangConfig) return 'Unknown';

    return gangConfig.grades[grade]?.name || 'Unknown';
  }

  /**
   * Notify player
   */
  notifyPlayer(source: number, message: string, type: 'success' | 'error' | 'primary' = 'primary'): void {
    // @ts-ignore - QBCore notify export
    global.exports['qbx_core'].Notify(source, message, type);
  }
}

// Export singleton instance
export const qbxCoreGang = new QbxCoreGangFramework();
