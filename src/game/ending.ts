import type { Ending, GameState, PlayerMapTile } from './types';

function countRecordedAccurateTiles(state: GameState): number {
  return state.playerMap.filter((playerTile) => {
    if (playerTile.playerKnowledgeState !== 'recorded' && playerTile.playerKnowledgeState !== 'route_connected') return false;
    const systemTile = state.systemMap.find((tile) => tile.id === playerTile.id);
    return Boolean(
      systemTile
      && playerTile.confirmedTerrainType === systemTile.terrainType
      && playerTile.confirmedPassability === systemTile.passability
      && playerTile.playerRecordedRisk === systemTile.trueRiskLevel,
    );
  }).length;
}

function isDangerMarked(state: GameState, playerTile: PlayerMapTile): boolean {
  const systemTile = state.systemMap.find((tile) => tile.id === playerTile.id);
  return Boolean(systemTile && systemTile.trueRiskLevel >= 7 && (playerTile.playerKnowledgeState === 'recorded' || playerTile.playerKnowledgeState === 'route_connected'));
}

export function evaluateEnding(state: GameState): Ending {
  const recordedTiles = state.playerMap.filter((tile) => tile.playerKnowledgeState === 'recorded' || tile.playerKnowledgeState === 'route_connected');
  const criticalTiles = state.systemMap.filter((tile) => tile.hasCriticalInfo);
  const missingCriticalTiles = criticalTiles.filter((tile) => {
    const playerTile = state.playerMap.find((known) => known.id === tile.id);
    return !playerTile || (playerTile.playerKnowledgeState !== 'recorded' && playerTile.playerKnowledgeState !== 'route_connected');
  }).length;
  const dangerousRouteMarkings = state.playerMap.filter((tile) => isDangerMarked(state, tile)).length;
  const passableRouteDiscovery = state.playerMap.filter((tile) => {
    const systemTile = state.systemMap.find((candidate) => candidate.id === tile.id);
    return systemTile?.passability === 'army_passable' && tile.playerKnowledgeState === 'route_connected';
  }).length;
  const mapAccuracy = recordedTiles.length ? Math.round((countRecordedAccurateTiles(state) / recordedTiles.length) * 100) : 0;
  const survival = Math.max(0, Math.round((state.player.health + state.player.warmth + (100 - state.player.fatigue)) / 3));
  const returnTiming = Math.max(0, 100 - Math.max(0, state.player.day - 1) * 12 - state.actionCount * 2);
  const score = {
    survival,
    mapAccuracy,
    dangerousRouteMarkings: Math.min(100, dangerousRouteMarkings * 18),
    passableRouteDiscovery: Math.min(100, passableRouteDiscovery * 22),
    missingCriticalTiles,
    returnTiming,
    total: 0,
  };
  score.total = Math.max(0, Math.round((score.survival + score.mapAccuracy + score.dangerousRouteMarkings + score.passableRouteDiscovery + score.returnTiming) / 5 - missingCriticalTiles * 4));

  const title = score.total >= 70 ? '한니발이 통과할 수 있는 길' : score.total >= 45 ? '불완전하지만 쓸 수 있는 지도' : '군대가 믿기 어려운 지도';
  return {
    id: score.total >= 70 ? 'army_route_found' : score.total >= 45 ? 'partial_route' : 'failed_route',
    title,
    body: score.total >= 70
      ? '당신의 지도는 위험한 경사와 통과 가능한 고개를 구분한다. 한니발은 이 길에 병사를 맡겨볼 수 있다.'
      : score.total >= 45
        ? '당신은 살아 돌아왔고 길의 일부를 기록했다. 하지만 빠진 구간은 여전히 군대의 목숨을 요구할 것이다.'
        : '당신은 돌아왔지만 지도는 정찰병 개인의 흔적에 가깝다. 군대가 살아남을 길이라고 부르기 어렵다.',
    score,
    details: [
      `생존 점수 ${score.survival}`,
      `지도 정확도 ${score.mapAccuracy}%`,
      `위험 경로 표시 점수 ${score.dangerousRouteMarkings}`,
      `통과 가능 경로 발견 점수 ${score.passableRouteDiscovery}`,
      `누락된 핵심 타일 ${missingCriticalTiles}개`,
      `복귀 시점 점수 ${score.returnTiming}`,
    ],
  };
}
