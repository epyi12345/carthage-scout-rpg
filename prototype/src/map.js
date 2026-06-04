export function createInitialMap(size) {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      x,
      y,
      type: 'unknown',
      state: '미확인',
      observed: false,
      recorded: false,
      routeConnected: false,
    }))
  );
}
