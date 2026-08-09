import type { LifeMapEntry } from "@/types/lifemap";
import type { LangCode } from "./i18n/dictionaries";
import { buildJournalLink } from "./journalLink";
import { TRIP_WINDOW_DAYS } from "@/lib/shiori/tripSelection";

/**
 * 記録を「1回の旅行」単位にまとめるための、隣り合う記録の日付差の上限（日）。
 *
 * TRIP_WINDOW_DAYS は「最大3泊4日」＝日付の差にすると3日ぶんを指すため、
 * 窓の日数から1を引いた値が間隔の上限になる。
 * /shiori 側は同じ値を固定窓として使うので、長い旅行では区切り方が変わる。
 * その差異は意図的なもので、理由は tripSelection.ts のコメントに書いてある。
 */
const MAX_GAP_DAYS = TRIP_WINDOW_DAYS - 1;

/** 日付順に連続した記録のまとまり（＝1回の旅行）。 */
export type TripGroup = {
  /** 含まれる記録。日付の古い順（同日は登録順）。 */
  entries: LifeMapEntry[];
  /** 最初の日 "YYYY-MM-DD" */
  from: string;
  /** 最後の日 "YYYY-MM-DD"。単日の旅行では from と同じ。 */
  to: string;
};

/**
 * "YYYY-MM-DD" 同士の日数差。
 * 正午どうしで比べるのは、夏時間のある地域で1日ぶんずれないようにするため。
 * （/shiori 側の daysBetween と同じ考え方）
 */
function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/**
 * 記録を旅行単位にグループ化する。
 *
 * 日付の古い順に並べ、直前の記録との差が MAX_GAP_DAYS 以内なら同じ旅行として連鎖させる。
 * 毎日記録が残っていれば10日間の旅行もひとつのグループになる。
 *
 * 日付が未入力の記録は、どの旅行にも属さないものとして除外する
 * （旅行記に渡す並び順を決められず、他の記録に紛れ込ませると日付範囲の表示も壊れるため）。
 * 呼び出し側は、除外された記録を一覧から消さないよう自分で拾うこと。
 */
export function groupEntriesIntoTrips(entries: LifeMapEntry[]): TripGroup[] {
  const sorted = entries
    .filter((entry) => entry.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  const groups: TripGroup[] = [];
  let current: LifeMapEntry[] = [];

  const flush = () => {
    if (current.length === 0) return;
    groups.push({
      entries: current,
      from: current[0].date,
      to: current[current.length - 1].date,
    });
    current = [];
  };

  for (const entry of sorted) {
    if (current.length > 0 && daysBetween(current[current.length - 1].date, entry.date) > MAX_GAP_DAYS) {
      flush();
    }
    current.push(entry);
  }
  flush();

  return groups;
}

/**
 * 旅行グループをAI旅行記メーカーへ渡すリンク。
 *
 * URLの組み立て（source・言語分岐・末尾スラッシュ）は journalLink.ts に集約してある。
 * ここは「旅行グループ → ID列」の対応づけだけを担う。
 */
export function buildTripJournalLink(group: TripGroup, lang: LangCode): string {
  return buildJournalLink(lang, group.entries.map((entry) => entry.id));
}
