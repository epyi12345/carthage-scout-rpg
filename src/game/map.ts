import type { GameState } from './types';

const rows = ['I', 'J', 'K', 'L', 'M'];
const columns = [4, 5, 6, 7, 8];

export interface MapTile {
  coordinate: string;
  symbol: 'S' | 'P' | '■' | '?' | '□';
}

export function createMiniMap(state: GameState): MapTile[] {
  return rows.flatMap((row) =>
    columns.map((column) => {
      const coordinate = `${row}${column}`;
      let symbol: MapTile['symbol'] = '□';
      if (state.observedTiles.includes(coordinate)) symbol = '?';
      if (state.recordedTiles.includes(coordinate)) symbol = '■';
      if (coordinate === state.startLocation) symbol = 'S';
      if (coordinate === state.location) symbol = 'P';
      return { coordinate, symbol };
    }),
  );
}
