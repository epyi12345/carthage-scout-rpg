export type TileState = 'unknown' | 'observed' | 'scouted' | 'recorded' | 'route_connected';
export type TerrainType = 'ridge' | 'cliff' | 'snowfield' | 'forest' | 'cave' | 'ravine' | 'frozen_pass' | 'abandoned_camp';
export type Passability = 'army_passable' | 'scout_only' | 'blocked';
export type RiskBand = 'low' | 'medium' | 'high' | 'lethal';
export type Direction = 'north' | 'south' | 'east' | 'west';
export type GameAction = 'move' | 'observe' | 'record' | 'rest' | 'return_to_camp';
export type GamePhase = 'exploring' | 'encounter' | 'returned' | 'dead';

export type ItemType = 'keepsake' | 'material' | 'tool' | 'map' | 'mystic_keepsake';

export type EncounterCategory =
  | 'main_story'
  | 'survival'
  | 'map_info'
  | 'terrain'
  | 'highground'
  | 'camp'
  | 'search'
  | 'tribe_diplomacy'
  | 'roman_enemy'
  | 'sanity'
  | 'item_specific'
  | 'return'
  | 'mystic'
  | 'long_exploration'
  | 'safe_point'
  | 'chain'
  | 'village_request'
  | 'growth'
  | 'threat'
  | 'rescue'
  | 'supply'
  | 'information'
  | 'weather'
  | 'mixed';

export type EncounterOccurrenceType = 'fixed' | 'location_based' | 'conditional' | 'random' | 'chain' | 'revisit';
export type EncounterTone = 'realistic' | 'mysterious' | 'horror' | 'hopeful' | 'harsh';

export type TraitId =
  | 'mountain_sense'
  | 'cartography'
  | 'restraint'
  | 'survivalist'
  | 'stealth'
  | 'tribal_language'
  | 'pain_tolerance';

export type TileMarkState = 'observed' | 'scouted' | 'recorded' | 'connected' | 'route_connected';

export interface TraitDefinition {
  id: TraitId;
  name: string;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  isConsumable: boolean;
  isAchievementItem?: boolean;
  isMystic?: boolean;
}

export interface Coordinate {
  x: number;
  y: number;
}


export type MapPointType = 'major_region' | 'fixed_encounter' | 'main_encounter' | 'optional_resource' | 'return_landmark';
export type PlayerMarkerType = 'route' | 'danger' | 'resource' | 'return' | 'question';

export interface MapPointRelation {
  fromPointId: string;
  toPointId: string;
  distance: number;
  densityHint: 'sparse' | 'normal' | 'dense';
}

export interface MapPoint {
  id: string;
  type: MapPointType;
  x: number;
  y: number;
  discovered: boolean;
  visible: boolean;
  encounterId?: string | null;
  label?: string;
  internalRef?: string;
  influenceRadius: number;
  spacingWeight: number;
}

export interface SystemMap {
  seed: string;
  baseMapId: string;
  points: MapPoint[];
  pointRelations: MapPointRelation[];
  spacingMetadata: {
    minPointDistance: number;
    averagePointDistance: number;
    encounterDensity: number;
  };
}

export interface RevealedArea {
  id: string;
  x: number;
  y: number;
  radius: number;
  source: 'start' | 'movement' | 'observation' | 'marker';
}

export interface PlayerMarker {
  id: string;
  x: number;
  y: number;
  type: PlayerMarkerType;
  note?: string;
}

export interface PlayerMap {
  revealedAreas: RevealedArea[];
  discoveredPointIds: string[];
  visiblePointIds: string[];
  placedMarkers: PlayerMarker[];
  routeNotes: string[];
}

export interface ObservedTileHint {
  terrainHint: string;
  riskBand: RiskBand;
  passabilityHint: string;
}

export interface MapTile extends Coordinate {
  id: string;
  terrainType: TerrainType;
  trueRiskLevel: number;
  passability: Passability;
  hasCriticalInfo: boolean;
  encounterId: string | null;
  returnCost: number;
  returnSignal: 'safe' | 'exposed' | 'confusing' | 'dead_end';

  // Runtime player-map fields are duplicated here for tooling snapshots and tests.
  playerKnowledgeState: TileState;
  playerRecordedRisk?: number;
  playerNotes: string[];
  isRouteMarked: boolean;

  // Backwards-compatible aliases used by older MVP systems.
  terrain: TerrainType;
  risk: number;
  passable: boolean;
  critical: boolean;
  encounterIds: string[];
}

export interface PlayerMapTile extends Coordinate {
  id: string;
  playerKnowledgeState: TileState;
  playerRecordedRisk?: number;
  playerNotes: string[];
  isRouteMarked: boolean;
  observedHint?: ObservedTileHint;
  confirmedTerrainType?: TerrainType;
  confirmedRiskLevel?: number;
  confirmedPassability?: Passability;
  hasEncounterHint?: boolean;

  // Backwards-compatible aliases used by existing UI/engine code.
  state: TileState;
  observedTerrain?: TerrainType;
  observedRisk?: number;
  observedPassable?: boolean;
  notes: string[];
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  food: number;
  warmth: number;
  maxWarmth: number;
  fatigue: number;
  maxFatigue: number;
  morale: number;
  maxMorale: number;
  sanity: number;
  maxSanity: number;
  isAlive: boolean;
  hasReturned: boolean;
  day: number;
  position: string;
  campPosition: string;
}


export interface RecordTileData {
  recordedRisk?: number;
  note?: string;
  markAsRoute?: boolean;
}

