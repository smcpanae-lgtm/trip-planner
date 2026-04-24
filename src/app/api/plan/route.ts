import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Support multiple API keys for quota distribution (key1 → key2 on 429)
function getApiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ].filter((k): k is string => !!k && k.length > 10);
}

interface PlanRequest {
  days: {
    dayIndex: number;
    departure: string;
    departureTime: string;
    destinations: {
      name: string;
      lat?: number;
      lng?: number;
      isOmakase: boolean;
    }[];
    arrival: string;
    arrivalTime: string;
    includeLunch: boolean;
    lunchLocation: string;
    lunchGenre: string;
    includeDinner: boolean;
    dinnerLocation: string;
    dinnerGenre: string;
    firstDestId?: string;
  }[];
  withDog: boolean;
  aiOmakase?: boolean;
  useHighway?: boolean; // true (default) = use highways; false = general roads only
  travelDate?: string; // "YYYY-MM-DD"
  travelerProfile?: {
    partyType: string;
    ageRange: string;
    hobbies: string;
    hasChildren: boolean;
    childAges: string;
  };
}

// Japanese national holidays (fixed + some calculated)
function getJapaneseHolidays(year: number): { date: string; name: string }[] {
  const holidays: { date: string; name: string }[] = [
    { date: `${year}-01-01`, name: "元日" },
    { date: `${year}-02-11`, name: "建国記念の日" },
    { date: `${year}-02-23`, name: "天皇誕生日" },
    { date: `${year}-03-20`, name: "春分の日" },
    { date: `${year}-04-29`, name: "昭和の日" },
    { date: `${year}-05-03`, name: "憲法記念日" },
    { date: `${year}-05-04`, name: "みどりの日" },
    { date: `${year}-05-05`, name: "こどもの日" },
    { date: `${year}-07-21`, name: "海の日" }, // 3rd Monday approx
    { date: `${year}-08-11`, name: "山の日" },
    { date: `${year}-09-16`, name: "敬老の日" }, // 3rd Monday approx
    { date: `${year}-09-23`, name: "秋分の日" },
    { date: `${year}-10-14`, name: "スポーツの日" }, // 2nd Monday approx
    { date: `${year}-11-03`, name: "文化の日" },
    { date: `${year}-11-23`, name: "勤労感謝の日" },
  ];
  // Happy Monday holidays - calculate more precisely
  holidays.push({ date: getNthMonday(year, 1, 2), name: "成人の日" }); // 2nd Monday of Jan
  return holidays;
}

function getNthMonday(year: number, month: number, n: number): string {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === 1) {
      count++;
      if (count === n) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }
  return "";
}

