import traitData from '../../data/traits.json';
import type { TraitDefinition, TraitId } from './types';

export const traitCatalog = traitData as TraitDefinition[];
export const traitIds = traitCatalog.map((trait) => trait.id) as TraitId[];

export function getTrait(traitId: TraitId): TraitDefinition | undefined {
  return traitCatalog.find((trait) => trait.id === traitId);
}
