/**
 * ox_core Framework Backend for Gang Script
 * Server-side implementation
 */

import { Ox } from '@overextended/ox_core';

interface GangMember {
  identifier: string;
  name: string;
  rank: number;
}

interface Gang {
  name: string;
  label: string;
  members: GangMember[];
  territory?: string;
}

export class OxCoreGangFramework {
  private gangs: Map<string, Gang> = new Map();

  /**
   * Get player by source ID
   */
  getPlayer(source: number) {
    return Ox.GetPlayer(source);
  }

  /**
   * Get player identifier
   */
  getPlayerIdentifier(source: number): string | null {
    const player = this.getPlayer(source);
    return player?.stateId || null;
  }

  /**
   * Get player gang
   */
  getPlayerGang(source: number): string | null {
    const player = this.getPlayer(source);
    if (!player) return null;

    // Check if player has gang metadata
    const gangName = player.get('gang');
    return gangName || null;
  }

  /**
   * Set player gang
   */
  setPlayerGang(source: number, gangName: string, rank: number = 0): boolean {
    const player = this.getPlayer(source);
    if (!player) return false;

    player.set('gang', gangName);
    player.set('gangRank', rank);
    return true;
  }

  /**
   * Remove player from gang
   */
  removePlayerFromGang(source: number): boolean {
    const player = this.getPlayer(source);
    if (!player) return false;

    player.set('gang', null);
    player.set('gangRank', null);
    return true;
  }

  /**
   * Create a new gang
   */
  createGang(gangName: string, label: string, creator: number): boolean {
    if (this.gangs.has(gangName)) return false;

    const identifier = this.getPlayerIdentifier(creator);
    if (!identifier) return false;

    const player = this.getPlayer(creator);
    if (!player) return false;

    this.gangs.set(gangName, {
      name: gangName,
      label: label,
      members: [
        {
          identifier: identifier,
          name: player.get('name') || 'Unknown',
          rank: 4, // Boss rank
        },
      ],
    });

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
  addGangMember(gangName: string, source: number, rank: number = 0): boolean {
    const gang = this.gangs.get(gangName);
    if (!gang) return false;

    const identifier = this.getPlayerIdentifier(source);
    if (!identifier) return false;

    const player = this.getPlayer(source);
    if (!player) return false;

    gang.members.push({
      identifier: identifier,
      name: player.get('name') || 'Unknown',
      rank: rank,
    });

    this.setPlayerGang(source, gangName, rank);
    return true;
  }

  /**
   * Remove member from gang
   */
  removeGangMember(gangName: string, identifier: string): boolean {
    const gang = this.gangs.get(gangName);
    if (!gang) return false;

    gang.members = gang.members.filter((m) => m.identifier !== identifier);
    return true;
  }

  /**
   * Get player's gang rank
   */
  getPlayerGangRank(source: number): number {
    const player = this.getPlayer(source);
    if (!player) return 0;

    return player.get('gangRank') || 0;
  }

  /**
   * Update gang member rank
   */
  updateGangMemberRank(gangName: string, identifier: string, newRank: number): boolean {
    const gang = this.gangs.get(gangName);
    if (!gang) return false;

    const member = gang.members.find((m) => m.identifier === identifier);
    if (!member) return false;

    member.rank = newRank;
    return true;
  }

  /**
   * Check if player has permission based on rank
   */
  hasGangPermission(source: number, requiredRank: number): boolean {
    const playerRank = this.getPlayerGangRank(source);
    return playerRank >= requiredRank;
  }

  /**
   * Get all online gang members
   */
  getOnlineGangMembers(gangName: string): number[] {
    const players: number[] = [];
    const gang = this.gangs.get(gangName);
    if (!gang) return players;

    for (const [source] of Object.entries(Ox.GetPlayers())) {
      const playerGang = this.getPlayerGang(Number(source));
      if (playerGang === gangName) {
        players.push(Number(source));
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

    this.gangs.delete(gangName);
    return true;
  }
}

// Export singleton instance
export const oxCoreGang = new OxCoreGangFramework();
