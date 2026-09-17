export interface TripPlannerDict {
  header: {
    title: string;
    subtitle: string;
    heritageLink: string;
    lifeMapLink: string;
    columnsLink: string;
    editPlan: string;
  };
  loading: {
    title: string;
    message: string;
    messageRoute: string;
  };
  /**
   * aiBusy 〜 aiInvalidJson は /api/plan が返す errorCode に対応する文面（対応表は page.tsx の PLAN_ERROR_KEYS）。
   * 日本語はサーバーがレスポンスの error に入れる文面と同じ文字列にしている。
   */
  error: {
    title: string;
    aiBusy: string;
    aiFailed: string;
    aiUnavailable: string;
    badRequest: string;
    /** 安全性などの理由で応答が止められた */
    aiBlocked: string;
    /** 応答が空だった */
    aiEmptyResponse: string;
    /** 出力上限で応答が途切れた */
    aiTruncated: string;
    /** STOP / MAX_TOKENS / ブロック以外の理由で応答が止まった */
    aiBadFinish: string;
    /** 応答がJSONとして読めなかった */
    aiInvalidJson: string;
    network: string;
  };
  printModal: {
    title: string;
    planA: string;
    planB: string;
    both: string;
    print: string;
    copy: string;
    cancel: string;
  };
  planCompare: {
    hint: string;
    /** 2案が同じ行程で1案にまとめたときの名前 */
    sameName: string;
    /** 1案にまとめたことの説明 */
    sameNote: string;
    /** 2案に分かれる可能性がある操作の案内（おまかせON／OFF別。{omakase} は「目的地以外はお任せ」の表示名） */
    sameTipOn: string;
    sameTipOff: string;
  };
  buttons: {
    print: string;
    copy: string;
    copied: string;
  };
  itinerary: {
    day: string;
    empty: { title: string; desc: string };
    badge: { lunch: string; dinner: string };
    travel: { highway: string; road: string };
    dogwalk: string;
    mealstop: string;
    stay: string;
    mealHint: string;
    mealHintDog: string;
    closing17: { bold: string; text: string };
    closing16: { bold: string; text: string };
    googleMap: string;
    petSearch: string;
    businessHours: string;
    commentary: { title: string };
    removed: { title: string; aiJudgment: string; unexplained: string; hint: string };
    schedule: {
      over: string;
      overOvernight: string;
      nextDay: string;
      laterDays: string;
      basisAi: string;
      basisRoute: string;
    };
    /** マイカー規制区域の警告。{place} は「区域名（地点名）」、period で yearRound／seasonal を使い分ける */
    carRestriction: {
      yearRound: string;
      seasonal: string;
      place: string;
      separator: string;
      note: string;
      badge: string;
    };
    highlights: { title: string };
    tips: { title: string };
    dogTips: { title: string };
    youtube: { title: string; desc: string; linkText: string };
    meal: { lunch: string; dinner: string };
  };
  form: {
    appTitle: string;
    appDescription: string;
    tags: string[];
    xFollow: string;
    tripDuration: { title: string; options: string[] };
    departureDate: { label: string; optional: string; hint: string };
    omakase: { label: string; description: string };
    dog: { label: string; description: string };
    highway: { label: string; on: string; off: string };
    traveler: {
      title: string;
      optional: string;
      partyType: { label: string; options: string[] };
      ageRange: { label: string; options: string[] };
      hobbies: { label: string; placeholder: string; hint: string };
      children: { label: string; agePlaceholder: string; ageHint: string };
    };
    homeAddress: {
      title: string;
      edit: string;
      delete: string;
      privacySaved: string;
      placeholder: string;
      register: string;
      hint: string;
      privacy2: string;
      saved: string;
    };
    day: { title: string; dayTrip: string };
    departure: {
      label: string;
      required: string;
      homeButton: string;
      placeholder0: string;
      placeholder1: string;
      prevDayNote: string;
    };
    destination: {
      label: string;
      required: string;
      searchPlaceholder: string;
      firstToggle: string;
      mealLabel: string;
      mealNone: string;
      mealLunch: string;
      mealDinner: string;
      add: string;
    };
    arrival: {
      label: string;
      required: string;
      placeholder: string;
      timeHint: string;
    };
    lunch: {
      toggle: string;
      locationLabel: string;
      locationPlaceholder: string;
      genreLabel: string;
      genrePlaceholder: string;
      atDestination: string;
    };
    dinner: {
      toggle: string;
      locationLabel: string;
      locationPlaceholder: string;
      genreLabel: string;
      genrePlaceholder: string;
      atDestination: string;
    };
    errors: {
      departure: string;
      arrival: string;
      dest0: string;
      mealMultiple: string;
      genreMultiple: string;
    };
    errorSummary: { title: string; desc: string };
    submit: string;
    submitting: string;
    disclaimer: { title: string; items: string[] };
    terms: { title: string; items: string[] };
    copyright: string;
    search: { noResults: string; noResultsHint: string; searchError: string };
  };
}

export type TripLangCode = "ja" | "en" | "ko" | "zh-CN" | "zh-TW" | "es" | "ru";

export const TRIP_LANGUAGES: { code: TripLangCode; label: string }[] = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "es", label: "Español" },
  { code: "ru", label: "Русский" },
];

const ja: TripPlannerDict = {
  header: {
    title: "AI ドライブプランナー",
    subtitle: "車旅行プランを自動作成・地図（Google マップ）表示",
    heritageLink: "🌍 世界遺産パスポート",
    lifeMapLink: "🗺 人生体験マップ",
    columnsLink: "📝 ドライブ旅行コラム",
    editPlan: "プランを再編集",
  },
  loading: {
    title: "プラン作成中",
    message: "AIが2つの旅行プランを作成中...",
    messageRoute: "ルートを取得中...",
  },
  error: {
    title: "エラーが発生しました",
    aiBusy: "現在AIへのアクセスが集中しています。しばらく時間をおいてから再度お試しください。",
    aiFailed:
      "AIがプランを正しく作成できませんでした。お手数ですが、もう一度お試しください。目的地の数や日数を減らすと成功しやすくなります。",
    aiUnavailable: "AIプラン作成を一時的に利用できません。しばらくしてから再度お試しください。",
    badRequest: "AIプラン作成リクエストを処理できませんでした。入力内容を確認してから再度お試しください。",
    aiBlocked: "AIが安全上の理由でプランを作成できませんでした。目的地やプロフィールの内容を見直してから再度お試しください。",
    aiEmptyResponse: "AIから応答が返ってきませんでした。お手数ですが、もう一度お試しください。",
    aiTruncated: "AIの応答が途中で途切れました。目的地の数や日数を減らしてから再度お試しください。",
    aiBadFinish: "AIがプランの作成を途中で中断しました。お手数ですが、もう一度お試しください。",
    aiInvalidJson:
      "AIの応答をプランとして読み取れませんでした。お手数ですが、もう一度お試しください。目的地の数や日数を減らすと成功しやすくなります。",
    network: "サーバーとの通信に失敗しました。接続状況を確認して、もう一度お試しください。",
  },
  printModal: {
    title: "出力するプランを選択",
    planA: "プランA",
    planB: "プランB",
    both: "両方のプラン",
    print: "印刷",
    copy: "コピー",
    cancel: "キャンセル",
  },
  planCompare: {
    hint: "▼ 2つのプランを比較できます ▼",
    sameName: "おすすめプラン",
    sameNote: "この条件では指定の目的地で行程が決まるため、2つの案が同じになりました。1つのプランとして表示しています。",
    sameTipOn: "1日の目的地を減らすか、出発・到着の時間に余裕を持たせると、AIがスポットを加えられるようになり、2つの案に分かれることがあります。",
    sameTipOff: "「{omakase}」をオンにしたうえで、1日の目的地を減らすか、出発・到着の時間に余裕を持たせると、2つの案に分かれることがあります。",
  },
  buttons: { print: "印刷する", copy: "テキストをコピー", copied: "コピー済み！" },
  itinerary: {
    day: "{n}日目",
    empty: {
      title: "旅行プランを入力してください",
      desc: "左のフォームから出発地・目的地を入力して作成ボタンを押してください",
    },
    badge: { lunch: "昼食", dinner: "夕食" },
    travel: { highway: "（高速利用）", road: "（一般道）" },
    dogwalk: "犬の散歩休憩（約15分）",
    mealstop: "食事おすすめ: ",
    stay: "滞在 {min}分",
    mealHint: "「Google Mapで確認」から周辺のお店をお選びください。",
    mealHintDog: "「Google Mapで確認」から周辺のお店をお選びください。犬連れの方は「ペットOKで探す」もご利用ください。",
    closing17: {
      bold: "閉館の可能性あり。",
      text: "寺社・博物館・城などは17時頃に閉館することが多いです。事前に営業時間をご確認ください。",
    },
    closing16: {
      bold: "閉館時間に注意。",
      text: "寺社・博物館などは16〜17時頃に閉館する場合があります。事前に営業時間をご確認ください。",
    },
    googleMap: "Google Mapで確認",
    petSearch: "ペットOKで探す",
    businessHours: "営業時間を事前にご確認ください",
    commentary: { title: "AIプランナーの解説" },
    removed: {
      title: "プランに含められなかった指定目的地",
      aiJudgment: "AIの判断",
      unexplained: "AIが理由を示さずに省略",
      hint: "条件を変更してもう一度作成すると改善する場合があります（目的地名は住所より施設名のほうが認識されやすいです）。",
    },
    schedule: {
      over: "この日は到着希望（{desired}）を約{min}分超過する見込みです（到着見込み {arrival}）",
      overOvernight: "この日は到着希望（{desired}）を約{min}分超過し、日付をまたぐ見込みです（到着見込み {arrival}）",
      nextDay: "翌日{time}",
      laterDays: "{n}日後の{time}",
      basisAi: "AIの時刻による判定",
      basisRoute: "地図の経路の所要時間（渋滞を含まない）による判定",
    },
    carRestriction: {
      yearRound: "{place}はマイカー規制区域です。自家用車では入れません。路線バスやシャトルバスなどで行けます。",
      seasonal: "{place}は、時期によりマイカー規制があります。訪問日の規制を公式情報でご確認ください。",
      place: "{area}（{spots}）",
      separator: "・",
      note: "※登録している主な規制区域のみを判定しています。",
      badge: "🚫 マイカー規制区域",
    },
    highlights: { title: "プランのポイント" },
    tips: { title: "アドバイス" },
    dogTips: { title: "犬連れ旅行のアドバイス" },
    youtube: {
      title: "このプランを動画で下見する",
      desc: "実際の雰囲気を確認したい方は、関連するYouTube動画も参考にできます。",
      linkText: 'YouTubeで「{query}」を見る',
    },
    meal: { lunch: "昼食", dinner: "夕食" },
  },
  form: {
    appTitle: "AI ドライブプランナー",
    appDescription:
      "出発地、目的地、終着地を入力するだけで、AIが最適なドライブ旅行プランを自動作成します。プランはそのままGoogle マップと連動し、実際の道路ルート・距離・移動時間を自動表示。渋滞予測・季節イベント・おすすめ食事スポット・駐車場情報まで、すべてAIがプランニング。犬連れ旅行、旅行スタイル、年代にも対応し、YouTubeの関連動画も紹介。",
    tags: ["AI自動プラン", "渋滞予測", "2プラン比較", "Google Maps連携", "犬連れ対応", "完全無料"],
    xFollow: "公式X（@AIDRIVEPLAN）をフォロー",
    tripDuration: {
      title: "旅行期間",
      options: ["日帰り", "1泊2日", "2泊3日", "3泊4日", "4泊5日"],
    },
    departureDate: {
      label: "出発日",
      optional: "（任意）",
      hint: "入力するとAIが休日・祝日の渋滞予測やイベント情報を考慮します",
    },
    omakase: {
      label: "目的地以外はお任せ",
      description: "目的地以外は出発地、終着地、その時間等を勘案しAIがプランを作成します。",
    },
    dog: {
      label: "犬連れ旅行",
      description: "散歩タイム・犬同伴可の飲食店を考慮",
    },
    highway: {
      label: "高速道路を使う",
      on: "高速道路を利用してルートを作成します",
      off: "一般道のみでルートを作成します",
    },
    traveler: {
      title: "旅行者の情報",
      optional: "（任意・AIの提案に反映）",
      partyType: {
        label: "旅行スタイル",
        options: ["未選択", "一人旅", "カップル・夫婦", "家族旅行", "友人・グループ", "シニア旅行"],
      },
      ageRange: {
        label: "年代",
        options: ["未選択", "20代", "30代", "40代", "50代", "60代", "70代以上"],
      },
      hobbies: {
        label: "趣味・興味",
        placeholder: "例: 温泉 釣り 写真 グルメ 神社巡り",
        hint: "スペース区切りで複数入力可。お任せコースに趣味を反映します",
      },
      children: {
        label: "子供あり",
        agePlaceholder: "例: 3歳、7歳",
        ageHint: "お子様の年齢に合ったスポットをAIが提案します",
      },
    },
    homeAddress: {
      title: "自宅住所の登録",
      edit: "変更",
      delete: "削除",
      privacySaved: "🔒 住所はお使いのブラウザ内にのみ保存されています。外部への送信は一切ありません。",
      placeholder: "例: 東京都渋谷区神宮前1-1-1",
      register: "登録",
      hint: "登録すると出発地・終着地にワンタップで入力できます",
      privacy2: "🔒 住所はお使いのブラウザ内（localStorage）にのみ保存されます。サーバーへの送信や第三者への共有は一切行いません。",
      saved: "自宅住所を保存しました",
    },
    day: { title: "{n}日目", dayTrip: "（日帰り）" },
    departure: {
      label: "出発地",
      required: "*必須",
      homeButton: "自宅",
      placeholder0: "例: 東京駅、自宅の住所...",
      placeholder1: "前日の終着地から自動入力（変更可）",
      prevDayNote: "前日の終着地から転記済み（変更可能）",
    },
    destination: {
      label: "目的地",
      required: "*1つ以上必須",
      searchPlaceholder: "場所名を入力して検索",
      firstToggle: "この場所に最初に行く",
      mealLabel: "食事",
      mealNone: "指定なし",
      mealLunch: "昼食",
      mealDinner: "夕食",
      add: "目的地を追加",
    },
    arrival: {
      label: "終着地",
      required: "*必須",
      placeholder: "例: 自宅、ホテル名...",
      timeHint: "終着地の希望到着時刻（未入力の場合は20:00）",
    },
    lunch: {
      toggle: "昼食を含める",
      locationLabel: "食べる場所（任意、１つ）",
      locationPlaceholder: "例: 鎌倉駅周辺（1か所のみ）",
      genreLabel: "ジャンル（任意、１つ）",
      genrePlaceholder: "例: 海鮮（1つのみ）",
      atDestination: "目的地「{name}」で昼食をとります（別の昼食スポットは追加しません）",
    },
    dinner: {
      toggle: "夕食を含める",
      locationLabel: "食べる場所（任意、１つ）",
      locationPlaceholder: "例: 箱根湯本周辺（1か所のみ）",
      genreLabel: "ジャンル（任意、１つ）",
      genrePlaceholder: "例: 焼肉（1つのみ）",
      atDestination: "目的地「{name}」で夕食をとります（別の夕食スポットは追加しません）",
    },
    errors: {
      departure: "出発地を入力してください",
      arrival: "終着地を入力してください",
      dest0: "目的地を1つ以上入力してください",
      mealMultiple: "食べる場所は１つのみ入力してください（「、」や「,」で区切らないでください）",
      genreMultiple: "ジャンルは１つのみ入力してください（「、」や「,」で区切らないでください）",
    },
    errorSummary: {
      title: "入力内容に不足があります",
      desc: "必須項目（出発地・目的地・終着地）をすべて入力してください。",
    },
    submit: "旅行プランを作成",
    submitting: "プランを作成中...",
    disclaimer: {
      title: "⚠️ 免責事項",
      items: [
        "・本サービスが生成する旅行プランはAIによる自動生成であり、実際の所要時間・距離・道路状況・営業時間・料金等と異なる場合があります。",
        "・提案されたスポットや飲食店の営業状況、ペット同伴の可否等は、必ず事前にご自身でご確認ください。",
        "・本サービスの利用により生じたいかなる損害についても、運営者は一切の責任を負いません。",
        "・交通ルール・法規を遵守し、安全運転でお出かけください。",
        "・マイカー規制の警告は、登録している主要な規制区域のみが対象で、すべての規制を網羅するものではありません。規制の有無や期間は年や時期により変わるため、訪問前に公式情報をご確認ください。",
      ],
    },
    terms: {
      title: "📋 ご利用上の注意",
      items: [
        "・本サイトのソースコード・デザイン・コンテンツの無断複製・転用・再配布を禁止します。",
        "・入力された情報（自宅住所を含む）はサーバーに保存されません。自宅住所はブラウザ内（localStorage）にのみ保存されます。",
      ],
    },
    copyright: "© {year} AI ドライブプランナー All Rights Reserved.",
    search: {
      noResults: "地図検索で候補が見つかりませんでした",
      noResultsHint: "このまま入力すればAIが場所を特定してプランを作成します",
      searchError: "地図検索が一時的にご利用いただけません",
    },
  },
};

