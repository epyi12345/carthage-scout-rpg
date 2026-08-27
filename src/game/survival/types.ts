export type TraitId =
  | 'mountain_sense'
  | 'cartography'
  | 'restraint'
  | 'survivalist'
  | 'stealth'
  | 'tribal_language'
  | 'pain_tolerance';

export interface TraitDefinition {
  id: TraitId;
  name: string;
  description: string;
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
  traits: TraitId[];
  statusEffects: string[];
}
