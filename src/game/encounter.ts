import encounters from '../../data/encounters/tutorial.json';
import type { Encounter } from './types';

export const tutorialEncounters = encounters as Encounter[];

export function getEncounter(encounterId: string): Encounter | undefined {
  return tutorialEncounters.find((encounter) => encounter.id === encounterId);
}