const en: TripPlannerDict = {
  header: {
    title: "AI Drive Planner",
    subtitle: "Auto-generate Japan road trip plans with Google Maps",
    heritageLink: "🌍 World Heritage Passport",
    lifeMapLink: "🗺 Life Experience Map",
    columnsLink: "📝 Drive Travel Columns",
    editPlan: "Re-edit Plan",
  },
  loading: {
    title: "Creating Plan",
    message: "AI is creating 2 travel plans...",
    messageRoute: "Fetching route data...",
  },
  error: {
    title: "An error occurred",
    aiBusy: "The AI is currently receiving a lot of requests. Please wait a while and try again.",
    aiFailed:
      "The AI could not create the plan correctly. Please try again. Reducing the number of destinations or days makes it more likely to succeed.",
    aiUnavailable: "AI plan creation is temporarily unavailable. Please try again later.",
    badRequest: "We could not process the AI plan request. Please check your input and try again.",
    aiBlocked: "The AI could not create the plan for safety reasons. Please review your destinations and profile, then try again.",
    aiEmptyResponse: "The AI did not return a response. Please try again.",
    aiTruncated: "The AI's response was cut off. Please reduce the number of destinations or days and try again.",
    aiBadFinish: "The AI stopped creating the plan partway through. Please try again.",
    aiInvalidJson:
      "The AI's response could not be read as a plan. Please try again. Reducing the number of destinations or days makes it more likely to succeed.",
    network: "Could not connect to the server. Please check your connection and try again.",
  },
  printModal: {
    title: "Select plan to export",
    planA: "Plan A",
    planB: "Plan B",
    both: "Both plans",
    print: "Print",
    copy: "Copy",
    cancel: "Cancel",
  },
  planCompare: {
    hint: "▼ Compare 2 plans ▼",
    sameName: "Recommended plan",
    sameNote: "With these conditions, your destinations fill the itinerary, so both options came out the same. They are shown as one plan.",
    sameTipOn: "Fewer destinations per day, or more time between departure and arrival, leaves room for AI-suggested stops and may produce two different options.",
    sameTipOff: "Turning on \"{omakase}\" and then choosing fewer destinations per day, or allowing more time between departure and arrival, may produce two different options.",
  },
  buttons: { print: "Print", copy: "Copy Text", copied: "Copied!" },
  itinerary: {
    day: "Day {n}",
    empty: {
      title: "Enter your travel plan",
      desc: "Fill in departure, destination and arrival in the form and press Create",
    },
    badge: { lunch: "Lunch", dinner: "Dinner" },
    travel: { highway: " (Expressway)", road: " (Local road)" },
    dogwalk: "Dog walk break (~15 min)",
    mealstop: "Meal suggestion: ",
    stay: "Stay {min} min",
    mealHint: "Use \"View on Google Maps\" to find restaurants nearby.",
    mealHintDog: "Use \"View on Google Maps\" to find restaurants. Dog owners can also use \"Find Pet-Friendly\".",
    closing17: {
      bold: "Possible closure.",
      text: "Temples, museums, and castles often close around 17:00. Please check opening hours in advance.",
    },
    closing16: {
      bold: "Watch closing time.",
      text: "Temples and museums may close between 16:00-17:00. Please check opening hours in advance.",
    },
    googleMap: "View on Google Maps",
    petSearch: "Find Pet-Friendly",
    businessHours: "Please check opening hours in advance",
    commentary: { title: "AI Planner Commentary" },
    removed: {
      title: "Your destinations not included in this plan",
      aiJudgment: "AI's judgment",
      unexplained: "Omitted by the AI without giving a reason",
      hint: "Changing the conditions and creating the plan again may help (facility names are recognized more reliably than addresses).",
    },
    schedule: {
      over: "This day is expected to exceed your desired arrival time ({desired}) by about {min} min (estimated arrival {arrival})",
      overOvernight: "This day is expected to exceed your desired arrival time ({desired}) by about {min} min and run past midnight (estimated arrival {arrival})",
      nextDay: "{time} the next day",
      laterDays: "{time}, {n} days later",
      basisAi: "Based on the AI's times",
      basisRoute: "Based on map route driving times (traffic not included)",
    },
    carRestriction: {
      yearRound: "{place} is a private-car restricted area. Private cars cannot enter; you can get there by route bus, shuttle bus, etc.",
      seasonal: "{place} has private-car restrictions during certain periods. Please check official information for restrictions on your visit date.",
      place: "{area} ({spots})",
      separator: ", ",
      note: "* Only the major registered restricted areas are checked.",
      badge: "🚫 Private-car restricted area",
    },
    highlights: { title: "Plan Highlights" },
    tips: { title: "Tips & Advice" },
    dogTips: { title: "Dog Travel Tips" },
    youtube: {
      title: "Preview this plan on YouTube",
      desc: "Check out related YouTube videos to get a feel for the destinations.",
      linkText: "Watch \"{query}\" on YouTube",
    },
    meal: { lunch: "Lunch", dinner: "Dinner" },
  },
  form: {
    appTitle: "AI Drive Planner",
    appDescription:
      "Just enter your departure, destination, and arrival — AI automatically creates the optimal Japan road trip plan. Integrates with Google Maps to display real routes, distances, and travel times. AI handles traffic forecasts, seasonal events, restaurant suggestions, and parking info. Supports dog-friendly trips and various travel styles.",
    tags: ["AI Auto Plan", "Traffic Forecast", "2-Plan Comparison", "Google Maps", "Dog-Friendly", "Free"],
    xFollow: "Follow @AIDRIVEPLAN on X",
    tripDuration: {
      title: "Trip Duration",
      options: ["Day trip", "1 night 2 days", "2 nights 3 days", "3 nights 4 days", "4 nights 5 days"],
    },
    departureDate: {
      label: "Departure Date",
      optional: "(optional)",
      hint: "AI will consider holiday traffic and events if a date is provided",
    },
    omakase: {
      label: "Leave details to AI",
      description: "AI will plan stops between your departure and arrival based on time and distance.",
    },
    dog: {
      label: "Travelling with a dog",
      description: "Includes walk breaks and dog-friendly restaurants",
    },
    highway: {
      label: "Use expressways",
      on: "Route will use expressways",
      off: "Route will use local roads only",
    },
    traveler: {
      title: "Traveler Info",
      optional: "(optional — reflected in AI suggestions)",
      partyType: {
        label: "Travel Style",
        options: ["Not selected", "Solo", "Couple / Spouses", "Family", "Friends / Group", "Senior"],
      },
      ageRange: {
        label: "Age Group",
        options: ["Not selected", "20s", "30s", "40s", "50s", "60s", "70+"],
      },
      hobbies: {
        label: "Hobbies / Interests",
        placeholder: "e.g. hot springs, fishing, photography, gourmet, shrines",
        hint: "Enter multiple interests separated by spaces. AI will reflect these in suggested stops.",
      },
      children: {
        label: "Travelling with children",
        agePlaceholder: "e.g. age 3, age 7",
        ageHint: "AI will suggest spots suitable for your children's ages",
      },
    },
    homeAddress: {
      title: "Register Home Address",
      edit: "Edit",
      delete: "Delete",
      privacySaved: "🔒 Your address is stored only in your browser and is never sent externally.",
      placeholder: "e.g. 1-1-1 Jingumae, Shibuya, Tokyo",
      register: "Save",
      hint: "Once registered, tap to auto-fill departure/arrival fields",
      privacy2: "🔒 Stored only in localStorage. Never sent to any server or shared with third parties.",
      saved: "Home address saved",
    },
    day: { title: "Day {n}", dayTrip: " (Day trip)" },
    departure: {
      label: "Departure",
      required: "* Required",
      homeButton: "Home",
      placeholder0: "e.g. Tokyo Station, home address...",
      placeholder1: "Auto-filled from previous day's arrival (editable)",
      prevDayNote: "Filled from previous day's arrival (editable)",
    },
    destination: {
      label: "Destination",
      required: "* At least 1 required",
      searchPlaceholder: "Search place name",
      firstToggle: "Go here first",
      mealLabel: "Meal",
      mealNone: "None",
      mealLunch: "Lunch",
      mealDinner: "Dinner",
      add: "Add destination",
    },
    arrival: {
      label: "Arrival",
      required: "* Required",
      placeholder: "e.g. home, hotel name...",
      timeHint: "Desired arrival time (defaults to 20:00 if left blank)",
    },
    lunch: {
      toggle: "Include lunch",
      locationLabel: "Lunch area (optional, 1 location)",
      locationPlaceholder: "e.g. near Kamakura Station (1 location only)",
      genreLabel: "Cuisine type (optional, 1 type)",
      genrePlaceholder: "e.g. seafood (1 type only)",
      atDestination: "Lunch will be at “{name}” (no separate lunch stop will be added)",
    },
    dinner: {
      toggle: "Include dinner",
      locationLabel: "Dinner area (optional, 1 location)",
      locationPlaceholder: "e.g. near Hakone-Yumoto (1 location only)",
      genreLabel: "Cuisine type (optional, 1 type)",
      genrePlaceholder: "e.g. yakiniku (1 type only)",
      atDestination: "Dinner will be at “{name}” (no separate dinner stop will be added)",
    },
    errors: {
      departure: "Please enter a departure location",
      arrival: "Please enter an arrival location",
      dest0: "Please enter at least one destination",
      mealMultiple: "Enter only one location (do not use commas to separate)",
      genreMultiple: "Enter only one cuisine type (do not use commas to separate)",
    },
    errorSummary: {
      title: "Some required fields are missing",
      desc: "Please fill in all required fields: departure, destination, and arrival.",
    },
    submit: "Create Trip Plan",
    submitting: "Creating plan...",
    disclaimer: {
      title: "⚠️ Disclaimer",
      items: [
        "· Travel plans generated by this service are AI-created and may differ from actual travel times, distances, road conditions, opening hours, or fees.",
        "· Please verify in advance the operating status of suggested spots and restaurants, and whether pets are allowed.",
        "· The operator accepts no liability for any damages arising from use of this service.",
        "· Please obey traffic laws and drive safely.",
        "· Private-car restriction warnings cover only the major restricted areas we have registered and do not include every restriction. Whether and when restrictions apply varies by year and season, so please check official information before your visit.",
      ],
    },
    terms: {
      title: "📋 Terms of Use",
      items: [
        "· Unauthorized reproduction, reuse, or redistribution of the source code, design, or content of this site is prohibited.",
        "· Entered information (including home address) is not stored on any server. Home address is stored only in your browser (localStorage).",
      ],
    },
    copyright: "© {year} AI Drive Planner All Rights Reserved.",
    search: {
      noResults: "No results found in map search",
      noResultsHint: "You can still type the name — AI will identify the location when creating your plan",
      searchError: "Map search is temporarily unavailable",
    },
  },
};

