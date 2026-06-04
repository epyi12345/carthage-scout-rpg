export type ItemType = 'keepsake' | 'material' | 'tool' | 'map';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  isConsumable: boolean;
  isAchievementItem?: boolean;
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
  recordedTiles: string[];
  observedTiles: string[];
  startLocation: string;
  feedbackMessage?: string | null;
}

export interface ChoiceEffects {
  hp?: number;
  sanity?: number;
  bodyTemp?: number;
  food?: number;
  mapTools?: number;
  slot?: number;
  location?: string;
  isDead?: boolean;
  deathReason?: string;
  tutorialComplete?: boolean;
  mapUnlocked?: boolean;
  nextEncounterId?: string;
  addFlags?: string[];
  addItems?: string[];
  recordCurrentTile?: boolean;
}

export interface EncounterChoice {
  id: string;
  text: string;
  disabledMessage?: string;
  effects: ChoiceEffects;
}

export interface Encounter {
  id: string;
  title: string;
  body: string;
  choices: EncounterChoice[];
}

export type TabId = 'story' | 'map' | 'inventory' | 'dev';
