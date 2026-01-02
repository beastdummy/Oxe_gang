# Framework Integration for Gang Script

This document describes the framework-specific implementations for the gang script system.

## Available Frameworks

### ox_core
- **Server**: `src/server/framework/ox_core.ts`
- **Client**: `src/client/framework/ox_core.ts`

### qbx_core
- **Server**: `src/server/framework/qbx_core.ts`
- **Client**: `src/client/framework/qbx_core.ts`

## Usage Examples

### ox_core Example

```typescript
// Server-side
import { oxCoreGang } from './framework/ox_core';

// Create a gang
oxCoreGang.createGang('bloods', 'The Bloods', playerId);

// Add a member
oxCoreGang.addGangMember('bloods', targetPlayerId, 1);

// Check permissions
if (oxCoreGang.hasGangPermission(playerId, 3)) {
  // Player has rank 3 or higher
}
```

```typescript
// Client-side
import { oxCoreGang } from './framework/ox_core';

// Open gang menu
oxCoreGang.openGangMenu();

// Create a gang
oxCoreGang.createGang('bloods', 'The Bloods');

// Invite player
oxCoreGang.inviteToGang(targetServerId);
```

### qbx_core Example

```typescript
// Server-side
import { qbxCoreGang } from './framework/qbx_core';

// Create a gang
qbxCoreGang.createGang('crips', 'The Crips', playerId);

// Add a member
qbxCoreGang.addGangMember('crips', targetPlayerId, 1);

// Check permissions
if (qbxCoreGang.hasGangPermission(playerId, 3)) {
  // Player has grade 3 or higher
}
```

```typescript
// Client-side
import { qbxCoreGang } from './framework/qbx_core';

// Open gang menu
qbxCoreGang.openGangMenu();

// Create a gang
qbxCoreGang.createGang('crips', 'The Crips');

// Invite player
qbxCoreGang.inviteToGang(targetServerId);
```

## Features

Both frameworks support:
- ✅ Gang creation and deletion
- ✅ Member management (add/remove)
- ✅ Rank/Grade system (0-4)
- ✅ Permission checks based on rank
- ✅ Online member tracking
- ✅ Client-server synchronization
- ✅ Event handlers for updates

## Rank/Grade System

Both frameworks use a 5-level system:
- **0**: Recruit
- **1**: Member
- **2**: Enforcer (can invite)
- **3**: Lieutenant (can kick/promote/demote)
- **4**: Boss (full control)

## Integration

To integrate these frameworks into your main script:

1. Choose your framework (ox_core or qbx_core)
2. Import the framework in your server/client files
3. Use the exported singleton instances (`oxCoreGang` or `qbxCoreGang`)
4. Call the appropriate methods for your gang operations

Example in `src/server/index.ts`:
```typescript
import { oxCoreGang } from './framework/ox_core';
// or
import { qbxCoreGang } from './framework/qbx_core';
```

## Event Handlers

### Server Events (ox_core)
- `{resource}:gang:create` - Create a new gang
- `{resource}:gang:invite` - Invite a player
- `{resource}:gang:kick` - Kick a member
- `{resource}:gang:promote` - Promote a member
- `{resource}:gang:demote` - Demote a member
- `{resource}:gang:leave` - Leave the gang
- `{resource}:gang:requestMenu` - Request gang menu data

### Server Events (qbx_core)
- `qbx_gang:server:createGang` - Create a new gang
- `qbx_gang:server:invitePlayer` - Invite a player
- `qbx_gang:server:kickMember` - Kick a member
- `qbx_gang:server:promoteMember` - Promote a member
- `qbx_gang:server:demoteMember` - Demote a member
- `qbx_gang:server:leaveGang` - Leave the gang
- `qbx_gang:server:requestMenu` - Request gang menu data

### Client Events
- `{resource}:gang:updateData` (ox_core) - Update gang data on client
- `qbx_gang:client:updateData` (qbx_core) - Update gang data on client
- `QBCore:Player:SetPlayerData` (qbx_core) - Sync with QBCore player data updates