const ko: TripPlannerDict = {
  header: {
    title: "AI 드라이브 플래너",
    subtitle: "일본 자동차 여행 플랜 자동 생성 · Google 지도 연동",
    heritageLink: "🌍 세계유산 패스포트",
    lifeMapLink: "🗺 인생 체험 지도",
    columnsLink: "📝 드라이브 여행 칼럼",
    editPlan: "플랜 재편집",
  },
  loading: {
    title: "플랜 작성 중",
    message: "AI가 2개의 여행 플랜을 작성 중...",
    messageRoute: "경로 데이터 취득 중...",
  },
  error: {
    title: "오류가 발생했습니다",
    aiBusy: "현재 AI에 접속이 몰리고 있습니다. 잠시 후 다시 시도해 주세요.",
    aiFailed:
      "AI가 플랜을 제대로 만들지 못했습니다. 번거로우시겠지만 다시 시도해 주세요. 목적지 수나 일수를 줄이면 성공하기 쉬워집니다.",
    aiUnavailable: "AI 플랜 작성을 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    badRequest: "AI 플랜 작성 요청을 처리하지 못했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.",
    aiBlocked: "AI가 안전상의 이유로 플랜을 만들지 못했습니다. 목적지나 프로필 내용을 확인한 후 다시 시도해 주세요.",
    aiEmptyResponse: "AI로부터 응답을 받지 못했습니다. 번거로우시겠지만 다시 시도해 주세요.",
    aiTruncated: "AI의 응답이 도중에 끊겼습니다. 목적지 수나 일수를 줄인 후 다시 시도해 주세요.",
    aiBadFinish: "AI가 플랜 작성을 도중에 중단했습니다. 번거로우시겠지만 다시 시도해 주세요.",
    aiInvalidJson:
      "AI의 응답을 플랜으로 읽어들이지 못했습니다. 번거로우시겠지만 다시 시도해 주세요. 목적지 수나 일수를 줄이면 성공하기 쉬워집니다.",
    network: "서버와 통신하지 못했습니다. 연결 상태를 확인한 후 다시 시도해 주세요.",
  },
  printModal: {
    title: "출력할 플랜 선택",
    planA: "플랜A",
    planB: "플랜B",
    both: "두 플랜 모두",
    print: "인쇄",
    copy: "복사",
    cancel: "취소",
  },
  planCompare: {
    hint: "▼ 2개의 플랜을 비교할 수 있습니다 ▼",
    sameName: "추천 플랜",
    sameNote: "이 조건에서는 지정한 목적지로 일정이 정해져 두 플랜이 같아졌습니다. 하나의 플랜으로 표시합니다.",
    sameTipOn: "하루 목적지를 줄이거나 출발·도착 시간에 여유를 두면 AI가 스폿을 추가할 수 있어 두 플랜으로 나뉠 수 있습니다.",
    sameTipOff: "「{omakase}」를 켠 뒤 하루 목적지를 줄이거나 출발·도착 시간에 여유를 두면 두 플랜으로 나뉠 수 있습니다.",
  },
  buttons: { print: "인쇄", copy: "텍스트 복사", copied: "복사됨!" },
  itinerary: {
    day: "{n}일째",
    empty: {
      title: "여행 플랜을 입력해 주세요",
      desc: "왼쪽 폼에서 출발지·목적지를 입력하고 작성 버튼을 눌러 주세요",
    },
    badge: { lunch: "점심", dinner: "저녁" },
    travel: { highway: "（고속도로 이용）", road: "（일반도로）" },
    dogwalk: "반려견 산책 휴게（약 15분）",
    mealstop: "식사 추천: ",
    stay: "체류 {min}분",
    mealHint: "「Google 지도로 확인」에서 주변 음식점을 선택하세요.",
    mealHintDog: "「Google 지도로 확인」에서 주변 음식점을 선택하세요. 반려견 동반 시 「펫 OK로 찾기」도 이용해 보세요.",
    closing17: {
      bold: "폐관 가능성 있음.",
      text: "사찰·박물관·성 등은 17시경에 폐관하는 경우가 많습니다. 사전에 영업시간을 확인해 주세요.",
    },
    closing16: {
      bold: "폐관 시간 주의.",
      text: "사찰·박물관 등은 16～17시경에 폐관할 수 있습니다. 사전에 영업시간을 확인해 주세요.",
    },
    googleMap: "Google 지도로 확인",
    petSearch: "펫 OK로 찾기",
    businessHours: "영업시간을 사전에 확인해 주세요",
    commentary: { title: "AI 플래너 해설" },
    removed: {
      title: "이 플랜에 포함되지 못한 지정 목적지",
      aiJudgment: "AI의 판단",
      unexplained: "AI가 이유를 밝히지 않고 생략",
      hint: "조건을 바꿔 다시 만들면 개선될 수 있습니다(목적지는 주소보다 시설명으로 입력하면 더 잘 인식됩니다).",
    },
    schedule: {
      over: "이날은 희망 도착 시간({desired})을 약 {min}분 초과할 것으로 예상됩니다(도착 예상 {arrival})",
      overOvernight: "이날은 희망 도착 시간({desired})을 약 {min}분 초과해 날짜를 넘길 것으로 예상됩니다(도착 예상 {arrival})",
      nextDay: "다음 날 {time}",
      laterDays: "{n}일 후 {time}",
      basisAi: "AI가 제시한 시각으로 판정",
      basisRoute: "지도 경로의 소요 시간(교통 체증 미포함)으로 판정",
    },
    carRestriction: {
      yearRound: "{place}은(는) 마이카 규제 구역입니다. 자가용으로는 들어갈 수 없습니다. 노선버스나 셔틀버스 등으로 갈 수 있습니다.",
      seasonal: "{place}은(는) 시기에 따라 마이카 규제가 있습니다. 방문일의 규제를 공식 정보로 확인해 주세요.",
      place: "{area}({spots})",
      separator: ", ",
      note: "※ 등록된 주요 규제 구역만 판정합니다.",
      badge: "🚫 마이카 규제 구역",
    },
    highlights: { title: "플랜 포인트" },
    tips: { title: "어드바이스" },
    dogTips: { title: "반려견 여행 어드바이스" },
    youtube: {
      title: "이 플랜을 영상으로 미리 보기",
      desc: "실제 분위기를 확인하고 싶은 분은 관련 YouTube 영상을 참고하세요.",
      linkText: "YouTube에서 「{query}」 보기",
    },
    meal: { lunch: "점심", dinner: "저녁" },
  },
  form: {
    appTitle: "AI 드라이브 플래너",
    appDescription:
      "출발지·목적지·도착지를 입력하기만 하면 AI가 최적의 일본 드라이브 여행 플랜을 자동으로 작성합니다. Google 지도와 연동하여 실제 도로 경로·거리·이동 시간을 표시. AI가 교통 혼잡 예측·계절 이벤트·음식점·주차 정보를 종합 기획. 반려견 동반, 여행 스타일, 연령대에도 대응.",
    tags: ["AI 자동 플랜", "교통 예측", "2플랜 비교", "Google Maps", "반려견 OK", "완전 무료"],
    xFollow: "공식 X（@AIDRIVEPLAN）팔로우",
    tripDuration: {
      title: "여행 기간",
      options: ["당일치기", "1박 2일", "2박 3일", "3박 4일", "4박 5일"],
    },
    departureDate: {
      label: "출발일",
      optional: "（선택）",
      hint: "입력하면 AI가 공휴일 교통 혼잡 및 이벤트 정보를 고려합니다",
    },
    omakase: {
      label: "목적지 이외는 AI에게 맡기기",
      description: "목적지 이외의 경유지는 출발지·도착지·시간 등을 고려하여 AI가 플랜을 작성합니다.",
    },
    dog: {
      label: "반려견 동반 여행",
      description: "산책 시간·반려견 동반 가능 음식점 고려",
    },
    highway: {
      label: "고속도로 이용",
      on: "고속도로를 이용하여 경로를 작성합니다",
      off: "일반도로만으로 경로를 작성합니다",
    },
    traveler: {
      title: "여행자 정보",
      optional: "（선택·AI 제안에 반영）",
      partyType: {
        label: "여행 스타일",
        options: ["미선택", "혼자 여행", "커플·부부", "가족 여행", "친구·그룹", "시니어 여행"],
      },
      ageRange: {
        label: "연령대",
        options: ["미선택", "20대", "30대", "40대", "50대", "60대", "70대 이상"],
      },
      hobbies: {
        label: "취미·관심사",
        placeholder: "예: 온천 낚시 사진 맛집 신사 탐방",
        hint: "스페이스로 구분하여 여러 개 입력 가능. AI 경유지에 반영됩니다",
      },
      children: {
        label: "어린이 동반",
        agePlaceholder: "예: 3살, 7살",
        ageHint: "어린이 연령에 맞는 스팟을 AI가 제안합니다",
      },
    },
    homeAddress: {
      title: "자택 주소 등록",
      edit: "변경",
      delete: "삭제",
      privacySaved: "🔒 주소는 브라우저 내에만 저장됩니다. 외부 전송은 일절 없습니다.",
      placeholder: "예: 도쿄도 시부야구 진구마에 1-1-1",
      register: "등록",
      hint: "등록하면 출발지·도착지에 원터치로 입력할 수 있습니다",
      privacy2: "🔒 주소는 브라우저 내（localStorage）에만 저장됩니다. 서버 전송이나 제3자 공유는 일절 없습니다.",
      saved: "자택 주소를 저장했습니다",
    },
    day: { title: "{n}일째", dayTrip: "（당일치기）" },
    departure: {
      label: "출발지",
      required: "*필수",
      homeButton: "자택",
      placeholder0: "예: 도쿄역, 자택 주소...",
      placeholder1: "전날 도착지에서 자동 입력（변경 가능）",
      prevDayNote: "전날 도착지에서 자동 입력됨（변경 가능）",
    },
    destination: {
      label: "목적지",
      required: "*1개 이상 필수",
      searchPlaceholder: "장소명 입력 후 검색",
      firstToggle: "이 장소에 먼저 가기",
      mealLabel: "식사",
      mealNone: "지정 안 함",
      mealLunch: "점심",
      mealDinner: "저녁",
      add: "목적지 추가",
    },
    arrival: {
      label: "도착지",
      required: "*필수",
      placeholder: "예: 자택, 호텔명...",
      timeHint: "도착지 희망 도착 시각（미입력 시 20:00）",
    },
    lunch: {
      toggle: "점심 포함",
      locationLabel: "식사 장소（선택, 1개소）",
      locationPlaceholder: "예: 가마쿠라역 주변（1곳만）",
      genreLabel: "장르（선택, 1개）",
      genrePlaceholder: "예: 해산물（1개만）",
      atDestination: "목적지 「{name}」에서 점심을 먹습니다(별도의 점심 장소는 추가하지 않습니다)",
    },
    dinner: {
      toggle: "저녁 포함",
      locationLabel: "식사 장소（선택, 1개소）",
      locationPlaceholder: "예: 하코네유모토 주변（1곳만）",
      genreLabel: "장르（선택, 1개）",
      genrePlaceholder: "예: 야키니쿠（1개만）",
      atDestination: "목적지 「{name}」에서 저녁을 먹습니다(별도의 저녁 장소는 추가하지 않습니다)",
    },
    errors: {
      departure: "출발지를 입력해 주세요",
      arrival: "도착지를 입력해 주세요",
      dest0: "목적지를 1개 이상 입력해 주세요",
      mealMultiple: "식사 장소는 1개만 입력해 주세요（「、」나「,」로 구분하지 마세요）",
      genreMultiple: "장르는 1개만 입력해 주세요（「、」나「,」로 구분하지 마세요）",
    },
    errorSummary: {
      title: "입력 내용이 부족합니다",
      desc: "필수 항목（출발지·목적지·도착지）을 모두 입력해 주세요.",
    },
    submit: "여행 플랜 작성",
    submitting: "플랜 작성 중...",
    disclaimer: {
      title: "⚠️ 면책사항",
      items: [
        "· 본 서비스가 생성하는 여행 플랜은 AI 자동 생성이며, 실제 소요 시간·거리·도로 상황·영업 시간·요금 등과 다를 수 있습니다.",
        "· 제안된 스팟이나 음식점의 영업 상황, 반려동물 동반 가능 여부 등은 반드시 사전에 직접 확인해 주세요.",
        "· 본 서비스 이용으로 발생한 어떠한 손해에 대해서도 운영자는 일절 책임을 지지 않습니다.",
        "· 교통 규칙·법규를 준수하고 안전 운전으로 여행하세요.",
        "· 마이카 규제 경고는 등록된 주요 규제 구역만 대상이며, 모든 규제를 망라하지 않습니다. 규제 여부와 기간은 연도나 시기에 따라 달라지므로 방문 전에 공식 정보를 확인해 주세요.",
      ],
    },
    terms: {
      title: "📋 이용 시 주의사항",
      items: [
        "· 본 사이트의 소스코드·디자인·콘텐츠의 무단 복제·전용·재배포를 금지합니다.",
        "· 입력된 정보（자택 주소 포함）는 서버에 저장되지 않습니다. 자택 주소는 브라우저 내（localStorage）에만 저장됩니다.",
      ],
    },
    copyright: "© {year} AI Drive Planner All Rights Reserved.",
    search: {
      noResults: "지도 검색에서 후보를 찾을 수 없었습니다",
      noResultsHint: "그대로 입력하면 AI가 장소를 특정하여 플랜을 작성합니다",
      searchError: "지도 검색을 일시적으로 이용할 수 없습니다",
    },
  },
};

