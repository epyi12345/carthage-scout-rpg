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
  | 'growth';

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

export type TileMarkState = 'observed' | 'scouted' | 'recorded' | 'connected';

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

export interface GameState {
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
  isDead: boolean;
  deathReason: string | null;
  tutorialComplete: boolean;
  mapUnlocked: boolean;
  currentEncounterId: string;
  flags: string[];
  items: string[];
  hasConsumedPendant: boolean;
  pendantTransformedInto?: string | null;
  traits: TraitId[];
  statusEffects: string[];
  chainStates: ChainState[];
  relationships: RelationshipScore[];
  markedTileTags: MarkedTileTag[];
  recordedTiles: string[];
  observedTiles: string[];
  scoutedTiles: string[];
  connectedTiles: string[];
  startLocation: string;
  feedbackMessage?: string | null;
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
  hp?: number;
  sanity?: number;
  bodyTemp?: number;
  food?: number;
  mapTools?: number;
  day?: number;
  slot?: number;

  addItems?: string[];
  removeItems?: string[];

  addFlags?: string[];
  removeFlags?: string[];

  setLocation?: string;
  location?: string;
  setMapUnlocked?: boolean;
  mapUnlocked?: boolean;
  setTutorialComplete?: boolean;
  tutorialComplete?: boolean;

  isDead?: boolean;
  deathReason?: string;
  nextEncounterId?: string;
  recordCurrentTile?: boolean;

  consumePendant?: boolean;
  transformPendantInto?: string;

  addTrait?: TraitId;
  addStatus?: string[];
  removeStatus?: string[];

  addRelationship?: {
    target: string;
    value: number;
  };

  markTile?: {
    tileId: string;
    state: TileMarkState;
  };

  addChainState?: {
    chainId: string;
    step: number;
  };
}

export interface EncounterChoice {
  id: string;
  text: string;
  disabled?: boolean;
  disabledReason?: string;
  disabledMessage?: string;
  conditions?: EncounterConditions;
  effects?: EncounterEffects;
  nextEncounterId?: string;
}

export interface Encounter {
  id: string;
  title: string;
  category: EncounterCategory;
  subCategory?: string;
  occurrenceType: EncounterOccurrenceType;
  tone?: EncounterTone;
  body: string;
  duration?: EncounterDuration;
  conditions?: EncounterConditions;
  choices: EncounterChoice[];
  followUps?: string[];
  mapEffects?: MapEffect[];
  returnEffects?: ReturnEffect[];
  endingEffects?: EndingEffect[];
}

export type TabId = 'story' | 'map' | 'inventory' | 'dev';
