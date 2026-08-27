import type { EncounterState } from '../encounter/types';
import type { InventoryState } from '../inventory/types';
import type { GameMapState } from '../map/types';
import type { RunState } from '../run/types';
import type { PlayerState } from '../survival/types';
export type GamePhase = 'tutorial' | 'direction' | 'encounter' | 'returned' | 'dead';
export interface GameLog { id: string; message: string }
export type GameFlags = string[];
export interface EndingScore { survival: number; mapAccuracy: number; dangerousRouteMarkings: number; passableRouteDiscovery: number; missingCriticalTiles: number; returnTiming: number; total: number }
export interface Ending { id: string; title: string; description?: string; body: string; score: EndingScore; details: string[] }
export interface GameState { schemaVersion: number; phase: GamePhase; run: RunState; player: PlayerState; inventory: InventoryState; map: GameMapState; encounter: EncounterState; logs: GameLog[]; flags: GameFlags; deathReason: string | null; feedbackMessage?: string | null }
export type TabId = 'story' | 'map' | 'inventory' | 'dev';