const zhCN: TripPlannerDict = {
  header: {
    title: "AI 自驾游规划师",
    subtitle: "自动生成日本自驾旅行计划 · Google 地图联动显示",
    heritageLink: "🌍 世界遗产护照",
    lifeMapLink: "🗺 人生体验地图",
    columnsLink: "📝 自驾旅行专栏",
    editPlan: "重新编辑计划",
  },
  loading: {
    title: "计划生成中",
    message: "AI 正在生成 2 个旅行计划...",
    messageRoute: "正在获取路线数据...",
  },
  error: {
    title: "发生错误",
    aiBusy: "当前AI访问量较大，请稍后再试。",
    aiFailed: "AI未能正确生成旅行计划。请重试。减少目的地数量或天数更容易成功。",
    aiUnavailable: "AI计划生成暂时无法使用，请稍后再试。",
    badRequest: "无法处理AI计划生成请求。请检查输入内容后重试。",
    aiBlocked: "出于安全原因，AI未能生成旅行计划。请检查目的地和个人资料内容后重试。",
    aiEmptyResponse: "AI没有返回任何响应。请重试。",
    aiTruncated: "AI的响应中途被截断。请减少目的地数量或天数后重试。",
    aiBadFinish: "AI在生成计划的过程中中断了。请重试。",
    aiInvalidJson: "无法将AI的响应读取为旅行计划。请重试。减少目的地数量或天数更容易成功。",
    network: "与服务器通信失败。请检查网络连接后重试。",
  },
  printModal: {
    title: "选择要导出的计划",
    planA: "计划A",
    planB: "计划B",
    both: "两个计划",
    print: "打印",
    copy: "复制",
    cancel: "取消",
  },
  planCompare: {
    hint: "▼ 可以比较两个计划 ▼",
    sameName: "推荐计划",
    sameNote: "在此条件下，行程由您指定的目的地决定，两个方案完全相同，因此合并为一个计划显示。",
    sameTipOn: "减少每天的目的地，或在出发与到达之间留出更多时间，AI 便能添加景点，可能会生成两个不同的方案。",
    sameTipOff: "开启「{omakase}」后，再减少每天的目的地或留出更多时间，可能会生成两个不同的方案。",
  },
  buttons: { print: "打印", copy: "复制文本", copied: "已复制！" },
  itinerary: {
    day: "第{n}天",
    empty: {
      title: "请输入旅行计划",
      desc: "请在左侧表单中输入出发地和目的地，然后点击创建按钮",
    },
    badge: { lunch: "午餐", dinner: "晚餐" },
    travel: { highway: "（走高速公路）", road: "（普通公路）" },
    dogwalk: "遛狗休息（约 15 分钟）",
    mealstop: "推荐餐厅: ",
    stay: "停留 {min} 分钟",
    mealHint: "请通过「在 Google 地图上确认」选择附近餐厅。",
    mealHintDog: "请通过「在 Google 地图上确认」选择附近餐厅。带宠物的朋友也可使用「搜索宠物友好餐厅」。",
    closing17: {
      bold: "可能已闭馆。",
      text: "寺庙、博物馆、城堡等通常在 17 点左右闭馆，请提前确认营业时间。",
    },
    closing16: {
      bold: "注意闭馆时间。",
      text: "寺庙、博物馆等可能在 16～17 点闭馆，请提前确认营业时间。",
    },
    googleMap: "在 Google 地图上确认",
    petSearch: "搜索宠物友好餐厅",
    businessHours: "请提前确认营业时间",
    commentary: { title: "AI 规划师解说" },
    removed: {
      title: "未能纳入本方案的指定目的地",
      aiJudgment: "AI的判断",
      unexplained: "AI未说明理由而省略",
      hint: "更改条件后重新生成可能会有所改善（目的地填写设施名称比填写地址更容易识别）。",
    },
    schedule: {
      over: "当天预计比期望到达时间（{desired}）晚约{min}分钟（预计到达 {arrival}）",
      overOvernight: "当天预计比期望到达时间（{desired}）晚约{min}分钟，并将跨过午夜（预计到达 {arrival}）",
      nextDay: "次日{time}",
      laterDays: "{n}天后{time}",
      basisAi: "根据AI给出的时间判断",
      basisRoute: "根据地图路线的行驶时间判断（不含拥堵）",
    },
    carRestriction: {
      yearRound: "{place}为私家车限行区域，私家车无法进入，可乘坐路线巴士或接驳巴士等前往。",
      seasonal: "{place}在部分时期实行私家车限行，请通过官方信息确认访问当天的限行情况。",
      place: "{area}（{spots}）",
      separator: "、",
      note: "※仅判断已登记的主要限行区域。",
      badge: "🚫 私家车限行区域",
    },
    highlights: { title: "计划亮点" },
    tips: { title: "建议与提示" },
    dogTips: { title: "带狗旅行建议" },
    youtube: {
      title: "通过视频预览此计划",
      desc: "想提前了解实际氛围的朋友，可参考相关 YouTube 视频。",
      linkText: "在 YouTube 上搜索「{query}」",
    },
    meal: { lunch: "午餐", dinner: "晚餐" },
  },
  form: {
    appTitle: "AI 自驾游规划师",
    appDescription:
      "只需输入出发地、目的地、终点，AI 自动为您制定最优日本自驾旅行计划。与 Google 地图联动，自动显示实际道路路线、距离和行驶时间。AI 统筹规划交通拥堵预测、季节活动、餐厅推荐、停车信息，支持携犬旅行及多种旅行风格。",
    tags: ["AI 自动规划", "拥堵预测", "双计划对比", "Google Maps", "携犬友好", "完全免费"],
    xFollow: "关注官方 X（@AIDRIVEPLAN）",
    tripDuration: {
      title: "旅行天数",
      options: ["当天往返", "1晚2天", "2晚3天", "3晚4天", "4晚5天"],
    },
    departureDate: {
      label: "出发日期",
      optional: "（可选）",
      hint: "填写后 AI 将考虑节假日交通拥堵和活动信息",
    },
    omakase: {
      label: "目的地以外交给 AI 规划",
      description: "AI 将综合出发地、终点及时间，为您规划沿途停靠点。",
    },
    dog: { label: "携犬旅行", description: "考虑遛狗时间及宠物友好餐厅" },
    highway: {
      label: "使用高速公路",
      on: "将通过高速公路规划路线",
      off: "仅使用普通公路规划路线",
    },
    traveler: {
      title: "旅行者信息",
      optional: "（可选·将反映在 AI 建议中）",
      partyType: {
        label: "旅行风格",
        options: ["未选择", "独自旅行", "情侣·夫妻", "家庭旅行", "朋友·团体", "银发旅行"],
      },
      ageRange: {
        label: "年龄段",
        options: ["未选择", "20多岁", "30多岁", "40多岁", "50多岁", "60多岁", "70岁以上"],
      },
      hobbies: {
        label: "兴趣爱好",
        placeholder: "例: 温泉 钓鱼 摄影 美食 神社参拜",
        hint: "可用空格分隔输入多个兴趣，AI 将据此推荐景点",
      },
      children: {
        label: "携带儿童",
        agePlaceholder: "例: 3岁、7岁",
        ageHint: "AI 将推荐适合孩子年龄的景点",
      },
    },
    homeAddress: {
      title: "注册家庭住址",
      edit: "修改",
      delete: "删除",
      privacySaved: "🔒 地址仅存储在您的浏览器中，不会发送到外部。",
      placeholder: "例: 东京都涩谷区神宫前1-1-1",
      register: "保存",
      hint: "注册后可一键填入出发地和终点",
      privacy2: "🔒 仅存储在浏览器（localStorage）中，不会上传至服务器或共享给第三方。",
      saved: "家庭住址已保存",
    },
    day: { title: "第{n}天", dayTrip: "（当天往返）" },
    departure: {
      label: "出发地",
      required: "*必填",
      homeButton: "家",
      placeholder0: "例: 东京站、家庭住址...",
      placeholder1: "自动填入上一天的终点（可修改）",
      prevDayNote: "已自动填入上一天的终点（可修改）",
    },
    destination: {
      label: "目的地",
      required: "*至少填写1个",
      searchPlaceholder: "输入地点名称搜索",
      firstToggle: "先去这个地方",
      mealLabel: "用餐",
      mealNone: "不指定",
      mealLunch: "午餐",
      mealDinner: "晚餐",
      add: "添加目的地",
    },
    arrival: {
      label: "终点",
      required: "*必填",
      placeholder: "例: 家、酒店名称...",
      timeHint: "期望到达终点的时间（未填写则默认为 20:00）",
    },
    lunch: {
      toggle: "包含午餐",
      locationLabel: "用餐地点（可选，仅限1处）",
      locationPlaceholder: "例: 镰仓站附近（仅限1处）",
      genreLabel: "餐饮类型（可选，仅限1种）",
      genrePlaceholder: "例: 海鲜（仅限1种）",
      atDestination: "将在目的地「{name}」用午餐（不再另外添加午餐地点）",
    },
    dinner: {
      toggle: "包含晚餐",
      locationLabel: "用餐地点（可选，仅限1处）",
      locationPlaceholder: "例: 箱根汤本附近（仅限1处）",
      genreLabel: "餐饮类型（可选，仅限1种）",
      genrePlaceholder: "例: 烤肉（仅限1种）",
      atDestination: "将在目的地「{name}」用晚餐（不再另外添加晚餐地点）",
    },
    errors: {
      departure: "请输入出发地",
      arrival: "请输入终点",
      dest0: "请至少输入一个目的地",
      mealMultiple: "用餐地点只能输入1处（请勿用逗号分隔）",
      genreMultiple: "餐饮类型只能输入1种（请勿用逗号分隔）",
    },
    errorSummary: {
      title: "部分必填项未填写",
      desc: "请填写所有必填项：出发地、目的地、终点。",
    },
    submit: "生成旅行计划",
    submitting: "计划生成中...",
    disclaimer: {
      title: "⚠️ 免责声明",
      items: [
        "· 本服务生成的旅行计划由 AI 自动生成，实际所需时间、距离、道路状况、营业时间、费用等可能有所不同。",
        "· 请事先自行确认推荐景点和餐厅的营业状况及宠物是否允许入内。",
        "· 对于因使用本服务而产生的任何损失，运营方概不负责。",
        "· 请遵守交通规则和法律，安全驾驶。",
        "· 私家车限行警告仅针对已登记的主要限行区域，并未涵盖所有限行规定。是否限行及限行期间因年份和季节而异，请在出行前查阅官方信息。",
      ],
    },
    terms: {
      title: "📋 使用注意事项",
      items: [
        "· 禁止未经授权复制、转用或再发布本网站的源代码、设计或内容。",
        "· 输入的信息（包括家庭住址）不会存储在服务器上。家庭住址仅存储在浏览器（localStorage）中。",
      ],
    },
    copyright: "© {year} AI 自驾游规划师 All Rights Reserved.",
    search: {
      noResults: "地图搜索未找到候选地点",
      noResultsHint: "您可以直接输入，AI 将在生成计划时识别地点",
      searchError: "地图搜索暂时无法使用",
    },
  },
};

