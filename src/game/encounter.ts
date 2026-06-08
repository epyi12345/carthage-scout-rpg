import mvpEncounters from '../../data/encounters/mvp.json';
import sampleEncounters from '../../data/encounters/samples-v0.2.json';
import tutorialEncounterData from '../../data/encounters/tutorial.json';
import type { Encounter } from './types';

export const tutorialEncounters = tutorialEncounterData as Encounter[];
export const v02SampleEncounters = sampleEncounters as Encounter[];
export const mvpEncounterCatalog = mvpEncounters as Encounter[];
export const allEncounters = [...mvpEncounterCatalog, ...tutorialEncounters, ...v02SampleEncounters];

export function getEncounter(encounterId: string | null): Encounter | undefined {
  if (!encounterId) return undefined;
  return allEncounters.find((encounter) => encounter.id === encounterId);
}