export interface ChainState {
  chainId: string;
  step: number;
}

export interface RelationshipScore {
  target: string;
  value: number;
}

export interface MarkedTileTag {
  tileId: string;
  state: TileMarkState;
}

export interface EndingScore {
  survival: number;
  mapAccuracy: number;
  dangerousRouteMarkings: number;
  passableRouteDiscovery: number;
  missingCriticalTiles: number;
  returnTiming: number;
  total: number;
}

export interface Ending {
  id: string;
  title: string;
  description?: string;
  body: string;
  score: EndingScore;
  details: string[];
}

export interface GameState {
  runId: string;
  seed: string;
  currentDay: number;
  maxDays: number;
  playerPosition: string;
  playerState: PlayerState;
  inventory: string[];
  log: string[];
  gamePhase: GamePhase;

  mapSeed: string;
  mapSize: number;
  systemMap: MapTile[];
  playerMap: PlayerMapTile[];
  parchmentSystemMap: SystemMap;
  parchmentPlayerMap: PlayerMap;
  player: PlayerState;
  actionCount: number;
  currentEncounterId: string | null;
  resolvedEncounterIds: string[];
  lastLog: string[];
  ending: Ending | null;
  isDead: boolean;
  deathReason: string | null;
  flags: string[];
  items: string[];
  hasConsumedPendant: boolean;
  pendantTransformedInto?: string | null;
  traits: TraitId[];
  statusEffects: string[];
  chainStates: ChainState[];
  relationships: RelationshipScore[];
  markedTileTags: MarkedTileTag[];
  feedbackMessage?: string | null;

  // Legacy/tutorial compatibility fields kept so old JSON saves can migrate safely.
  day: number;
  slot: number;
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  bodyTemp: number;
  maxBodyTemp: number;
  food: number;
  mapTools: number;
  location: string;
  tutorialComplete: boolean;
  mapUnlocked: boolean;
  recordedTiles: string[];
  observedTiles: string[];
  scoutedTiles: string[];
  connectedTiles: string[];
  startLocation: string;
}

export interface EncounterTrigger {
  terrainTypes?: TerrainType[];
  minRisk?: number;
  maxRisk?: number;
  requiresReturn?: boolean;
  flags?: string[];
}

export interface EncounterConditions {
  requiredItems?: string[];
  forbiddenItems?: string[];
  requiredFlags?: string[];
  forbiddenFlags?: string[];
  requiredTraits?: TraitId[];
  location?: string;
}

export interface EncounterDuration {
  slotCost?: number;
  dayCost?: number;
  minSlots?: number;
  maxDays?: number;
}

export interface MapEffect {
  tileId: string;
  state: TileMarkState;
  tag?: string;
  note?: string;
}

export interface ReturnEffect {
  id: string;
  description: string;
  returnRisk?: number;
  safePoint?: boolean;
}

export interface EndingEffect {
  scoreKey: string;
  value: number;
  description?: string;
}

export interface EncounterEffects {
  health?: number;
  warmth?: number;
  fatigue?: number;
  food?: number;
  day?: number;
  healthDelta?: number;
  warmthDelta?: number;
  fatigueDelta?: number;
  foodDelta?: number;
  dayDelta?: number;
  moraleDelta?: number;
  sanityDelta?: number;

  hp?: number;
  sanity?: number;
  bodyTemp?: number;
  mapTools?: number;
  slot?: number;

  addItems?: string[];
  removeItems?: string[];
  addItem?: string;
  removeItem?: string;
  addFlags?: string[];
  removeFlags?: string[];
  addFlag?: string;
  removeFlag?: string;
  setLocation?: string;
  location?: string;
  setMapUnlocked?: boolean;
  mapUnlocked?: boolean;
  setTutorialComplete?: boolean;
  tutorialComplete?: boolean;
  isDead?: boolean;
  deathReason?: string;
  nextEncounterId?: string | null;
  recordCurrentTile?: boolean;
  consumePendant?: boolean;
  transformPendantInto?: string;
  addTrait?: TraitId;
  addStatus?: string[];
  removeStatus?: string[];
  addRelationship?: { target: string; value: number };
  revealTile?: { tileId: string; state: TileState };
  corruptMapInfo?: { tileId: string; note: string; recordedRisk?: number };
  markRisk?: { tileId: string; risk: number; note?: string };
  markTile?: { tileId: string; state: TileMarkState };
  addChainState?: { chainId: string; step: number };
}

export interface EncounterChoice {
  id: string;
  text: string;
  disabled?: boolean;
  disabledReason?: string;
  disabledMessage?: string;
  conditions?: EncounterConditions;
  effects?: EncounterEffects;
  consequences?: EncounterEffects;
  logMessage?: string;
  resultText?: string;
  nextEncounterId?: string | null;
}

export type Choice = EncounterChoice;

export interface Encounter {
  id: string;
  title: string;
  category: EncounterCategory;
  subCategory?: string;
  occurrenceType: EncounterOccurrenceType;
  tone?: EncounterTone;
  description?: string;
  body: string;
  imagePlaceholder?: string;
  trigger?: EncounterTrigger;
  duration?: EncounterDuration;
  conditions?: EncounterConditions;
  choices: EncounterChoice[];
  followUps?: string[];
  mapEffects?: MapEffect[];
  returnEffects?: ReturnEffect[];
  endingEffects?: EndingEffect[];
}

export type TabId = 'story' | 'map' | 'inventory' | 'dev';