const zhTW: TripPlannerDict = {
  header: {
    title: "AI 自駕遊規劃師",
    subtitle: "自動生成日本自駕旅行計畫 · Google 地圖聯動顯示",
    heritageLink: "🌍 世界遺產護照",
    lifeMapLink: "🗺 人生體驗地圖",
    columnsLink: "📝 自駕旅行專欄",
    editPlan: "重新編輯計畫",
  },
  loading: {
    title: "計畫生成中",
    message: "AI 正在生成 2 個旅行計畫...",
    messageRoute: "正在取得路線資料...",
  },
  error: {
    title: "發生錯誤",
    aiBusy: "目前AI存取量較大，請稍後再試。",
    aiFailed: "AI未能正確產生旅行計畫。請重試。減少目的地數量或天數較容易成功。",
    aiUnavailable: "AI計畫產生暫時無法使用，請稍後再試。",
    badRequest: "無法處理AI計畫產生請求。請確認輸入內容後重試。",
    aiBlocked: "基於安全考量，AI未能產生旅行計畫。請確認目的地與個人資料內容後重試。",
    aiEmptyResponse: "AI沒有傳回任何回應。請重試。",
    aiTruncated: "AI的回應在中途被截斷。請減少目的地數量或天數後重試。",
    aiBadFinish: "AI在產生計畫的過程中中斷了。請重試。",
    aiInvalidJson: "無法將AI的回應讀取為旅行計畫。請重試。減少目的地數量或天數較容易成功。",
    network: "與伺服器通訊失敗。請確認網路連線後重試。",
  },
  printModal: {
    title: "選擇要匯出的計畫",
    planA: "計畫A",
    planB: "計畫B",
    both: "兩個計畫",
    print: "列印",
    copy: "複製",
    cancel: "取消",
  },
  planCompare: {
    hint: "▼ 可以比較兩個計畫 ▼",
    sameName: "推薦計畫",
    sameNote: "在此條件下，行程由您指定的目的地決定，兩個方案完全相同，因此合併為一個計畫顯示。",
    sameTipOn: "減少每天的目的地，或在出發與抵達之間留出更多時間，AI 便能加入景點，可能會產生兩個不同的方案。",
    sameTipOff: "開啟「{omakase}」後，再減少每天的目的地或留出更多時間，可能會產生兩個不同的方案。",
  },
  buttons: { print: "列印", copy: "複製文字", copied: "已複製！" },
  itinerary: {
    day: "第{n}天",
    empty: {
      title: "請輸入旅行計畫",
      desc: "請在左側表單中輸入出發地和目的地，然後按下建立按鈕",
    },
    badge: { lunch: "午餐", dinner: "晚餐" },
    travel: { highway: "（高速公路）", road: "（一般道路）" },
    dogwalk: "遛狗休息（約 15 分鐘）",
    mealstop: "推薦餐廳: ",
    stay: "停留 {min} 分鐘",
    mealHint: "請透過「在 Google 地圖上確認」選擇附近餐廳。",
    mealHintDog: "請透過「在 Google 地圖上確認」選擇附近餐廳。攜帶寵物的朋友也可使用「搜尋寵物友善餐廳」。",
    closing17: {
      bold: "可能已閉館。",
      text: "寺廟、博物館、城堡等通常在 17 點左右閉館，請事先確認營業時間。",
    },
    closing16: {
      bold: "注意閉館時間。",
      text: "寺廟、博物館等可能在 16～17 點閉館，請事先確認營業時間。",
    },
    googleMap: "在 Google 地圖上確認",
    petSearch: "搜尋寵物友善餐廳",
    businessHours: "請事先確認營業時間",
    commentary: { title: "AI 規劃師解說" },
    removed: {
      title: "未能納入本方案的指定目的地",
      aiJudgment: "AI的判斷",
      unexplained: "AI未說明理由而省略",
      hint: "變更條件後重新產生可能會有所改善（目的地填寫設施名稱比填寫地址更容易辨識）。",
    },
    schedule: {
      over: "當天預計比期望抵達時間（{desired}）晚約{min}分鐘（預計抵達 {arrival}）",
      overOvernight: "當天預計比期望抵達時間（{desired}）晚約{min}分鐘，並將跨過午夜（預計抵達 {arrival}）",
      nextDay: "隔天{time}",
      laterDays: "{n}天後{time}",
      basisAi: "依AI提供的時間判斷",
      basisRoute: "依地圖路線的行車時間判斷（不含塞車）",
    },
    carRestriction: {
      yearRound: "{place}為自用車管制區域，自用車無法進入，可搭乘路線巴士或接駁巴士等前往。",
      seasonal: "{place}在部分期間實施自用車管制，請透過官方資訊確認造訪當天的管制情況。",
      place: "{area}（{spots}）",
      separator: "、",
      note: "※僅判斷已登錄的主要管制區域。",
      badge: "🚫 自用車管制區域",
    },
    highlights: { title: "計畫亮點" },
    tips: { title: "建議與提示" },
    dogTips: { title: "帶狗旅行建議" },
    youtube: {
      title: "透過影片預覽此計畫",
      desc: "想事先了解實際氛圍的朋友，可參考相關 YouTube 影片。",
      linkText: "在 YouTube 上搜尋「{query}」",
    },
    meal: { lunch: "午餐", dinner: "晚餐" },
  },
  form: {
    appTitle: "AI 自駕遊規劃師",
    appDescription:
      "只需輸入出發地、目的地、終點，AI 自動為您制定最優日本自駕旅行計畫。與 Google 地圖聯動，自動顯示實際道路路線、距離和行駛時間。AI 統籌規劃交通壅塞預測、季節活動、餐廳推薦、停車資訊，支援攜犬旅行及多種旅行風格。",
    tags: ["AI 自動規劃", "壅塞預測", "雙計畫比較", "Google Maps", "攜犬友善", "完全免費"],
    xFollow: "追蹤官方 X（@AIDRIVEPLAN）",
    tripDuration: {
      title: "旅行天數",
      options: ["當天來回", "1晚2天", "2晚3天", "3晚4天", "4晚5天"],
    },
    departureDate: {
      label: "出發日期",
      optional: "（選填）",
      hint: "填寫後 AI 將考量節假日交通壅塞和活動資訊",
    },
    omakase: {
      label: "目的地以外交給 AI 規劃",
      description: "AI 將綜合出發地、終點及時間，為您規劃沿途停靠點。",
    },
    dog: { label: "攜犬旅行", description: "考量遛狗時間及寵物友善餐廳" },
    highway: {
      label: "使用高速公路",
      on: "將透過高速公路規劃路線",
      off: "僅使用一般道路規劃路線",
    },
    traveler: {
      title: "旅行者資訊",
      optional: "（選填·將反映在 AI 建議中）",
      partyType: {
        label: "旅行風格",
        options: ["未選擇", "個人旅行", "情侶·夫妻", "家庭旅行", "朋友·團體", "銀髮旅行"],
      },
      ageRange: {
        label: "年齡層",
        options: ["未選擇", "20多歲", "30多歲", "40多歲", "50多歲", "60多歲", "70歲以上"],
      },
      hobbies: {
        label: "興趣愛好",
        placeholder: "例: 溫泉 釣魚 攝影 美食 神社參拜",
        hint: "可用空格分隔輸入多個興趣，AI 將據此推薦景點",
      },
      children: {
        label: "攜帶兒童",
        agePlaceholder: "例: 3歲、7歲",
        ageHint: "AI 將推薦適合孩子年齡的景點",
      },
    },
    homeAddress: {
      title: "註冊家庭住址",
      edit: "修改",
      delete: "刪除",
      privacySaved: "🔒 地址僅儲存在您的瀏覽器中，不會傳送至外部。",
      placeholder: "例: 東京都澀谷區神宮前1-1-1",
      register: "儲存",
      hint: "註冊後可一鍵填入出發地和終點",
      privacy2: "🔒 僅儲存在瀏覽器（localStorage）中，不會上傳至伺服器或分享給第三方。",
      saved: "家庭住址已儲存",
    },
    day: { title: "第{n}天", dayTrip: "（當天來回）" },
    departure: {
      label: "出發地",
      required: "*必填",
      homeButton: "家",
      placeholder0: "例: 東京站、家庭住址...",
      placeholder1: "自動填入前一天的終點（可修改）",
      prevDayNote: "已自動填入前一天的終點（可修改）",
    },
    destination: {
      label: "目的地",
      required: "*至少填寫1個",
      searchPlaceholder: "輸入地點名稱搜尋",
      firstToggle: "先去這個地方",
      mealLabel: "用餐",
      mealNone: "不指定",
      mealLunch: "午餐",
      mealDinner: "晚餐",
      add: "新增目的地",
    },
    arrival: {
      label: "終點",
      required: "*必填",
      placeholder: "例: 家、飯店名稱...",
      timeHint: "期望到達終點的時間（未填寫則預設為 20:00）",
    },
    lunch: {
      toggle: "包含午餐",
      locationLabel: "用餐地點（選填，僅限1處）",
      locationPlaceholder: "例: 鎌倉站附近（僅限1處）",
      genreLabel: "餐飲類型（選填，僅限1種）",
      genrePlaceholder: "例: 海鮮（僅限1種）",
      atDestination: "將在目的地「{name}」用午餐（不會另外新增午餐地點）",
    },
    dinner: {
      toggle: "包含晚餐",
      locationLabel: "用餐地點（選填，僅限1處）",
      locationPlaceholder: "例: 箱根湯本附近（僅限1處）",
      genreLabel: "餐飲類型（選填，僅限1種）",
      genrePlaceholder: "例: 燒肉（僅限1種）",
      atDestination: "將在目的地「{name}」用晚餐（不會另外新增晚餐地點）",
    },
    errors: {
      departure: "請輸入出發地",
      arrival: "請輸入終點",
      dest0: "請至少輸入一個目的地",
      mealMultiple: "用餐地點只能輸入1處（請勿用逗號分隔）",
      genreMultiple: "餐飲類型只能輸入1種（請勿用逗號分隔）",
    },
    errorSummary: {
      title: "部分必填項目未填寫",
      desc: "請填寫所有必填項目：出發地、目的地、終點。",
    },
    submit: "生成旅行計畫",
    submitting: "計畫生成中...",
    disclaimer: {
      title: "⚠️ 免責聲明",
      items: [
        "· 本服務生成的旅行計畫由 AI 自動生成，實際所需時間、距離、道路狀況、營業時間、費用等可能有所不同。",
        "· 請事先自行確認推薦景點和餐廳的營業狀況及寵物是否允許入內。",
        "· 對於因使用本服務而產生的任何損失，運營方概不負責。",
        "· 請遵守交通規則和法律，安全駕駛。",
        "· 自用車管制警告僅針對已登錄的主要管制區域，並未涵蓋所有管制規定。是否管制及管制期間因年份和季節而異，請在出發前查閱官方資訊。",
      ],
    },
    terms: {
      title: "📋 使用注意事項",
      items: [
        "· 禁止未經授權複製、轉用或再發布本網站的原始碼、設計或內容。",
        "· 輸入的資訊（包括家庭住址）不會儲存在伺服器上。家庭住址僅儲存在瀏覽器（localStorage）中。",
      ],
    },
    copyright: "© {year} AI 自駕遊規劃師 All Rights Reserved.",
    search: {
      noResults: "地圖搜尋未找到候選地點",
      noResultsHint: "您可以直接輸入，AI 將在生成計畫時識別地點",
      searchError: "地圖搜尋暫時無法使用",
    },
  },
};

