import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
    lunchGenre: string;
    dinnerGenre: string;
  }[];
  withDog: boolean;
  travelDate?: string; // "YYYY-MM-DD"
  travelerProfile?: {
    partyType: string;
    ageRange: string;
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
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export async function POST(request: NextRequest) {
  try {
    const body: PlanRequest = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(body);
    let lastError: unknown;

    for (const modelName of MODEL_NAMES) {
      try {
        console.log(`Trying model: ${modelName}`);
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

        console.log(`Success with model: ${modelName}`);
        return NextResponse.json(plan);
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err);
        lastError = err;
        continue;
      }
    }

    // All models failed
    console.error("All Gemini models failed:", lastError);
    const message =
      lastError instanceof Error
        ? lastError.message
        : "AI plan generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
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
      const destNames = day.destinations
        .map((d) => (d.isOmakase ? "【おまかせ（AIが提案）】" : d.name))
        .filter(Boolean)
        .join("、");

      return `
## ${day.dayIndex + 1}日目
- 出発地: ${day.departure}（${day.departureTime}出発）
- 希望目的地: ${destNames || "なし（AIが提案）"}
- 終着地: ${day.arrival}（${day.arrivalTime}までに到着希望）
- 昼食の希望: ${day.lunchGenre || "特になし"}
- 夕食の希望: ${day.dinnerGenre || "特になし"}`;
    })
    .join("\n");

  const dogContext = body.withDog
    ? `
## 犬連れ旅行の条件
- 犬を連れた旅行です
- 2時間以上の連続運転では犬の散歩休憩（15分）を入れてください
- 犬同伴可能な施設・飲食店を優先してください
- 屋内施設はペット不可の可能性を注記してください
- ドッグラン併設の休憩スポットがあれば提案してください`
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

  // Plan variation strategy
  let planVariationInstruction: string;
  if (hasOmakase) {
    planVariationInstruction = `
## 2プラン作成（おまかせモード）
「おまかせ」の指定があるため、**異なるテーマ・切り口で2つのプラン**を作成してください。
- **プランA**: 定番・王道の観光スポットを中心としたプラン
- **プランB**: 穴場・ユニークな体験を重視したプラン
それぞれのplanNameとplanDescriptionで、プランの特徴やテーマの違いを明確に説明してください。`;
  } else {
    planVariationInstruction = `
## 2プラン作成（目的地指定モード）
ユーザーが指定した目的地をすべて含む基本プランに加え、空き時間を活用した充実プランも作成してください。
- **プランA「効率プラン」**: ユーザー指定の目的地のみで構成。無駄のない効率的なルート
- **プランB「充実プラン」**: ユーザー指定の目的地に加え、ルート上で立ち寄れるおすすめスポットをAIが追加提案。空き時間を有効活用
それぞれのplanNameとplanDescriptionで、プランの違いを明確に説明してください。`;
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
2. 移動時間は高速道路80km/h、一般道45km/hで計算（距離30km以上は高速利用を推奨）
3. 各目的地の滞在時間は観光地の規模に応じて30〜90分で設定
4. 「おまかせ」の目的地はルート上で魅力的な観光地をAIが提案すること
5. 時間的に無理な目的地は削除し、理由を説明すること
6. 効率的なルート順序に最適化すること（近い場所をまとめる）
7. 各スポットの見どころや楽しみ方を簡潔に解説すること
8. 各itemにaddress（住所）を必ず含めること（「東京都千代田区丸の内1丁目」のような形式）
9. 昼食・夕食について:
   - 昼食の希望ジャンルが記載されている場合: 11:30〜13:30の時間帯にitemsの中にtype="lunch"の食事スポットを1件追加すること（具体的な店名または食事エリアと滞在時間60分）
   - 夕食の希望ジャンルが記載されている場合: 17:30〜19:30の時間帯にitemsの中にtype="dinner"の食事スポットを1件追加すること（具体的な店名または食事エリアと滞在時間60分）
   - 昼食・夕食の希望が「特になし」の場合: itemsへの食事スポット追加は不要。代わりにcommentaryのhighlightsの中でルート周辺のおすすめ食事を簡単に紹介すること
10. 飲食店を提案する場合の注意:
   - 飲食店は営業時間内に訪問できるよう配慮すること（一般的なランチ営業は11:00〜14:00、ディナー営業は17:00〜21:00）
   - 人気店や個人経営の飲食店は閉店時間が早い場合があるため、余裕を持った時間設定にすること
   - descriptionに「※営業時間は事前にご確認ください」と必ず付記すること
   - 可能であれば飲食店の一般的な営業時間帯も記載すること

# 出力JSON形式
以下の形式で**plans配列に2つのプラン**を出力してください：
{
  "plans": [
    {
      "planName": "プランA: 効率プラン",
      "planDescription": "プランの概要と特徴（100文字程度）",
      "days": [
        {
          "dayIndex": 0,
          "items": [
            {
              "name": "スポット名",
              "lat": 35.6812,
              "lng": 139.7671,
              "address": "東京都千代田区丸の内1丁目",
              "type": "departure | destination | arrival | lunch | dinner",
              "arrivalTime": "09:00",
              "departureTime": "09:00",
              "stayMinutes": 0,
              "distanceKm": 0,
              "travelMinutes": 0,
              "useHighway": false,
              "highwayEntry": "入口IC名（高速利用時）",
              "highwayExit": "出口IC名（高速利用時）",
              "highwayName": "高速道路名",
              "parkingInfo": "駐車場情報",
              "description": "見どころ・楽しみ方（飲食店の場合は「※営業時間は事前にご確認ください」を含む）",
              "dogWalkStop": false,
              "mealRecommendation": "食事のおすすめ（該当時間帯の場合）"
            }
          ],
          "lunchSpot": { "name": "...", "description": "...", "nearSpot": "..." },
          "dinnerSpot": { "name": "...", "description": "...", "nearSpot": "..." }
        }
      ],
      "commentary": {
        "removedSpots": [{ "name": "...", "reason": "..." }],
        "highlights": ["プランの見どころ1", "プランの見どころ2"],
        "tips": ["旅行のアドバイス1"],
        "dogTips": ["犬連れアドバイス（犬連れ時のみ）"],
        "overallDescription": "プラン全体の概要（100文字程度）"
      }
    },
    {
      "planName": "プランB: 充実プラン",
      "planDescription": "...",
      "days": [...],
      "commentary": {...}
    }
  ]
}

重要:
- 緯度経度は正確な値を使用してください。日本国内の実在する場所のみを提案してください
- 2つのプランは必ず異なる内容にしてください（同じプランの重複は不可）
- 各プランのplanNameとplanDescriptionは必須です`;
}
