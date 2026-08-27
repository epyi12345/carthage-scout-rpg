export type TileState = 'unknown' | 'observed' | 'scouted' | 'recorded' | 'route_connected';
export type TerrainType = 'ridge' | 'cliff' | 'snowfield' | 'forest' | 'cave' | 'ravine' | 'frozen_pass' | 'abandoned_camp';
export type Passability = 'army_passable' | 'scout_only' | 'blocked';
export type RiskBand = 'low' | 'medium' | 'high' | 'lethal';
export type Direction = 'north' | 'south' | 'east' | 'west';
export type GameAction = 'move' | 'observe' | 'record' | 'rest' | 'return_to_camp';
export type TileMarkState = 'observed' | 'scouted' | 'recorded' | 'connected' | 'route_connected';

export interface Coordinate { x: number; y: number }
export type MapPointType = 'major_region' | 'fixed_encounter' | 'main_encounter' | 'optional_resource' | 'return_landmark';
export type PlayerMarkerType = 'route' | 'danger' | 'resource' | 'return' | 'question';
export interface MapPointRelation { fromPointId: string; toPointId: string; distance: number; densityHint: 'sparse' | 'normal' | 'dense' }
export interface MapPoint { id: string; type: MapPointType; x: number; y: number; discovered: boolean; visible: boolean; encounterId?: string | null; label?: string; internalRef?: string; influenceRadius: number; spacingWeight: number }
export interface SystemMap { seed: string; baseMapId: string; points: MapPoint[]; pointRelations: MapPointRelation[]; spacingMetadata: { minPointDistance: number; averagePointDistance: number; encounterDensity: number } }
export interface RevealedArea { id: string; x: number; y: number; radius: number; source: 'start' | 'movement' | 'observation' | 'marker' }
export interface PlayerMarker { id: string; x: number; y: number; type: PlayerMarkerType; note?: string }
export interface PlayerMap { revealedAreas: RevealedArea[]; discoveredPointIds: string[]; visiblePointIds: string[]; placedMarkers: PlayerMarker[]; routeNotes: string[] }
export interface ObservedTileHint { terrainHint: string; riskBand: RiskBand; passabilityHint: string }
export interface MapTile extends Coordinate { id: string; terrainType: TerrainType; trueRiskLevel: number; passability: Passability; hasCriticalInfo: boolean; encounterId: string | null; returnCost: number; returnSignal: 'safe' | 'exposed' | 'confusing' | 'dead_end'; playerKnowledgeState: TileState; playerRecordedRisk?: number; playerNotes: string[]; isRouteMarked: boolean; terrain: TerrainType; risk: number; passable: boolean; critical: boolean; encounterIds: string[] }
export interface PlayerMapTile extends Coordinate { id: string; playerKnowledgeState: TileState; playerRecordedRisk?: number; playerNotes: string[]; isRouteMarked: boolean; observedHint?: ObservedTileHint; confirmedTerrainType?: TerrainType; confirmedRiskLevel?: number; confirmedPassability?: Passability; hasEncounterHint?: boolean; state: TileState; observedTerrain?: TerrainType; observedRisk?: number; observedPassable?: boolean; notes: string[] }
export interface RecordTileData { recordedRisk?: number; note?: string; markAsRoute?: boolean }
export interface MarkedTileTag { tileId: string; state: TileMarkState }
export type GridPoint = { x: number; y: number };
export type Bearing = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type SpecialEncounterType = 'cave' | 'cliff' | 'village' | 'survivor' | 'wild_beast' | 'camp_trace' | 'high_ground' | 'tree_view' | 'roman_trace' | 'roman_camp' | 'ravine' | 'snowstorm_zone' | 'resource' | 'trap';
export interface SpecialEncounterNode { id: string; type: SpecialEncounterType; center: GridPoint; footprintSize: 3; detectionRadius: number; activationRadius: number; region: string; title: string; hint: string; discovered: boolean; visited: boolean; recorded: boolean }
export type TravelEncounterType = 'snow' | 'wild_beast' | 'falling_rocks' | 'lost_path' | 'supply_loss' | 'return_warning' | 'viewpoint' | 'camp_trace';
export interface TravelEncounter { id: string; type: TravelEncounterType; title: string; body: string; canTriggerDirectionChoice: boolean }
export interface DirectionCandidate { nodeId: string; bearing: Bearing; distance: number; label: string; hint: string }
export interface ExplorationTile { id: string; position: GridPoint; visited: boolean; observed: boolean; scouted: boolean; recorded: boolean; routeMarked: boolean; recordedRisk?: number; notes: string[] }
export interface GameMapState {
  seed: string;
  size: 30;
  tiles: ExplorationTile[];
  startPosition: GridPoint;
  goalPosition: GridPoint;
  currentPosition: GridPoint;
  currentHeading?: Bearing;
  currentTargetId?: string;
  romanCampId: string;
  specialNodes: SpecialEncounterNode[];
  discoveredPath: GridPoint[];
  visitedNodeIds: string[];
  recordedNodeIds: string[];
  travelQueue: TravelEncounter[];
  travelStepIndex: number;
  moveCount: number;
  mapTools: number;
  tutorialComplete: boolean;
  unlocked: boolean;
}