const es: TripPlannerDict = {
  header: {
    title: "AI Drive Planner",
    subtitle: "Genera automáticamente itinerarios de viaje en Japón con Google Maps",
    heritageLink: "🌍 Pasaporte Patrimonio Mundial",
    lifeMapLink: "🗺 Mapa de Experiencias",
    columnsLink: "📝 Columnas de viaje",
    editPlan: "Reeditar plan",
  },
  loading: {
    title: "Creando plan",
    message: "La IA está creando 2 planes de viaje...",
    messageRoute: "Obteniendo datos de ruta...",
  },
  error: {
    title: "Se ha producido un error",
    aiBusy: "La IA está recibiendo muchas solicitudes en este momento. Espera un poco y vuelve a intentarlo.",
    aiFailed:
      "La IA no pudo crear el plan correctamente. Vuelve a intentarlo. Reducir el número de destinos o de días aumenta las probabilidades de éxito.",
    aiUnavailable: "La creación de planes con IA no está disponible temporalmente. Vuelve a intentarlo más tarde.",
    badRequest: "No se pudo procesar la solicitud del plan con IA. Revisa los datos introducidos y vuelve a intentarlo.",
    aiBlocked: "La IA no pudo crear el plan por motivos de seguridad. Revisa los destinos y el perfil y vuelve a intentarlo.",
    aiEmptyResponse: "La IA no devolvió ninguna respuesta. Vuelve a intentarlo.",
    aiTruncated: "La respuesta de la IA se cortó a mitad. Reduce el número de destinos o de días y vuelve a intentarlo.",
    aiBadFinish: "La IA interrumpió la creación del plan a mitad. Vuelve a intentarlo.",
    aiInvalidJson:
      "No se pudo leer la respuesta de la IA como un plan. Vuelve a intentarlo. Reducir el número de destinos o de días aumenta las probabilidades de éxito.",
    network: "No se pudo conectar con el servidor. Comprueba tu conexión y vuelve a intentarlo.",
  },
  printModal: {
    title: "Seleccionar plan a exportar",
    planA: "Plan A",
    planB: "Plan B",
    both: "Ambos planes",
    print: "Imprimir",
    copy: "Copiar",
    cancel: "Cancelar",
  },
  planCompare: {
    hint: "▼ Puedes comparar 2 planes ▼",
    sameName: "Plan recomendado",
    sameNote: "Con estas condiciones, tus destinos ocupan todo el itinerario y las dos opciones resultaron iguales. Se muestran como un solo plan.",
    sameTipOn: "Con menos destinos por día o más tiempo entre la salida y la llegada, la IA puede añadir paradas y es posible que salgan dos opciones distintas.",
    sameTipOff: "Si activas «{omakase}» y eliges menos destinos por día o dejas más tiempo entre la salida y la llegada, es posible que salgan dos opciones distintas.",
  },
  buttons: { print: "Imprimir", copy: "Copiar texto", copied: "¡Copiado!" },
  itinerary: {
    day: "Día {n}",
    empty: {
      title: "Introduce tu plan de viaje",
      desc: "Rellena el formulario de la izquierda con salida, destino y llegada, y pulsa Crear",
    },
    badge: { lunch: "Almuerzo", dinner: "Cena" },
    travel: { highway: " (Autopista)", road: " (Carretera local)" },
    dogwalk: "Parada para pasear al perro (~15 min)",
    mealstop: "Restaurante recomendado: ",
    stay: "Estancia {min} min",
    mealHint: "Usa «Ver en Google Maps» para buscar restaurantes cercanos.",
    mealHintDog: "Usa «Ver en Google Maps» para buscar restaurantes. Con mascota, también puedes usar «Buscar con mascotas».",
    closing17: {
      bold: "Posible cierre.",
      text: "Templos, museos y castillos suelen cerrar alrededor de las 17:00. Confirma el horario con antelación.",
    },
    closing16: {
      bold: "Atención al horario de cierre.",
      text: "Templos y museos pueden cerrar entre las 16:00 y las 17:00. Confirma el horario con antelación.",
    },
    googleMap: "Ver en Google Maps",
    petSearch: "Buscar con mascotas",
    businessHours: "Confirma el horario de apertura con antelación",
    commentary: { title: "Comentario del planificador IA" },
    removed: {
      title: "Destinos indicados que no se incluyeron en este plan",
      aiJudgment: "Criterio de la IA",
      unexplained: "Omitido por la IA sin indicar el motivo",
      hint: "Cambiar las condiciones y volver a crear el plan puede ayudar (los nombres de los lugares se reconocen mejor que las direcciones).",
    },
    schedule: {
      over: "Este día se prevé superar la hora de llegada deseada ({desired}) en unos {min} min (llegada estimada {arrival})",
      overOvernight: "Este día se prevé superar la hora de llegada deseada ({desired}) en unos {min} min y pasar la medianoche (llegada estimada {arrival})",
      nextDay: "{time} del día siguiente",
      laterDays: "{time}, {n} días después",
      basisAi: "Calculado con los horarios de la IA",
      basisRoute: "Calculado con los tiempos de la ruta del mapa (sin tráfico)",
    },
    carRestriction: {
      yearRound: "{place} es una zona con acceso restringido a vehículos particulares. No se puede entrar en coche particular; se puede llegar en autobús de línea, autobús lanzadera, etc.",
      seasonal: "{place} tiene restricciones a vehículos particulares en ciertas épocas. Consulta la información oficial sobre las restricciones del día de tu visita.",
      place: "{area} ({spots})",
      separator: ", ",
      note: "* Solo se comprueban las principales zonas restringidas registradas.",
      badge: "🚫 Zona restringida a coches particulares",
    },
    highlights: { title: "Puntos destacados del plan" },
    tips: { title: "Consejos" },
    dogTips: { title: "Consejos para viajar con perro" },
    youtube: {
      title: "Vista previa del plan en YouTube",
      desc: "Consulta vídeos relacionados en YouTube para hacerte una idea del ambiente.",
      linkText: "Ver \"{query}\" en YouTube",
    },
    meal: { lunch: "Almuerzo", dinner: "Cena" },
  },
  form: {
    appTitle: "AI Drive Planner",
    appDescription:
      "Introduce tu punto de salida, destino y llegada, y la IA crea automáticamente el plan de viaje en coche ideal por Japón. Se conecta a Google Maps para mostrar rutas reales, distancias y tiempos. La IA planifica previsiones de tráfico, eventos de temporada, restaurantes y aparcamientos. Admite viajes con perro y distintos estilos de viaje.",
    tags: ["Plan IA automático", "Previsión tráfico", "Comparar 2 planes", "Google Maps", "Con perro", "Gratis"],
    xFollow: "Seguir @AIDRIVEPLAN en X",
    tripDuration: {
      title: "Duración del viaje",
      options: ["Solo ida y vuelta", "1 noche 2 días", "2 noches 3 días", "3 noches 4 días", "4 noches 5 días"],
    },
    departureDate: {
      label: "Fecha de salida",
      optional: "(opcional)",
      hint: "Si indicas la fecha, la IA considerará el tráfico en festivos y eventos",
    },
    omakase: {
      label: "Dejar el resto al criterio de la IA",
      description: "La IA planificará las paradas entre tu salida y llegada según tiempo y distancia.",
    },
    dog: { label: "Viajar con perro", description: "Incluye paradas para pasear y restaurantes pet-friendly" },
    highway: {
      label: "Usar autopistas",
      on: "La ruta utilizará autopistas",
      off: "La ruta utilizará solo carreteras locales",
    },
    traveler: {
      title: "Información del viajero",
      optional: "(opcional · se refleja en las sugerencias de la IA)",
      partyType: {
        label: "Estilo de viaje",
        options: ["Sin seleccionar", "Solo", "Pareja / Matrimonio", "Familia", "Amigos / Grupo", "Viaje senior"],
      },
      ageRange: {
        label: "Grupo de edad",
        options: ["Sin seleccionar", "20s", "30s", "40s", "50s", "60s", "70+"],
      },
      hobbies: {
        label: "Aficiones / Intereses",
        placeholder: "Ej.: aguas termales, pesca, fotografía, gastronomía, templos",
        hint: "Introduce varios intereses separados por espacios. La IA los reflejará en las paradas sugeridas.",
      },
      children: {
        label: "Viajando con niños",
        agePlaceholder: "Ej.: 3 años, 7 años",
        ageHint: "La IA sugerirá lugares adecuados para la edad de los niños",
      },
    },
    homeAddress: {
      title: "Registrar domicilio",
      edit: "Editar",
      delete: "Eliminar",
      privacySaved: "🔒 Tu dirección se almacena solo en tu navegador y nunca se envía externamente.",
      placeholder: "Ej.: 1-1-1 Jingumae, Shibuya, Tokio",
      register: "Guardar",
      hint: "Una vez registrado, rellena los campos de salida/llegada con un toque",
      privacy2: "🔒 Almacenado solo en localStorage. No se sube a ningún servidor ni se comparte.",
      saved: "Domicilio guardado",
    },
    day: { title: "Día {n}", dayTrip: " (Solo ida y vuelta)" },
    departure: {
      label: "Salida",
      required: "* Obligatorio",
      homeButton: "Casa",
      placeholder0: "Ej.: Estación de Tokio, dirección de casa...",
      placeholder1: "Autocompletado desde la llegada del día anterior (editable)",
      prevDayNote: "Completado desde la llegada del día anterior (editable)",
    },
    destination: {
      label: "Destino",
      required: "* Al menos 1 obligatorio",
      searchPlaceholder: "Buscar nombre de lugar",
      firstToggle: "Ir aquí primero",
      mealLabel: "Comida",
      mealNone: "Sin asignar",
      mealLunch: "Almuerzo",
      mealDinner: "Cena",
      add: "Añadir destino",
    },
    arrival: {
      label: "Llegada",
      required: "* Obligatorio",
      placeholder: "Ej.: casa, nombre del hotel...",
      timeHint: "Hora de llegada deseada (por defecto 20:00 si se deja en blanco)",
    },
    lunch: {
      toggle: "Incluir almuerzo",
      locationLabel: "Zona de almuerzo (opcional, solo 1 lugar)",
      locationPlaceholder: "Ej.: cerca de la estación de Kamakura (1 lugar)",
      genreLabel: "Tipo de cocina (opcional, solo 1 tipo)",
      genrePlaceholder: "Ej.: mariscos (1 tipo)",
      atDestination: "El almuerzo será en «{name}» (no se añadirá otra parada para almorzar)",
    },
    dinner: {
      toggle: "Incluir cena",
      locationLabel: "Zona de cena (opcional, solo 1 lugar)",
      locationPlaceholder: "Ej.: cerca de Hakone-Yumoto (1 lugar)",
      genreLabel: "Tipo de cocina (opcional, solo 1 tipo)",
      genrePlaceholder: "Ej.: yakiniku (1 tipo)",
      atDestination: "La cena será en «{name}» (no se añadirá otra parada para cenar)",
    },
    errors: {
      departure: "Por favor, introduce un punto de salida",
      arrival: "Por favor, introduce un punto de llegada",
      dest0: "Por favor, introduce al menos un destino",
      mealMultiple: "Introduce solo un lugar (no uses comas para separar)",
      genreMultiple: "Introduce solo un tipo de cocina (no uses comas para separar)",
    },
    errorSummary: {
      title: "Faltan campos obligatorios",
      desc: "Por favor, rellena todos los campos obligatorios: salida, destino y llegada.",
    },
    submit: "Crear plan de viaje",
    submitting: "Creando plan...",
    disclaimer: {
      title: "⚠️ Aviso legal",
      items: [
        "· Los planes generados por este servicio son creados por IA y pueden diferir de los tiempos, distancias, condiciones viales, horarios o tarifas reales.",
        "· Verifica de antemano el estado de los lugares y restaurantes sugeridos, así como si se admiten mascotas.",
        "· El operador no acepta ninguna responsabilidad por daños derivados del uso de este servicio.",
        "· Respeta las normas de tráfico y conduce con seguridad.",
        "· Las advertencias de restricción de vehículos particulares solo abarcan las principales zonas restringidas que tenemos registradas y no incluyen todas las restricciones. La existencia y el periodo de las restricciones varían según el año y la temporada, así que consulta la información oficial antes de tu visita.",
      ],
    },
    terms: {
      title: "📋 Condiciones de uso",
      items: [
        "· Está prohibida la reproducción, reutilización o redistribución no autorizada del código fuente, diseño o contenido de este sitio.",
        "· La información introducida (incluida la dirección de casa) no se almacena en ningún servidor. La dirección de casa se guarda solo en el navegador (localStorage).",
      ],
    },
    copyright: "© {year} AI Drive Planner All Rights Reserved.",
    search: {
      noResults: "No se encontraron resultados en la búsqueda de mapas",
      noResultsHint: "Puedes seguir escribiendo — la IA identificará el lugar al crear tu plan",
      searchError: "La búsqueda en el mapa no está disponible temporalmente",
    },
  },
};