function analyzeTravelDate(dateStr: string, numDays: number): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"][date.getDay()];

  const holidays = getJapaneseHolidays(year);
  const dateInfos: string[] = [];

  // Check each day of the trip
  for (let i = 0; i < numDays; i++) {
    const tripDate = new Date(date);
    tripDate.setDate(tripDate.getDate() + i);
    const tripDateStr = tripDate.toISOString().split("T")[0];
    const tripDayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][tripDate.getDay()];
    const isWeekend = tripDate.getDay() === 0 || tripDate.getDay() === 6;
    const holiday = holidays.find((h) => h.date === tripDateStr);

    let dayInfo = `${i + 1}日目: ${tripDateStr}（${tripDayOfWeek}）`;
    if (holiday) {
      dayInfo += ` - 🎌 祝日「${holiday.name}」`;
    }
    if (isWeekend) {
      dayInfo += " - 休日";
    }
    dateInfos.push(dayInfo);
  }

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isHoliday = holidays.some((h) => h.date === dateStr);
  const isFriday = date.getDay() === 5;

  // Check for consecutive holidays (GW, Obon, year-end, etc.)
  let seasonalNote = "";
  if (month === 4 && day >= 28 || month === 5 && day <= 6) {
    seasonalNote = "⚠️ ゴールデンウィーク期間です。全国的に大渋滞が予想されます。早朝出発（6:00以前）を強く推奨します。";
  } else if (month === 8 && day >= 10 && day <= 16) {
    seasonalNote = "⚠️ お盆期間です。帰省ラッシュにより高速道路が大渋滞します。時間に大幅な余裕を持たせてください。";
  } else if (month === 12 && day >= 28 || month === 1 && day <= 3) {
    seasonalNote = "⚠️ 年末年始です。高速道路や観光地が混雑します。";
  } else if (month === 9 && day >= 14 && day <= 23) {
    seasonalNote = "シルバーウィーク付近です。混雑する可能性があります。";
  }

  // Season and events
  let seasonInfo = "";
  if (month >= 3 && month <= 4) {
    seasonInfo = "🌸 桜のシーズンです。花見スポットは混雑しますが、ルート上の桜名所があれば提案してください。";
  } else if (month >= 6 && month <= 7 && day <= 20) {
    seasonInfo = "☔ 梅雨の時期です。雨天時の屋内スポットの代替案も考慮してください。";
  } else if (month >= 7 && month <= 8) {
    seasonInfo = "🏖️ 夏季です。海水浴場・花火大会などの夏イベントがあれば提案してください。暑さ対策のアドバイスも入れてください。";
  } else if (month >= 10 && month <= 11) {
    seasonInfo = "🍁 紅葉のシーズンです。ルート上の紅葉名所があれば提案してください。紅葉スポットは週末に特に混雑します。";
  } else if (month === 12 || month <= 2) {
    seasonInfo = "❄️ 冬季です。路面凍結や積雪の可能性があります。スタッドレスタイヤやチェーンの準備を推奨してください。";
  }

  let trafficNote = "";
  if (isWeekend || isHoliday) {
    trafficNote = "🚗 休日・祝日のため、高速道路の渋滞が予想されます。特に都市部からの出入口付近やSA/PA周辺で混雑します。出発時間を早めに設定し、移動時間に余裕（通常の1.3〜1.5倍）を持たせてください。";
  } else if (isFriday) {
    trafficNote = "🚗 金曜日のため、夕方以降は帰宅ラッシュおよび週末旅行の出発車両で高速道路が混雑する可能性があります。";
  } else {
    trafficNote = "平日のため、通勤時間帯（7:00〜9:00, 17:00〜19:00）以外は比較的スムーズです。";
  }

  return `
## 旅行日程情報
- 出発日: ${year}年${month}月${day}日（${dayOfWeek}）
${dateInfos.map((d) => `- ${d}`).join("\n")}
${isHoliday || isWeekend ? "- ⚠️ 休日/祝日のため観光地は混雑が予想されます" : "- 平日のため観光地は比較的空いています"}

## 交通状況の予測
${trafficNote}
${seasonalNote ? `\n${seasonalNote}` : ""}

## 季節情報
${seasonInfo || "特記事項なし"}

上記の日程・交通・季節情報を踏まえて以下を考慮してください：
- 渋滞予測に基づき移動時間を適切に調整すること
- 混雑する時間帯を避けたスケジュールを提案すること
- 季節のイベントや見どころがあれば積極的に提案すること
- 当日の曜日・祝日に応じた観光地の混雑度をtipsに含めること
- 休日の場合、駐車場の混雑についても注意を促すこと`;
}

const MODEL_NAMES = [
  "gemini-2.5-flash",               // primary: 20 RPD free tier confirmed
  "gemini-2.5-flash-preview-04-17", // fallback: preview version
];

