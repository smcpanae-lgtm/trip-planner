// 市町村代表点を「天気セル」と「キャッシュタイル」にまとめる（サーバー専用）。
//
// - 天気セル（WEATHER_CELL_DEG 四方）：同じセル・同じ陸地の市町村は、メンバー代表点の平均地点の予報を共有する。
// - キャッシュタイル（WEATHER_TILE_DEG 四方）：Open-Meteo へはタイル内の全セルをまとめて1リクエストで取得する。
//   検索条件に関係なくタイルごとのURLが同じになるため、Next.js のデータキャッシュを利用者間で共有できる。

import municipalitiesData from "@/data/hare/municipalities.json";
import { MAX_LOCATIONS_PER_REQUEST, WEATHER_CELL_DEG, WEATHER_TILE_DEG } from "./constants";

export interface Municipality {
  code: string;
  pref: string;
  name: string;
  lat: number;
  lng: number;
  land: string;
}

export interface WeatherCell {
  key: string;
  lat: number;
  lng: number;
  tileKey: string;
}

const CELLS_PER_TILE = Math.round(WEATHER_TILE_DEG / WEATHER_CELL_DEG);
if (Math.abs(CELLS_PER_TILE * WEATHER_CELL_DEG - WEATHER_TILE_DEG) > 1e-9) {
  throw new Error("WEATHER_TILE_DEG は WEATHER_CELL_DEG で割り切れる値にしてください");
}

export const municipalities: Municipality[] = municipalitiesData as Municipality[];

function cellIndex(deg: number): number {
  // 0.2 などの浮動小数誤差で境界がずれないよう、わずかに寄せてから切り捨てる
  return Math.floor(deg / WEATHER_CELL_DEG + 1e-9);
}

function buildGrid() {
  const members = new Map<string, Municipality[]>();
  const cellOf = new Map<string, string>();
  for (const m of municipalities) {
    const ci = cellIndex(m.lat);
    const cj = cellIndex(m.lng);
    const key = `${m.land}|${ci}|${cj}`;
    const list = members.get(key);
    if (list) list.push(m);
    else members.set(key, [m]);
    cellOf.set(m.code, key);
  }

  const cells = new Map<string, WeatherCell>();
  const tiles = new Map<string, WeatherCell[]>();
  for (const [key, list] of members) {
    const [, ci, cj] = key.split("|").map(Number);
    const tileKey = `${Math.floor(ci / CELLS_PER_TILE)}_${Math.floor(cj / CELLS_PER_TILE)}`;
    const lat = list.reduce((s, m) => s + m.lat, 0) / list.length;
    const lng = list.reduce((s, m) => s + m.lng, 0) / list.length;
    const cell: WeatherCell = {
      key,
      lat: Math.round(lat * 1000) / 1000,
      lng: Math.round(lng * 1000) / 1000,
      tileKey,
    };
    cells.set(key, cell);
    const tileCells = tiles.get(tileKey);
    if (tileCells) tileCells.push(cell);
    else tiles.set(tileKey, [cell]);
  }

  // URL を決定的にするため、タイル内のセル順を固定する
  const tileChunks = new Map<string, WeatherCell[][]>();
  for (const [tileKey, tileCells] of tiles) {
    tileCells.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    const chunks: WeatherCell[][] = [];
    for (let i = 0; i < tileCells.length; i += MAX_LOCATIONS_PER_REQUEST) {
      chunks.push(tileCells.slice(i, i + MAX_LOCATIONS_PER_REQUEST));
    }
    tileChunks.set(tileKey, chunks);
  }

  return { cells, cellOf, tileChunks };
}

const grid = buildGrid();

export function getCellOf(m: Municipality): WeatherCell {
  const cell = grid.cells.get(grid.cellOf.get(m.code)!);
  if (!cell) throw new Error(`cell not found: ${m.code}`);
  return cell;
}

/** タイルごとの Open-Meteo リクエスト単位（地点数が多いタイルは分割） */
export function getTileChunks(tileKey: string): WeatherCell[][] {
  return grid.tileChunks.get(tileKey) ?? [];
}
