import sampleEncounters from '../../data/encounters/samples-v0.2.json';
import tutorialEncounterData from '../../data/encounters/tutorial.json';
import type { Encounter } from './types';

export const tutorialEncounters = tutorialEncounterData as Encounter[];
export const v02SampleEncounters = sampleEncounters as Encounter[];
export const allEncounters = [...tutorialEncounters, ...v02SampleEncounters];

export function getEncounter(encounterId: string): Encounter | undefined {
  return allEncounters.find((encounter) => encounter.id === encounterId);
}