const ru: TripPlannerDict = {
  header: {
    title: "AI Планировщик поездок",
    subtitle: "Автогенерация маршрутов по Японии с отображением на Google Картах",
    heritageLink: "🌍 Паспорт объектов ЮНЕСКО",
    lifeMapLink: "🗺 Карта жизни",
    columnsLink: "📝 Статьи о поездках",
    editPlan: "Редактировать план",
  },
  loading: {
    title: "Создание плана",
    message: "ИИ создаёт 2 варианта маршрута...",
    messageRoute: "Получение данных маршрута...",
  },
  error: {
    title: "Произошла ошибка",
    aiBusy: "Сейчас к ИИ поступает слишком много запросов. Подождите немного и попробуйте снова.",
    aiFailed:
      "ИИ не удалось правильно составить план. Попробуйте ещё раз. Если уменьшить количество мест или дней, вероятность успеха выше.",
    aiUnavailable: "Создание плана с помощью ИИ временно недоступно. Попробуйте позже.",
    badRequest: "Не удалось обработать запрос на создание плана. Проверьте введённые данные и попробуйте снова.",
    aiBlocked: "ИИ не смог составить план по соображениям безопасности. Проверьте места назначения и данные профиля и попробуйте снова.",
    aiEmptyResponse: "ИИ не вернул ответ. Попробуйте ещё раз.",
    aiTruncated: "Ответ ИИ оборвался на середине. Уменьшите количество мест или дней и попробуйте снова.",
    aiBadFinish: "ИИ прервал составление плана на середине. Попробуйте ещё раз.",
    aiInvalidJson:
      "Не удалось прочитать ответ ИИ как план. Попробуйте ещё раз. Если уменьшить количество мест или дней, вероятность успеха выше.",
    network: "Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.",
  },
  printModal: {
    title: "Выберите план для экспорта",
    planA: "План А",
    planB: "План Б",
    both: "Оба плана",
    print: "Печать",
    copy: "Копировать",
    cancel: "Отмена",
  },
  planCompare: {
    hint: "▼ Сравните 2 варианта маршрута ▼",
    sameName: "Рекомендуемый маршрут",
    sameNote: "При этих условиях маршрут полностью определяется выбранными местами, поэтому оба варианта совпали. Они показаны как один маршрут.",
    sameTipOn: "Если уменьшить число мест в день или оставить больше времени между отправлением и прибытием, ИИ сможет добавить остановки, и варианты могут получиться разными.",
    sameTipOff: "Если включить «{omakase}» и затем уменьшить число мест в день или оставить больше времени между отправлением и прибытием, варианты могут получиться разными.",
  },
  buttons: { print: "Печать", copy: "Копировать текст", copied: "Скопировано!" },
  itinerary: {
    day: "День {n}",
    empty: {
      title: "Введите данные о поездке",
      desc: "Заполните форму слева, укажите отправление, назначение и прибытие, затем нажмите «Создать»",
    },
    badge: { lunch: "Обед", dinner: "Ужин" },
    travel: { highway: " (Автострада)", road: " (Обычная дорога)" },
    dogwalk: "Прогулка с собакой (~15 мин)",
    mealstop: "Рекомендуемый ресторан: ",
    stay: "Остановка {min} мин",
    mealHint: "Используйте «Посмотреть на Google Картах» для поиска ресторанов рядом.",
    mealHintDog: "Используйте «Посмотреть на Google Картах» для поиска ресторанов. Путешественники с питомцами также могут использовать «Найти pet-friendly».",
    closing17: {
      bold: "Возможно закрыто.",
      text: "Храмы, музеи и замки часто закрываются около 17:00. Заранее уточните часы работы.",
    },
    closing16: {
      bold: "Внимание: время закрытия.",
      text: "Храмы и музеи могут закрываться в 16:00–17:00. Заранее уточните часы работы.",
    },
    googleMap: "Посмотреть на Google Картах",
    petSearch: "Найти pet-friendly",
    businessHours: "Заранее уточните часы работы",
    commentary: { title: "Комментарий AI-планировщика" },
    removed: {
      title: "Указанные места, не вошедшие в этот план",
      aiJudgment: "Решение ИИ",
      unexplained: "ИИ пропустил без объяснения причины",
      hint: "Попробуйте изменить условия и создать план заново (названия мест распознаются лучше, чем адреса).",
    },
    schedule: {
      over: "В этот день ожидается превышение желаемого времени прибытия ({desired}) примерно на {min} мин (ожидаемое прибытие {arrival})",
      overOvernight: "В этот день ожидается превышение желаемого времени прибытия ({desired}) примерно на {min} мин с переходом за полночь (ожидаемое прибытие {arrival})",
      nextDay: "{time} следующего дня",
      laterDays: "{time} через {n} дн.",
      basisAi: "Расчёт по времени, указанному ИИ",
      basisRoute: "Расчёт по времени в пути по маршруту на карте (без учёта пробок)",
    },
    carRestriction: {
      yearRound: "{place} — зона ограничения въезда личных автомобилей. На личном автомобиле туда не проехать; добраться можно на рейсовом или шаттл-автобусе и т. п.",
      seasonal: "{place}: в определённые периоды действует ограничение въезда личных автомобилей. Проверьте официальную информацию об ограничениях на день поездки.",
      place: "{area} ({spots})",
      separator: ", ",
      note: "* Проверяются только основные зарегистрированные зоны ограничений.",
      badge: "🚫 Въезд личных авто ограничен",
    },
    highlights: { title: "Особенности маршрута" },
    tips: { title: "Советы" },
    dogTips: { title: "Советы для путешествий с собакой" },
    youtube: {
      title: "Предварительный просмотр на YouTube",
      desc: "Посмотрите связанные видео на YouTube, чтобы составить впечатление о местах.",
      linkText: "Смотреть «{query}» на YouTube",
    },
    meal: { lunch: "Обед", dinner: "Ужин" },
  },
  form: {
    appTitle: "AI Планировщик поездок",
    appDescription:
      "Просто укажите место отправления, назначение и прибытие — ИИ автоматически составит оптимальный маршрут по Японии на автомобиле. Интеграция с Google Картами для отображения реальных дорог, расстояний и времени в пути. ИИ учитывает пробки, сезонные события, рестораны и парковки. Поддержка путешествий с собакой и разных стилей отдыха.",
    tags: ["Авто-план ИИ", "Прогноз пробок", "2 варианта", "Google Maps", "С собакой", "Бесплатно"],
    xFollow: "Подписаться на @AIDRIVEPLAN в X",
    tripDuration: {
      title: "Продолжительность поездки",
      options: ["Однодневная", "1 ночь / 2 дня", "2 ночи / 3 дня", "3 ночи / 4 дня", "4 ночи / 5 дней"],
    },
    departureDate: {
      label: "Дата отправления",
      optional: "(необязательно)",
      hint: "Если указать дату, ИИ учтёт праздничные пробки и события",
    },
    omakase: {
      label: "Остальное оставить ИИ",
      description: "ИИ спланирует остановки между отправлением и прибытием с учётом времени и расстояния.",
    },
    dog: { label: "Путешествие с собакой", description: "Учитывает остановки для прогулок и рестораны для питомцев" },
    highway: {
      label: "Использовать автострады",
      on: "Маршрут будет проложен по автострадам",
      off: "Маршрут будет проложен только по обычным дорогам",
    },
    traveler: {
      title: "Информация о путешественниках",
      optional: "(необязательно · отражается в рекомендациях ИИ)",
      partyType: {
        label: "Тип поездки",
        options: ["Не выбрано", "Соло", "Пара / Супруги", "Семья", "Друзья / Группа", "Для пожилых"],
      },
      ageRange: {
        label: "Возраст",
        options: ["Не выбрано", "20-е", "30-е", "40-е", "50-е", "60-е", "70+"],
      },
      hobbies: {
        label: "Хобби / Интересы",
        placeholder: "Напр.: онсэн, рыбалка, фото, гурман, храмы",
        hint: "Вводите через пробел. ИИ учтёт ваши интересы при выборе остановок.",
      },
      children: {
        label: "Путешествие с детьми",
        agePlaceholder: "Напр.: 3 года, 7 лет",
        ageHint: "ИИ предложит места, подходящие для возраста детей",
      },
    },
    homeAddress: {
      title: "Зарегистрировать домашний адрес",
      edit: "Изменить",
      delete: "Удалить",
      privacySaved: "🔒 Адрес хранится только в вашем браузере и никуда не отправляется.",
      placeholder: "Напр.: 1-1-1 Дзингумаэ, Сибуя, Токио",
      register: "Сохранить",
      hint: "После регистрации заполняйте поля отправления/прибытия одним нажатием",
      privacy2: "🔒 Хранится только в localStorage браузера. Не отправляется на серверы и не передаётся третьим лицам.",
      saved: "Домашний адрес сохранён",
    },
    day: { title: "День {n}", dayTrip: " (Однодневная)" },
    departure: {
      label: "Отправление",
      required: "* Обязательно",
      homeButton: "Дом",
      placeholder0: "Напр.: Токийский вокзал, домашний адрес...",
      placeholder1: "Автозаполнение из места прибытия предыдущего дня (можно изменить)",
      prevDayNote: "Заполнено из прибытия предыдущего дня (можно изменить)",
    },
    destination: {
      label: "Назначение",
      required: "* Минимум 1 обязательно",
      searchPlaceholder: "Введите название места для поиска",
      firstToggle: "Ехать сюда первым",
      mealLabel: "Приём пищи",
      mealNone: "Не указано",
      mealLunch: "Обед",
      mealDinner: "Ужин",
      add: "Добавить место",
    },
    arrival: {
      label: "Прибытие",
      required: "* Обязательно",
      placeholder: "Напр.: дом, название отеля...",
      timeHint: "Желаемое время прибытия (по умолчанию 20:00, если не указано)",
    },
    lunch: {
      toggle: "Включить обед",
      locationLabel: "Район обеда (необязательно, 1 место)",
      locationPlaceholder: "Напр.: рядом со ст. Камакура (1 место)",
      genreLabel: "Тип кухни (необязательно, 1 тип)",
      genrePlaceholder: "Напр.: морепродукты (1 тип)",
      atDestination: "Обед будет в «{name}» (отдельная остановка на обед не добавляется)",
    },
    dinner: {
      toggle: "Включить ужин",
      locationLabel: "Район ужина (необязательно, 1 место)",
      locationPlaceholder: "Напр.: рядом с Хаконэ-Юмото (1 место)",
      genreLabel: "Тип кухни (необязательно, 1 тип)",
      genrePlaceholder: "Напр.: якинику (1 тип)",
      atDestination: "Ужин будет в «{name}» (отдельная остановка на ужин не добавляется)",
    },
    errors: {
      departure: "Пожалуйста, введите место отправления",
      arrival: "Пожалуйста, введите место прибытия",
      dest0: "Пожалуйста, введите хотя бы одно место назначения",
      mealMultiple: "Введите только одно место (не используйте запятые для разделения)",
      genreMultiple: "Введите только один тип кухни (не используйте запятые для разделения)",
    },
    errorSummary: {
      title: "Некоторые обязательные поля не заполнены",
      desc: "Пожалуйста, заполните все обязательные поля: отправление, назначение и прибытие.",
    },
    submit: "Создать маршрут",
    submitting: "Создание плана...",
    disclaimer: {
      title: "⚠️ Отказ от ответственности",
      items: [
        "· Планы, созданные этим сервисом, генерируются ИИ и могут отличаться от реального времени в пути, расстояний, дорожных условий, часов работы и тарифов.",
        "· Заранее самостоятельно проверьте статус рекомендованных мест и ресторанов, а также допускаются ли домашние животные.",
        "· Оператор не несёт никакой ответственности за ущерб, возникший в результате использования данного сервиса.",
        "· Соблюдайте правила дорожного движения и езжайте осторожно.",
        "· Предупреждения об ограничении въезда личных автомобилей охватывают только основные зарегистрированные зоны и не включают все ограничения. Наличие и сроки ограничений зависят от года и сезона, поэтому перед поездкой проверьте официальную информацию.",
      ],
    },
    terms: {
      title: "📋 Условия использования",
      items: [
        "· Запрещается несанкционированное воспроизведение, повторное использование или распространение исходного кода, дизайна или контента этого сайта.",
        "· Введённая информация (включая домашний адрес) не хранится на серверах. Домашний адрес хранится только в браузере (localStorage).",
      ],
    },
    copyright: "© {year} AI Drive Planner All Rights Reserved.",
    search: {
      noResults: "В поиске на карте не найдено результатов",
      noResultsHint: "Можно продолжить вводить — ИИ определит место при создании плана",
      searchError: "Поиск на карте временно недоступен",
    },
  },
};

export const tripTranslations: Record<TripLangCode, TripPlannerDict> = {
  ja,
  en,
  ko,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  es,
  ru,
};
