import type { GameState } from '../state/types';
import type { TerrainType, TileMarkState, TileState } from '../map/types';
import type { TraitId } from '../survival/types';
export type EncounterCategory = 'main_story'|'survival'|'map_info'|'terrain'|'highground'|'camp'|'search'|'tribe_diplomacy'|'roman_enemy'|'sanity'|'item_specific'|'return'|'mystic'|'long_exploration'|'safe_point'|'chain'|'village_request'|'growth'|'threat'|'rescue'|'supply'|'information'|'weather'|'mixed';
export type EncounterOccurrenceType = 'fixed'|'location_based'|'conditional'|'random'|'chain'|'revisit';
export type EncounterTone = 'realistic'|'mysterious'|'horror'|'hopeful'|'harsh';
export interface ChainState { chainId: string; step: number }
export interface RelationshipScore { target: string; value: number }
export interface EncounterState { currentId: string | null; resolvedIds: string[]; appliedChoiceIds: string[]; hasConsumedPendant: boolean; pendantTransformedInto?: string | null; chainStates: ChainState[]; relationships: RelationshipScore[] }
export interface EncounterTrigger { terrainTypes?: TerrainType[]; minRisk?: number; maxRisk?: number; requiresReturn?: boolean; flags?: string[] }
export interface EncounterConditions { requiredItems?: string[]; forbiddenItems?: string[]; requiredFlags?: string[]; forbiddenFlags?: string[]; requiredTraits?: TraitId[]; location?: string }
export interface EncounterDuration { slotCost?: number; dayCost?: number; minSlots?: number; maxDays?: number }
export interface MapEffect { tileId: string; state: TileMarkState; tag?: string; note?: string }
export interface ReturnEffect { id: string; description: string; returnRisk?: number; safePoint?: boolean }
export interface EndingEffect { scoreKey: string; value: number; description?: string }
export interface EncounterEffects { health?: number; warmth?: number; fatigue?: number; food?: number; day?: number; healthDelta?: number; warmthDelta?: number; fatigueDelta?: number; foodDelta?: number; dayDelta?: number; moraleDelta?: number; sanityDelta?: number; hp?: number; sanity?: number; bodyTemp?: number; mapTools?: number; slot?: number; addItems?: string[]; removeItems?: string[]; addItem?: string; removeItem?: string; addFlags?: string[]; removeFlags?: string[]; addFlag?: string; removeFlag?: string; setLocation?: string; location?: string; setMapUnlocked?: boolean; mapUnlocked?: boolean; setTutorialComplete?: boolean; tutorialComplete?: boolean; isDead?: boolean; deathReason?: string; nextEncounterId?: string | null; recordCurrentTile?: boolean; consumePendant?: boolean; transformPendantInto?: string; addTrait?: TraitId; addStatus?: string[]; removeStatus?: string[]; addRelationship?: { target: string; value: number }; revealTile?: { tileId: string; state: TileState }; corruptMapInfo?: { tileId: string; note: string; recordedRisk?: number }; markRisk?: { tileId: string; risk: number; note?: string }; markTile?: { tileId: string; state: TileMarkState }; addChainState?: { chainId: string; step: number } }
export interface EncounterChoice { id: string; text: string; disabled?: boolean; disabledReason?: string; disabledMessage?: string; conditions?: EncounterConditions; effects?: EncounterEffects; consequences?: EncounterEffects; logMessage?: string; resultText?: string; nextEncounterId?: string | null }
export type Choice = EncounterChoice;
export interface Encounter { id: string; title: string; category: EncounterCategory; subCategory?: string; occurrenceType: EncounterOccurrenceType; tone?: EncounterTone; description?: string; body: string; imagePlaceholder?: string; trigger?: EncounterTrigger; duration?: EncounterDuration; conditions?: EncounterConditions; choices: EncounterChoice[]; followUps?: string[]; mapEffects?: MapEffect[]; returnEffects?: ReturnEffect[]; endingEffects?: EndingEffect[] }
export type ChoiceApplyResult = { applied: true; state: GameState; resultText: string } | { applied: false; state: GameState; reason: string };
