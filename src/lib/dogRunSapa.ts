import sapaData from "@/data/dog-run-sapa.json";

/**
 * ドッグランのある SA・PA（各高速道路会社の公式サイトで確認できたものだけ。登録手順は CLAUDE.md）。
 * 座標は持たないため、犬連れ・高速ありのプランでは全件を1件1行で AI に渡す。
 */
export interface DogRunSapa {
  id: string;
  name: string;
  company: string;
  road: string;
  /** "上り" / "下り" / "上下共用"（1か所を両方向で使う施設） */
  direction: string;
  prefecture: string;
  /** 休止期間・利用時間など（公式の表記のまま）。無ければ空文字 */
  note: string;
  sourceUrl: string;
  confirmedAt: string;
}

const sapas: DogRunSapa[] = sapaData;

/** 「道路名／名称／上り・下り・共用／都道府県／備考」の1件1行 */
function toLine(s: DogRunSapa): string {
  const direction = s.direction === "上下共用" ? "上下共用" : `${s.direction}線`;
  return `  - ${s.road}／${s.name}／${direction}／${s.prefecture}${s.note ? `／${s.note}` : ""}`;
}

/** 犬連れ・高速ありのプラン用に、プロンプトへ足す指示文を作る */
export function buildDogRunSapaInstruction(): string {
  return `
- **ドッグランのあるSA・PAの一覧（各高速道路会社の公式サイトで確認済み。道路名／名称／方向／都道府県／備考）**:
${sapas.map(toLine).join("\n")}
  - 実際に通る高速道路の、進行方向に合う側（上り線・下り線）の施設だけを休憩候補にすること
  - 「上下共用」の施設や、備考に反対側から利用できると書かれた施設は、どちらの向きで通るときも使ってよい
  - 経路上に合う施設がなければ使わないこと。ドッグランに寄るために遠回りさせないこと
  - 旅行日が備考の休止・閉鎖期間に当たる施設、到着時刻が利用時間外になる施設は使わないこと
  - 行程に入れるときは、名称に「上り線」「下り線」を明記し（例: 〇〇SA（下り線））、備考の内容（利用時間など）をdescriptionに含めること
  - この一覧にないSA・PAについて「ドッグランがある」と書かないこと
  - 休憩として自然な回数にとどめ、入れすぎないこと`;
}