export async function POST(request: NextRequest) {
  try {
    const body: PlanRequest = await request.json();

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(body);
    let lastError: unknown;
    const modelErrors: string[] = [];

    // Outer loop: try each API key (key1 → key2 on 429/403)
    keyLoop: for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      const genAI = new GoogleGenerativeAI(apiKeys[keyIdx]);
      const keyLabel = `key${keyIdx + 1}`;

      // Inner loop: try each model with this key
      for (const modelName of MODEL_NAMES) {
        let retries = 0;
        const maxRetries = 1;
        while (retries <= maxRetries) {
          try {
            console.log(`[${keyLabel}] Trying model: ${modelName}${retries > 0 ? ` (retry ${retries})` : ""}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
              },
            });

            const responseText = result.response.text();
            let plan;
            try {
              plan = JSON.parse(responseText);
            } catch {
              const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (jsonMatch) {
                plan = JSON.parse(jsonMatch[1].trim());
              } else {
                throw new Error("Failed to parse Gemini response as JSON");
              }
            }

            console.log(`[${keyLabel}] Success with model: ${modelName}`);
            return NextResponse.json(plan);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            const is503 = errMsg.includes("503") || errMsg.includes("Service Unavailable");
            const is404 = errMsg.includes("404") || errMsg.includes("NOT_FOUND") || errMsg.includes("not found");
            const is403 = errMsg.includes("403") || errMsg.includes("PERMISSION_DENIED") || errMsg.includes("API_KEY_INVALID");
            const is429 = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");

            modelErrors.push(`[${keyLabel}/${modelName}] ${errMsg.substring(0, 150)}`);

            if (is503 && retries < maxRetries) {
              console.warn(`[${keyLabel}] ${modelName} 503, retrying once...`);
              retries++;
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            if (is429 || is403 || is503) {
              // Quota/auth/server error → skip to next key immediately
              console.warn(`[${keyLabel}] ${modelName} ${is429 ? "429 quota" : is403 ? "403 auth" : "503 server"} — switching to next key`);
              lastError = err;
              continue keyLoop;
            }
            if (is404) {
              console.warn(`[${keyLabel}] ${modelName} 404, trying next model`);
            } else {
              console.warn(`[${keyLabel}] ${modelName} failed:`, errMsg.substring(0, 200));
            }
            lastError = err;
            break;
          }
        }
      }
    }

    // All models failed — return detailed error for diagnosis
    console.error("All Gemini models failed. Errors:", modelErrors);
    const diagMessage = modelErrors.length > 0
      ? `[診断] ${modelErrors.join(" / ")}`
      : "AI plan generation failed";
    const lastErrMessage = lastError instanceof Error ? lastError.message : "AI plan generation failed";

    // Check error type for user-friendly message
    const is403 = lastErrMessage.includes("403") || lastErrMessage.includes("PERMISSION_DENIED") || lastErrMessage.includes("API_KEY_INVALID");
    const is429 = lastErrMessage.includes("429") || lastErrMessage.includes("RESOURCE_EXHAUSTED");
    const is404 = lastErrMessage.includes("404") || lastErrMessage.includes("NOT_FOUND");

    let userMessage: string;
    if (is403) {
      userMessage = `APIキーエラー（403）: Gemini APIキーが無効です。管理者にお問い合わせください。[詳細: ${lastErrMessage.substring(0, 150)}]`;
    } else if (is429) {
      userMessage = `利用制限（429）: Gemini APIの無料枠の上限に達しました。しばらく時間をおいてから再度お試しください。`;
    } else if (is404) {
      userMessage = `モデルエラー（404）: 指定したAIモデルが見つかりません。[詳細: ${lastErrMessage.substring(0, 150)}]`;
    } else {
      userMessage = `AIサーバーエラー: ${lastErrMessage.substring(0, 200)}`;
    }

    console.error("Diagnosis:", diagMessage);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const message =
      error instanceof Error ? error.message : "AI plan generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildPrompt(body: PlanRequest): string {
  // Detect if any input is in English
  const allText = body.days.map(d => `${d.departure} ${d.arrival} ${d.destinations.map(dd => dd.name).join(" ")}`).join(" ");
  const hasEnglish = /[a-zA-Z]{3,}/.test(allText);

  // Check if omakase is used
  const hasOmakase = body.days.some(d => d.destinations.some(dd => dd.isOmakase));

  const daysDescription = body.days
    .map((day) => {
      // Build destination list; mark the first destination with 【最初に行く】 if firstDestId is set
      const destNamesWithFirst = day.destinations
        .map((d, idx) => {
          if (d.isOmakase) return "【おまかせ（AIが提案）】";
          return idx === 0 && day.firstDestId ? `【最初に行く】${d.name}` : d.name;
        })
        .filter(Boolean)
        .join("、");

      const lunchDesc = day.includeLunch
        ? `あり${day.lunchLocation ? `（希望場所: ${day.lunchLocation}）` : ""}${day.lunchGenre ? `（ジャンル: ${day.lunchGenre}）` : ""}`
        : "不要";
      const dinnerDesc = day.includeDinner
        ? `あり${day.dinnerLocation ? `（希望場所: ${day.dinnerLocation}）` : ""}${day.dinnerGenre ? `（ジャンル: ${day.dinnerGenre}）` : ""}`
        : "不要";

      const aiOmakaseNote = body.aiOmakase !== false
        ? "\n- 【おまかせ】目的地はルート上で最適な観光地をAIが追加提案してください"
        : "";

      return `
## ${day.dayIndex + 1}日目
- 出発地: ${day.departure}（${day.departureTime}出発）
- 希望目的地: ${destNamesWithFirst || "なし（AIが提案）"}${aiOmakaseNote}
- 終着地: ${day.arrival}（${day.arrivalTime}までに到着希望）
- 昼食: ${lunchDesc}
- 夕食: ${dinnerDesc}`;
    })
    .join("\n");

  const dogContext = body.withDog
    ? `
## 犬連れ旅行の条件
- 犬を連れた旅行です
- 2時間以上の連続運転では犬の散歩休憩（15分）を入れてください（dogWalkStop: true を設定）
- 犬同伴可能な施設・飲食店を優先してください
- 屋内施設はペット不可の可能性を注記してください
- ドッグラン併設の休憩スポットがあれば提案してください
- **犬が入場できない可能性がある施設**（神社仏閣の境内、一部テーマパーク等）がユーザー指定の目的地に含まれる場合:
  - **プランA・プランBともに、ユーザー指定の目的地は絶対にルートから除外しないこと。必ず両プランに含めること。**
  - 理由: 施設内に犬が入れなくても、周辺の散歩・外観見学・駐車場での休憩など部分的に楽しめる場合があるため
  - プランA・プランBともに: descriptionに「⚠️ 施設内はペット入場不可の場合があります。周辺の散歩や外観見学は可能なことが多いですが、事前に施設へご確認ください。入場できない場合は車内待機または近隣のペット預かり施設をご利用ください」と明記する
  - プランBでは追加で: 同じ目的地を含めた上で、近隣に犬同伴可能なスポット（ドッグラン・ペットOK公園・テラス席カフェ等）があればルートに**追加**して提案する（代替ではなく追加）
  - tipsに犬が入場不可の可能性がある施設についての注意事項と対策を含める
  - removedSpotsにユーザー指定の目的地を記載することは禁止`
    : "";

  const dateContext = body.travelDate
    ? analyzeTravelDate(body.travelDate, body.days.length)
    : "";

  // Traveler profile context
  let travelerContext = "";
  if (body.travelerProfile) {
    const p = body.travelerProfile;
    const parts: string[] = [];

    const partyLabels: Record<string, string> = {
      solo: "一人旅",
      couple: "カップル・夫婦旅行",
      family: "家族旅行",
      friends: "友人・グループ旅行",
      senior: "シニア旅行",
    };
    if (p.partyType && partyLabels[p.partyType]) {
      parts.push(`- 旅行スタイル: ${partyLabels[p.partyType]}`);
    }

    const ageLabels: Record<string, string> = {
      "20s": "20代", "30s": "30代", "40s": "40代",
      "50s": "50代", "60s": "60代", "70plus": "70代以上",
    };
    if (p.ageRange && ageLabels[p.ageRange]) {
      parts.push(`- 年代: ${ageLabels[p.ageRange]}`);
    }

    if (p.hobbies && p.hobbies.trim()) {
      parts.push(`- 趣味・興味: ${p.hobbies.trim()}`);
    }

    if (p.hasChildren) {
      parts.push(`- 子供連れ: あり${p.childAges ? `（${p.childAges}）` : ""}`);
    }

    if (parts.length > 0) {
      travelerContext = `
## 旅行者の情報
${parts.join("\n")}

上記の旅行者情報を踏まえて以下を考慮してください：
${p.partyType === "solo" ? "- 一人でも楽しめるスポット（絶景、温泉、カフェ、写真映えスポット）を優先\n- 一人で入りやすい飲食店を提案" : ""}
${p.partyType === "couple" ? "- ロマンチックなスポット、雰囲気の良いレストラン、景色の美しい場所を優先\n- カップル向けの体験（工芸体験、ワイナリーなど）も提案" : ""}
${p.partyType === "family" ? "- 家族全員が楽しめる体験型スポット、公園、テーマパークを優先\n- 子供の年齢に合った施設を選定\n- ベビー設備や授乳室の有無にも配慮" : ""}
${p.partyType === "friends" ? "- アクティブな体験、フォトジェニックなスポット、グルメスポットを優先\n- グループで盛り上がれるアクティビティを提案" : ""}
${p.partyType === "senior" ? "- バリアフリー対応や歩行距離の少ないスポットを優先\n- ゆったりしたスケジュールで無理のないプラン\n- 休憩時間を多めに確保\n- 歴史・文化系のスポットを重視" : ""}
${p.hobbies ? `- 趣味「${p.hobbies.trim()}」に関連するスポットやアクティビティを積極的に提案すること\n- おまかせの目的地選定では趣味との関連性を重視すること` : ""}
${p.hasChildren ? `- 子供（${p.childAges || "年齢不明"}）が楽しめるスポットを必ず含める\n- 長時間の移動を避け、こまめに休憩を入れる\n- トイレ休憩のタイミングに配慮\n- 子供向けメニューのある飲食店を優先` : ""}
${p.ageRange === "20s" || p.ageRange === "30s" ? "- SNS映えするスポットやトレンドの飲食店も考慮" : ""}
${p.ageRange === "60s" || p.ageRange === "70plus" ? "- 歩行距離を最小限に抑え、ゆとりのあるスケジュールにする\n- 温泉や日本庭園など落ち着いたスポットを重視" : ""}`;
    }
  }

  const englishContext = hasEnglish
    ? `
## 多言語対応
- 入力に英語が含まれています。場所名が英語で入力されていても正しく日本国内の場所を特定してください
- 例: "Tokyo Station" → 東京駅, "Kamakura" → 鎌倉, "Mt. Fuji" → 富士山
- 出力のスポット名は日本語で統一してください（英語入力でも日本語名で出力）
- ただし、descriptionやtipsには必要に応じて英語名も併記してください`
    : "";

  // Plan variation strategy — use body.aiOmakase flag (not the legacy isOmakase per-spot flag)
  let planVariationInstruction: string;
  if (body.aiOmakase !== false) {
    planVariationInstruction = `
## 2プラン作成（おまかせONモード）
「目的地以外はお任せ」がONになっています。**プランA・プランBともに、ユーザー指定の目的地をすべて含めた上で、出発〜到着の空き時間を活用してAIがおすすめ観光スポットを追加してください。**
2プランは追加するおすすめスポットのテーマを変えて差別化してください：
- **プランA「定番プラン」**: ユーザー指定の目的地 + 定番・王道の観光スポットをAIが追加
- **プランB「穴場プラン」**: ユーザー指定の目的地 + 穴場・体験型・ユニークなスポットをAIが追加
**重要:**
- 両プランとも、出発〜到着の時間に余裕がある限り積極的にスポットを追加すること
- PAのみで終わらせず、観光地・道の駅・景勝地など魅力的なスポットを必ず追加すること
- planNameとplanDescriptionでテーマの違いを明確に説明すること`;
  } else {
    planVariationInstruction = `
## 2プラン作成（おまかせOFFモード）
「目的地以外はお任せ」がOFFです。ユーザーが指定した目的地を中心にプランを作成します。
**重要: プランA・プランBの両方に、ユーザーが指定した目的地をすべて必ず含めてください。**
- **プランA「直行プラン」**: ユーザー指定の目的地のみで構成。最短・最効率なルート
- **プランB「余裕プラン」**: ユーザー指定の目的地をすべて含めた上で、ルート上で自然に立ち寄れる休憩スポット・道の駅・景色の良いスポットをAIが厳選して数か所追加
planNameとplanDescriptionでプランの違いを明確に説明してください。`;
  }

  return `あなたは日本の車旅行の専門プランナーです。以下の条件で**2つの旅行プラン**をJSON形式で作成してください。

# 旅行条件
${daysDescription}
${dogContext}
${travelerContext}
${dateContext}
${englishContext}
${planVariationInstruction}

# ルール
1. 出発時間と到着希望時間の間で必ず収まるプランにすること
2. 移動時間の計算:${body.useHighway === false ? `
   - **高速道路は使用しないこと（ユーザー設定）。すべて一般道でルートを組むこと**
   - 一般道の速度: 45km/h で計算
   - useHighway は常に false、highwayEntry/highwayExit/highwayName はすべて空文字列にすること` : `
   - **高速道路を積極的に使用すること（ユーザー設定：高速ON）**
   - 距離20km以上の区間は原則として高速道路を使用すること（useHighway: true、IC情報を必ず記載）
   - 高速道路の速度: 90km/h（実勢速度）、一般道: 40km/h（信号・渋滞考慮）
   - 高速道路を使わない場合は必ず理由をdescriptionに記載すること
   - 休日・祝日は高速道路および都市部の一般道で渋滞が発生しやすいため、移動時間を1.3〜1.5倍に見積もること
   - 朝7〜9時・夕方17〜19時の通勤ラッシュ時間帯も移動時間を1.2倍に見積もること`}
3. 各目的地の滞在時間は観光地の規模に応じて設定すること:
   - **動物園・水族館・テーマパーク・遊園地・大型アミューズメント施設: 最低120分（2時間）以上**
   - 大型自然公園・植物園・道の駅（大型）: 60〜90分
   - 一般的な観光地・寺社仏閣・博物館・美術館: 30〜60分
   - SA/PA・小規模スポット: 15〜30分
   - 時間が足りない場合でも動物園・水族館・テーマパーク等は最低90分を確保すること
4. 「おまかせ」の目的地はルート上で魅力的な観光地をAIが提案すること
5. **ユーザーが指定した目的地は絶対に削除しないこと**。時間が厳しい場合は以下の対応をすること：
   - 到着希望時間を超えてもプランに含め、tipsで「到着時間が○○時に遅れる見込みです」と注記する
   - 途中にSA/PA・道の駅での休憩を挟み、長距離移動でも実現可能なプランにする
   - 滞在時間を短縮（最低30分）して対応する
   - それでも物理的に不可能な場合のみ、removedSpotsに理由を記載し、代わりに近隣の同ジャンルのスポットをプランに含めること
6. ルート最適化:
   - 帰りのドライブが楽になるよう、可能な限り遠い目的地から先に訪問し、帰りながら近い目的地を回るルートにすること（アウトアンドバック方式）
   - ただし最初に行く目的地が指定されている場合はその制約を優先すること
   - 効率的なルート順序に最適化すること（往復の総距離を最小化）
7. 各スポットの見どころや楽しみ方を簡潔に解説すること
8. 各itemにaddress（住所）を必ず含めること（「東京都千代田区丸の内1丁目」のような形式）
9. 昼食・夕食について:
   - 昼食が「あり」の場合: 11:30〜13:30の時間帯にitemsの中にtype="lunch"の食事スポットを**必ず1件**追加すること
   - 夕食が「あり」の場合: 17:30〜19:30の時間帯にitemsの中にtype="dinner"の食事スポットを**必ず1件**追加すること
   - 希望場所が「PA」または「パーキングエリア」と指定されている場合（**最重要ルール**）:
     ・**昼食の場合**: 出発地から最初の目的地へ向かう高速道路上のSA（サービスエリア）を食事場所として設定すること。最初の目的地に到着した後に高速を戻ってSAに行くようなルートは絶対に作らないこと
     ・**夕食の場合**: 最後の目的地から帰着地へ向かう高速道路上のSA（サービスエリア）を食事場所として設定すること
     ・nameは「○○SA（サービスエリア）で昼食」「○○SA（サービスエリア）で夕食」の形式にすること
     ・時間帯が早くなる場合は「早めの昼食」、遅くなる場合は「遅めの夕食」とdescriptionに説明すること
     ・高速道路を使用しない場合（useHighway=false）は、ルート上の道の駅を食事場所として設定すること
   - 希望場所が指定されている場合（PA以外）: その場所周辺で食事スポットを設定すること
   - ジャンルが指定されている場合: そのジャンルの食事エリアとして提案すること
   - 食事スポットのnameは「○○エリアで昼食（ジャンル名）」の形式にすること（例: 「秩父駅周辺で昼食（蕎麦）」「箱根湯本周辺で夕食（和食）」）
   - ジャンル未指定の場合は「○○エリアで昼食」のようにジャンル省略も可
   - **具体的な店名は提案しないこと**（AIが提案する店名は不正確な場合があるため）
   - 食事スポットには必ずlat/lng/addressを含めること（食事エリアの中心地点の座標を使用）
   - descriptionには「このエリアで○○のお店をGoogle Mapsで検索してお選びください」と記載すること
   - 犬連れの場合はdescriptionに「犬同伴可・テラス席ありのお店を検索条件に加えてください」と追記すること
   - 昼食・夕食が「不要」の場合: itemsへの食事スポット追加は不要
10. 食事スポットの注意:
   - 滞在時間は60分で設定すること
   - 希望場所が「PA」「パーキングエリア」の場合は、上記ルール9の「PA指定時の特別ルール」に従うこと（目的地の前後で高速を戻る逆走ルートは絶対禁止）
   - 希望場所が指定されていればその付近、なければルート上の目的地に近い場所を選ぶこと
   - lunchSpot/dinnerSpotのnameには「○○エリア（ジャンル名）」、descriptionには「○○周辺には○○のお店が多数あります」、nearSpotには「○○（目的地名）から車で約○分」と記載すること
   - lunchSpot/dinnerSpotのalternativesは不要（空配列でよい）
11. 時間の有効活用:
   - 出発時刻から終着地の希望時刻まで、できるだけ時間を有効に使うこと
   - 最後の目的地から終着地まで時間が2時間以上余る場合は、ルート上にさらなる観光スポットや食事スポットを追加すること
   - それでも追加スポットがない場合は、commentaryのtipsに「○○時頃に終着地に到着見込み。時間に余裕があります」と明記すること
   - 終着地には希望到着時刻ちょうど（または少し前）に到着するようスケジュールを組むこと
12. **営業時間・閉館時間の厳守（最重要）**:
   - 観光スポットへの到着時間が閉館時間に間に合うかを必ず確認すること
   - 日本の主な観光施設の一般的な閉館時間の目安：
     ・寺社仏閣（拝観）: 通常16:00〜17:00閉門（夕方以降は境内のみ入れる場合あり）
     ・有料の寺院・博物館・美術館: 通常16:30〜17:30（最終入場は30〜60分前）
     ・城・歴史的建造物: 通常16:00〜17:00
     ・動物園・水族館・テーマパーク: 施設により異なるが通常17:00〜18:00
     ・道の駅・SA/PA: 24時間〜営業（一部施設は18:00閉店）
     ・飲食店・カフェ: 施設による
   - **到着時間が16:00以降になる観光スポット（寺社・博物館・城等）は、閉館の可能性があるため以下を必ず実施する：**
     ・descriptionに「⚠️ 閉館時間にご注意ください。事前に営業時間をご確認の上、ご訪問ください（多くの寺社・観光施設は16:00〜17:00頃閉館）」と明記する
     ・tipsにも「○○は閉館時間が早いため、○○時頃の到着では入場できない可能性があります。事前に公式サイトで確認してください」と注記する
   - **到着時間が17:00以降になる有料観光施設（寺社・博物館・城等）は原則スケジュールから除外し、代わりに夜間でも楽しめるスポット（夜景・ライトアップ・温泉街の散策・飲食エリア等）を提案すること**
   - ユーザーが指定した目的地でも閉館後になる場合は、tipsで「○○は閉館後の到着見込みです。翌日の訪問または日程の見直しをご検討ください」と警告すること

# 出力JSON形式
**必ず以下の形式で出力すること。最外層は必ず { "plans": [...] } とすること。plans配列には必ず2つのプランを含めること。**

{
  "plans": [
    {
      "planName": "プランA: 定番プラン",
      "planDescription": "プランの概要と特徴（100文字程度）",
      "days": [
        {
          "dayIndex": 0,
          "items": [
            {
              "name": "自宅",
              "lat": 35.6812,
              "lng": 139.7671,
              "address": "出発地の住所",
              "type": "departure",
              "arrivalTime": "09:00",
              "departureTime": "09:00",
              "stayMinutes": 0,
              "distanceKm": 0,
              "travelMinutes": 0,
              "useHighway": false,
              "parkingInfo": "",
              "description": "",
              "dogWalkStop": false
            },
            {
              "name": "観光スポット名",
              "lat": 35.123,
              "lng": 139.456,
              "address": "東京都○○区○○1丁目",
              "type": "destination",
              "arrivalTime": "10:30",
              "departureTime": "11:30",
              "stayMinutes": 60,
              "distanceKm": 50,
              "travelMinutes": 45,
              "useHighway": true,
              "highwayEntry": "○○IC",
              "highwayExit": "○○IC",
              "highwayName": "○○自動車道",
              "parkingInfo": "駐車場あり（無料・50台）",
              "description": "見どころの説明",
              "dogWalkStop": false
            },
            {
              "name": "○○エリアで昼食（蕎麦）",
              "lat": 35.234,
              "lng": 139.567,
              "address": "○○県○○市○○町付近",
              "type": "lunch",
              "arrivalTime": "12:00",
              "departureTime": "13:00",
              "stayMinutes": 60,
              "distanceKm": 5,
              "travelMinutes": 10,
              "useHighway": false,
              "parkingInfo": "周辺に駐車場あり",
              "description": "このエリアで蕎麦のお店をGoogle Mapsで検索してお選びください",
              "dogWalkStop": false
            },
            {
              "name": "○○エリアで夕食（和食）",
              "lat": 35.345,
              "lng": 139.678,
              "address": "○○県○○市○○町付近",
              "type": "dinner",
              "arrivalTime": "18:00",
              "departureTime": "19:00",
              "stayMinutes": 60,
              "distanceKm": 10,
              "travelMinutes": 15,
              "useHighway": false,
              "parkingInfo": "周辺に駐車場あり",
              "description": "このエリアで和食のお店をGoogle Mapsで検索してお選びください",
              "dogWalkStop": false
            },
            {
              "name": "到着地",
              "lat": 35.456,
              "lng": 139.789,
              "address": "到着地の住所",
              "type": "arrival",
              "arrivalTime": "20:00",
              "departureTime": "20:00",
              "stayMinutes": 0,
              "distanceKm": 30,
              "travelMinutes": 40,
              "useHighway": false,
              "parkingInfo": "",
              "description": "",
              "dogWalkStop": false
            }
          ],
          "lunchSpot": {
            "name": "○○エリア（蕎麦）",
            "description": "○○周辺には蕎麦のお店が多数あります",
            "nearSpot": "○○（目的地名）から車で約10分",
            "alternatives": []
          },
          "dinnerSpot": {
            "name": "○○エリア（和食）",
            "description": "○○周辺には和食のお店が多数あります",
            "nearSpot": "○○（目的地名）から車で約15分",
            "alternatives": []
          }
        }
      ],
      "commentary": {
        "removedSpots": [],
        "highlights": ["プランの見どころ1", "プランの見どころ2"],
        "tips": ["旅行のアドバイス1"],
        "dogTips": ["犬連れアドバイス（犬連れ時のみ）"],
        "overallDescription": "プラン全体の概要（100文字程度）"
      }
    },
    {
      "planName": "プランB: 穴場プラン",
      "planDescription": "プランBの概要と特徴",
      "days": [{"dayIndex": 0, "items": [...], "lunchSpot": {...}, "dinnerSpot": {...}}],
      "commentary": {"removedSpots": [], "highlights": [...], "tips": [...], "overallDescription": "..."}
    }
  ]
}

**絶対に守るべきルール:**
- 最外層は必ず { "plans": [...] } にすること。days配列を直接返さないこと
- plans配列には必ず2つのプランを含めること（プランAとプランB）
- **犬連れ旅行ではない場合（withDog=false）: dogWalkStop は必ず false にすること。犬の散歩休憩をプランに含めないこと**
- 【最初に行く】と指定された目的地がある場合、その目的地を最初に訪れること。ただしPAなどの休憩が必要な場合は休憩後に向かうこと。
- 昼食ジャンルが指定されている場合、itemsの中にtype="lunch"のアイテムを**必ず追加**すること（省略禁止）
- 夕食ジャンルが指定されている場合、itemsの中にtype="dinner"のアイテムを**必ず追加**すること（省略禁止）
- 食事アイテムにはlat, lng, addressを必ず含めること
- 緯度経度は正確な値を使用してください。日本国内の実在する場所のみを提案してください
- 2つのプランは必ず異なる内容にしてください（同じプランの重複は不可）
- 各プランのplanNameとplanDescriptionは必須です`;
}
