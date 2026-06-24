export type GridPoint = {
  x: number;
  y: number;
};

export type Bearing = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type SpecialEncounterType =
  | 'cave'
  | 'cliff'
  | 'village'
  | 'survivor'
  | 'wild_beast'
  | 'camp_trace'
  | 'high_ground'
  | 'tree_view'
  | 'roman_trace'
  | 'roman_camp'
  | 'ravine'
  | 'snowstorm_zone'
  | 'resource'
  | 'trap';

export type SpecialEncounterNode = {
  id: string;
  type: SpecialEncounterType;
  center: GridPoint;
  footprintSize: 3;
  detectionRadius: number;
  activationRadius: number;
  region: string;
  title: string;
  hint: string;
  discovered: boolean;
  visited: boolean;
  recorded: boolean;
};

export type TravelEncounterType =
  | 'snow'
  | 'wild_beast'
  | 'falling_rocks'
  | 'lost_path'
  | 'supply_loss'
  | 'return_warning'
  | 'viewpoint'
  | 'camp_trace';

export type TravelEncounter = {
  id: string;
  type: TravelEncounterType;
  title: string;
  body: string;
  canTriggerDirectionChoice: boolean;
};

export type MapRunState = {
  seed: string;
  size: 30;
  playerPosition: GridPoint;
  currentHeading?: Bearing;
  currentTargetId?: string;
  romanCampId: string;
  specialNodes: SpecialEncounterNode[];
  discoveredPath: GridPoint[];
  visitedNodeIds: string[];
  recordedNodeIds: string[];
  travelQueue: TravelEncounter[];
  travelStepIndex: number;
};

export type DirectionCandidate = {
  nodeId: string;
  bearing: Bearing;
  distance: number;
  label: string;
  hint: string;
};

export type MapTestState = MapRunState;
