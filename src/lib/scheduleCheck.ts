/**
 * 1日の到着見込みの判定（到着希望に対して何分超過するか）。AIではなくコードで計算する。
 * - ai: AIが書いた時刻から計算（/api/plan が返すプランの各日に必ず付く）
 * - route: 地図の経路の所要時間（渋滞を含まない標準値）＋滞在時間から計算（/api/directions が返す）
 * どちらも時刻は出発日の 00:00 からの通算分で扱い、24時を越えたら翌日として数える。
 */
export interface DayScheduleCheck {
  basis: "ai" | "route";
  /** その日の出発時刻（プランに書かれたもの） */
  startTime: string;
  /** 利用者の到着希望時刻 */
  desiredArrival: string;
  /** 利用者の指定した時間帯そのものが日付をまたいでいる（例: 20:00出発・02:00到着希望） */
  windowCrossesMidnight: boolean;
  /** 到着見込み（00:00〜23:59 の表記。何日後かは arrivalDayOffset） */
  estimatedArrival: string;
  /** 到着見込みが出発日の何日後か（0: 当日、1: 翌日） */
  arrivalDayOffset: number;
  /** 到着希望に対する超過（分）。0以下なら間に合う */
  overrunMinutes: number;
  /** 利用者が認めた範囲を越えて日付をまたぐ */
  overnight: boolean;
}

const MINUTES_PER_DAY = 24 * 60;
/** 前の時刻より12時間以上早い時刻は、日付をまたいだものとみなす（/api/plan の日付またぎ判定と同じ幅） */
const WRAP_BACKSTEP_MINUTES = 12 * 60;

export function clockMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const matched = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  return matched ? Number(matched[1]) * 60 + Number(matched[2]) : null;
}

function formatClock(totalMinutes: number): string {
  const m = ((Math.round(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 利用者の指定した時間帯そのものが日付をまたいでいるか（到着希望が出発時刻より早い） */
export function windowCrossesMidnight(departureTime: unknown, arrivalTime: unknown): boolean {
  const start = clockMinutes(departureTime);
  const end = clockMinutes(arrivalTime);
  return start !== null && end !== null && end < start;
}

function buildCheck(
  basis: DayScheduleCheck["basis"],
  startTime: string,
  desiredArrival: string,
  crosses: boolean,
  arrivalTotalMinutes: number
): DayScheduleCheck | null {
  const desired = clockMinutes(desiredArrival);
  if (desired === null) return null;
  const desiredTotal = desired + (crosses ? MINUTES_PER_DAY : 0);
  const arrivalDayOffset = Math.floor(arrivalTotalMinutes / MINUTES_PER_DAY);
  return {
    basis,
    startTime,
    desiredArrival,
    windowCrossesMidnight: crosses,
    estimatedArrival: formatClock(arrivalTotalMinutes),
    arrivalDayOffset,
    overrunMinutes: Math.round(arrivalTotalMinutes - desiredTotal),
    overnight: arrivalDayOffset > (crosses ? 1 : 0),
  };
}

/**
 * AIが書いた時刻から判定する。各項目を [到着, 出発] の順にたどり、12時間以上の逆戻りは翌日として数える
 * （12時間未満の逆戻りは項目の並びと時刻の食い違いなので、日付は進めない）。
 * 到着見込みは最後の項目の到着時刻。
 */
export function checkScheduleFromAiTimes(
  items: { arrivalTime?: unknown; departureTime?: unknown }[],
  desiredDeparture: unknown,
  desiredArrival: unknown
): DayScheduleCheck | null {
  if (typeof desiredArrival !== "string") return null;
  let offset = 0;
  let prev: number | null = null;
  let startTime: string | null = null;
  let arrivalTotal: number | null = null;

  items.forEach((item, idx) => {
    for (const [field, value] of [["arrival", item?.arrivalTime], ["departure", item?.departureTime]] as const) {
      const minutes = clockMinutes(value);
      if (minutes === null) continue;
      let total = minutes + offset;
      while (prev !== null && prev - total >= WRAP_BACKSTEP_MINUTES) {
        offset += MINUTES_PER_DAY;
        total += MINUTES_PER_DAY;
      }
      if (startTime === null) startTime = String(value).trim();
      if (idx === items.length - 1 && field === "arrival") arrivalTotal = total;
      prev = total;
    }
  });

  if (startTime === null || prev === null) return null;
  // 出発は出発地を出る時刻（最初の項目の出発時刻）。書かれていなければ最初に見つかった時刻
  const firstDeparture = items[0]?.departureTime;
  if (clockMinutes(firstDeparture) !== null) startTime = String(firstDeparture).trim();
  const crosses = windowCrossesMidnight(desiredDeparture, desiredArrival);
  return buildCheck("ai", startTime, desiredArrival, crosses, arrivalTotal ?? prev);
}

/**
 * 地図の経路の所要時間から判定する。出発時刻に、区間の所要時間と途中の地点の滞在時間を順に足す
 * （出発地と到着地の滞在時間は数えない）。legSeconds[i] は地点 i から i+1 への所要時間。
 */
export function checkScheduleFromRoute(input: {
  startTime: string;
  desiredArrival: string;
  windowCrossesMidnight: boolean;
  legSeconds: number[];
  /** 地点ごとの滞在時間（分）。長さは legSeconds.length + 1 */
  stayMinutes: number[];
}): DayScheduleCheck | null {
  const start = clockMinutes(input.startTime);
  if (start === null || input.stayMinutes.length !== input.legSeconds.length + 1) return null;
  let total = start;
  input.legSeconds.forEach((seconds, i) => {
    total += seconds / 60;
    if (i + 1 < input.legSeconds.length) total += input.stayMinutes[i + 1];
  });
  return buildCheck("route", input.startTime, input.desiredArrival, input.windowCrossesMidnight, total);
}

/** 画面・印刷で使う警告の文面（超過していなければ null）。分は5分単位に丸める */
export function formatScheduleWarning(
  check: DayScheduleCheck,
  s: {
    over: string;
    overOvernight: string;
    nextDay: string;
    laterDays: string;
    basisAi: string;
    basisRoute: string;
  }
): { text: string; basis: string } | null {
  if (check.overrunMinutes <= 0) return null;
  const withDay = (time: string, dayOffset: number) =>
    dayOffset <= 0
      ? time
      : dayOffset === 1
        ? s.nextDay.replace("{time}", time)
        : s.laterDays.replace("{time}", time).replace("{n}", String(dayOffset));
  const minutes = Math.max(5, Math.round(check.overrunMinutes / 5) * 5);
  const text = (check.overnight ? s.overOvernight : s.over)
    .replace("{desired}", withDay(check.desiredArrival, check.windowCrossesMidnight ? 1 : 0))
    .replace("{min}", String(minutes))
    .replace("{arrival}", withDay(check.estimatedArrival, check.arrivalDayOffset));
  return { text, basis: check.basis === "route" ? s.basisRoute : s.basisAi };
}

/** 応答JSONから受け取った値が判定の形をしているか（クライアントでの読み取り用） */
export function isDayScheduleCheck(value: unknown): value is DayScheduleCheck {
  const v = value as Partial<DayScheduleCheck> | null;
  return (
    !!v &&
    (v.basis === "ai" || v.basis === "route") &&
    typeof v.startTime === "string" &&
    typeof v.desiredArrival === "string" &&
    typeof v.estimatedArrival === "string" &&
    typeof v.arrivalDayOffset === "number" &&
    typeof v.overrunMinutes === "number" &&
    typeof v.overnight === "boolean" &&
    typeof v.windowCrossesMidnight === "boolean"
  );
}
