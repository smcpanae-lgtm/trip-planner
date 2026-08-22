const translations = {
  ja: {
    eyebrow: "Private travel tracker",
    appTitle: "世界遺産パスポート",
    profileNameLabel: "ユーザー登録名",
    profileNamePlaceholder: "例: N.K. / 旅人A",
    profileNameNote: "ブラウザ内に保存され、バックアップにも含まれます。",
    export: "バックアップ",
    exportRecords: "写真なしバックアップ",
    import: "復元",
    backupPhotoCaution: "同じブラウザで再訪問した場合、写真と記録は残ります。PC交換や別ブラウザで使う場合はバックアップから復元してください。写真なしバックアップにはアップロード写真は含まれません。",
    backupMergeNote: "復元は現在の記録にバックアップの記録をマージします。スマホとPCなど複数の端末で記録した場合も、それぞれのバックアップを読み込むことで、両方の記録をまとめることができます。写真なしバックアップにはアップロード写真は含まれません。元写真はご自身でも保管してください。",
    dataStorageTitle: "💾 データの保存について",
    dataStorageLocal: "登録した訪問記録・訪問日・メモ・写真などのデータは、お使いの端末のブラウザ内にのみ保存されます。当サイトのサーバーへの送信や、クラウドへの自動バックアップは行われません。",
    dataStorageLoss: "ブラウザの「サイトデータの削除」、端末の初期化・機種変更、ブラウザの変更などにより、保存したデータが失われる場合があります。",
    dataStorageBackup: "データの消失・破損について、当サービスでは責任を負いかねます。大切な記録は、定期的に「バックアップ」ボタンからファイルへ保存してください。写真を含めて保存する場合は「バックアップ」、記録だけを保存する場合は「写真なしバックアップ」をご利用ください。",
    heroTitle: "行った世界遺産を、写真つきのスタンプとして残す。",
    heroBody: "記録はこのブラウザ内だけに保存されます。このサイトが写真や訪問情報を外部サーバーへ送信することはありません。写真は他人に公開されることはありません。",
    travelJournalBannerKicker: "AI旅行記メーカー",
    travelJournalBannerTitle: "保存した世界遺産の写真記録から、SNS投稿文・アイキャッチ画像を作る",
    travelJournalBannerBody: "訪問日・写真・メモを読み込み、旅行後の思い出整理に使えます。",
    travelJournalBannerAction: "AI旅行記へ",
    completed: "制覇",
    remaining: "残り",
    ageLabel: "現在の年齢",
    ageSuffix: "歳",
    progress: "達成率",
    worldProgress: "世界の達成状況",
    privacyNote: "写真は端末内に保存",
    passport: "パスポート",
    search: "英語名・国名で検索（日本の世界遺産は日本語も可）",
    searchHelpCountries: "検索は英語名・国名のアルファベット入力に対応しています。日本の世界遺産は日本語名でも検索できます。国から探すでは、検索中だけ国をまたいだ検索結果を表示します。地域を開いて国を選ぶと、その国の世界遺産だけを表示します。",
    searchHelpHeritage: "検索は英語名・国名のアルファベット入力に対応しています。日本の世界遺産は日本語名でも検索できます。全件一覧では、1,273件（2026年8月時点）の一覧を検索します。",
    searchHelpVisited: "訪問済みでは、訪問済みにした世界遺産だけを検索します。",
    list: "世界遺産一覧",
    listSelectedCountry: "{country}の世界遺産",
    listSearchResults: "検索結果",
    listVisited: "訪問済みの世界遺産",
    viewCountries: "国から探す",
    viewHeritage: "全件一覧",
    viewVisited: "訪問済み",
    countryIndex: "国別インデックス",
    countrySummary: "{count}カ国を表示。地域を開いて国を選ぶと、その国の世界遺産だけを表示します。",
    selectedCountrySummary: "{country}の世界遺産 {count}件",
    searchResultCount: "「{query}」の検索結果 {count}件",
    clearCountry: "国の選択を解除",
    sitesLabel: "{count}件",
    visitedLabel: "訪問済み{count}",
    remainingLabel: "残り{count}",
    pageStatus: "{start}-{end} / {total}件",
    prevPage: "前へ",
    nextPage: "次へ",
    notVisited: "未訪問",
    noResults: "該当する世界遺産はありません",
    dataUpdate: "リスト更新",
    dataUpdateBody: "世界遺産リストは公式データをもとにした構造化データから読み込みます。表示項目は名称、国、地域、種別、登録年などの事実情報に絞っています。",
    resetSample: "サンプル20件に戻す",
    unofficialNotice: "このサイトはUNESCO/WHCの公式サイトではありません。世界遺産の詳細情報は各公式ページを参照してください。",
    localNotice: "訪問記録と写真はこのブラウザ内に保存されます。同じ端末・同じブラウザで再訪問した場合は保存済みの内容を引き続き利用できます。バックアップはPC交換や別ブラウザへ移すために、利用者の端末へJSONファイルを書き出す機能です。このサイト運営者がバックアップ内容を閲覧・取得することはありません。",
    memorialNotice: "地域内の世界遺産をすべて訪問済みにした時と、全世界遺産を制覇した時に、ブラウザ内の記録をもとにメモリアル演出を表示します。",
    rightsNotice: "世界遺産の名称・国・登録年などの事実情報を扱い、UNESCO/WHC公式の説明文・写真・ロゴは使用していません。サイト内の代表画像は独自生成のイメージ画像です。国旗アイコンはflag-icons（MIT License）を利用しています。",
    accuracyNotice: "掲載情報は公開データをもとにしていますが、最新性・完全性を保証するものではありません。旅行計画や公式確認には各公式ページを参照してください。",
    copyrightNotice: "本サイト独自のソースコード、UIデザイン、文章、生成画像等の無断複製・転載・転用・再配布を禁止します。ただし、法令上認められる利用および各素材のライセンスで許諾される利用を除きます。",
    privacyPolicy: "プライバシーポリシー",
    cookiePolicy: "Cookieについて",
    aboutPage: "サイトについて・使い方",
    faqPage: "よくある質問",
    cookieBanner: "現在、このサイトは広告・解析Cookieを使用していません。訪問記録の保存にブラウザ内ストレージを使用します。",
    acceptEssential: "了解",
    jsonFormat: "対応JSON形式を見る",
    allRegions: "すべての地域",
    allCategories: "すべての種別",
    allStatuses: "すべて",
    visitedOnly: "訪問済み",
    unvisitedOnly: "未訪問",
    cultural: "文化",
    natural: "自然",
    mixed: "複合",
    africa: "アフリカ",
    arab: "アラブ諸国",
    asia: "アジア・太平洋",
    europe: "ヨーロッパ・北米",
    latin: "ラテンアメリカ・カリブ",
    unknown: "その他",
    markVisited: "訪問済みにする",
    markUnvisited: "未訪問に戻す",
    details: "記録",
    official: "公式ページ",
    detailPage: "詳細ページ",
    uploadPhoto: "写真を追加",
    photoUploadNote: "写真は1つの世界遺産につき1枚だけ保存できます。新しい写真を追加すると、前の写真は置き換わります。",
    removePhoto: "写真を削除",
    createTravelJournal: "SNS投稿",
    createTravelJournalNote: "この世界遺産の訪問日・メモ・写真をAI旅行記メーカーに読み込みます。写真そのものはAIに送信しません。",
    createTravelJournalDisabled: "写真を保存するとSNS投稿を作れます。",
    createTravelJournalUnsavedPhoto: "写真はまだ保存されていません。保存ボタンを押すとSNS投稿を作れます。",
    visitDate: "訪問日",
    today: "今日",
    dateYear: "年",
    dateMonth: "月",
    dateDay: "日",
    stampType: "スタンプタイプ",
    stampClassic: "クラシック",
    stampSeal: "金印",
    stampPostmark: "消印",
    stampTicket: "チケット",
    stampBadge: "バッジ",
    homeCity: "居住地",
    travelDistance: "累積移動距離",
    travelDistanceBody: "{city}から訪問済み世界遺産までの往復直線距離の合計",
    travelDistanceKm: "{km} km",
    earthLaps: "地球約{laps}周分",
    distanceNoData: "座標がある訪問済み世界遺産で計算します",
    memo: "メモ",
    save: "保存",
    noPhoto: "写真なし",
    stampsEmpty: "訪問済みにすると最新スタンプがここに表示されます",
    stampPreviewSummary: "最新{shown}件 / 訪問済み{visited}件",
    viewAllStamps: "すべてのスタンプを見る",
    sampleBadge: "サンプル表示",
    sampleCreateOwn: "自分のパスポートを作る",
    memorialButton: "完全制覇メモリアルを見る",
    achievementShareX: "Xでシェア",
    achievementShareImage: "実績画像を保存",
    achievementShareText: "世界遺産パスポートで {visited}/{total} 制覇しました🏛️",
    memorialEyebrow: "Complete journey",
    memorialTitle: "世界遺産パスポート 完全制覇",
    memorialIntro: "訪問写真と記録を、日付順にすべて振り返ります。",
    memorialTimelineLabel: "旅の記憶",
    completeCardTitle: "完全制覇達成",
    completeCardSubtitle: "{visited}/{total} stamps",
    completeCardDate: "達成日 {date}",
    completeCardPrivate: "この記念カードは、このブラウザ内の記録から表示しています。",
    memorialClose: "閉じる",
    regionMemorialButton: "地域メモリアル",
    regionMemorialEyebrow: "Region complete",
    regionMemorialTitle: "{region} 制覇",
    regionMemorialIntro: "{region}で訪れた世界遺産を、年代順に振り返ります。",
    regionCompleteCardTitle: "{region} 制覇達成",
    regionCompleteCardPrivate: "この地域メモリアルは、このブラウザ内の記録から表示しています。",
    visitDateUnknown: "記録日未設定",
    showImageSamples: "画像ありの世界遺産を見る",
    imageReady: "代表画像",
    listCount: "{count}件を表示",
    sampleDataStatus: "世界遺産リストを準備しています",
    importedDataStatus: "取り込み済み{total}件",
    remoteDataStatus: "UNESCO DataHubから{total}件を読み込み済み",
    dataLoadingStatus: "UNESCO DataHubから世界遺産リストを取得中",
    dataLoadErrorStatus: "データ取得に失敗したためサンプル{total}件を表示中",
    stampSummary: "{visited}/{total} stamps",
    exported: "バックアップを書き出しました。",
    exportedRecords: "写真なしバックアップを書き出しました。",
    imported: "バックアップを現在の記録にマージしました。",
    importError: "バックアップを読み込めませんでした。"
  },
  en: {
    eyebrow: "Private travel tracker",
    appTitle: "World Heritage Passport",
    profileNameLabel: "Profile name",
    profileNamePlaceholder: "e.g. N.K. / Traveler A",
    profileNameNote: "Stored in this browser and included in backups.",
    export: "Backup",
    exportRecords: "Backup without photos",
    import: "Restore",
    backupPhotoCaution: "When you revisit with the same browser, your photos and records remain available. Use a backup to move them to a new PC or another browser. Backups without photos do not include uploaded photos.",
    backupMergeNote: "Restore merges a backup into the records already in this browser. If you record visits on multiple devices, such as a phone and a PC, you can combine both sets of records by restoring each backup. Backups without photos do not include uploaded photos, so please also keep your originals.",
    dataStorageTitle: "💾 About data storage",
    dataStorageLocal: "Visit records, visit dates, notes, photos, and other data are stored only in the browser on your device. They are not sent to our server or backed up automatically to the cloud.",
    dataStorageLoss: "Saved data may be lost if you delete browser site data, initialize or replace your device, or switch browsers.",
    dataStorageBackup: "We cannot accept responsibility for lost or damaged data. Please regularly save important records to a file using Backup. Use Backup to include photos, or Backup without photos to save records only.",
    heroTitle: "Keep every World Heritage visit as a photo stamp.",
    heroBody: "Your records stay in this browser. This site does not send photos or visit data to an external server. Your photos are never made public to others.",
    travelJournalBannerKicker: "AI Travel Journal Maker",
    travelJournalBannerTitle: "Turn saved World Heritage photo records into SNS posts and blog images",
    travelJournalBannerBody: "Load visit dates, photos, and notes to organize memories after the trip.",
    travelJournalBannerAction: "Open journal maker",
    completed: "Visited",
    remaining: "Left",
    ageLabel: "Current age",
    ageSuffix: "yrs",
    progress: "Progress",
    worldProgress: "World progress",
    privacyNote: "Photos stay on device",
    passport: "Passport",
    search: "Search by English site/country name; Japanese works for Japan",
    searchHelpCountries: "Search supports English names using alphabet input. Japanese names also work for World Heritage sites in Japan. In By country, searching temporarily shows matching sites across countries. Open a region and choose a country to show only that country's sites.",
    searchHelpHeritage: "Search supports English names using alphabet input. Japanese names also work for World Heritage sites in Japan. In All sites, search the full list of 1,273 sites as of August 2026.",
    searchHelpVisited: "In Visited, search only the sites you have marked as visited.",
    list: "World Heritage List",
    listSelectedCountry: "{country} World Heritage sites",
    listSearchResults: "Search results",
    listVisited: "Visited World Heritage sites",
    viewCountries: "By country",
    viewHeritage: "All sites",
    viewVisited: "Visited",
    countryIndex: "Country index",
    countrySummary: "Showing {count} countries. Open a region and choose a country to see only its World Heritage sites.",
    selectedCountrySummary: "{count} sites in {country}",
    searchResultCount: "{count} results for \"{query}\"",
    clearCountry: "Clear country selection",
    sitesLabel: "{count} sites",
    visitedLabel: "Visited {count}",
    remainingLabel: "Left {count}",
    pageStatus: "{start}-{end} / {total}",
    prevPage: "Previous",
    nextPage: "Next",
    notVisited: "Not visited",
    noResults: "No matching World Heritage sites",
    dataUpdate: "List updates",
    dataUpdateBody: "The World Heritage list is loaded from structured data based on official sources. Displayed fields are limited to factual information such as name, country, region, category, and inscription year.",
    resetSample: "Restore 20 samples",
    unofficialNotice: "This is not an official UNESCO/WHC website. Please use each official page for detailed World Heritage information.",
    localNotice: "Visit records and photos are stored in this browser. If you revisit on the same device and browser, the saved content remains available. Backups are JSON files saved to your own device so you can restore records on a new PC or another browser; this site operator cannot view or retrieve their contents.",
    memorialNotice: "When you complete all sites in a region or complete the full World Heritage list, a memorial experience is shown from records stored in this browser.",
    rightsNotice: "This site uses factual information such as site names, countries, and inscription years. It does not use official UNESCO/WHC descriptions, photos, logos, or emblems. Featured images are independently generated illustrative images. Country flag icons use flag-icons under the MIT License.",
    accuracyNotice: "Information is based on public data, but accuracy, completeness, and freshness are not guaranteed. Please check official pages for travel planning or formal confirmation.",
    copyrightNotice: "Unauthorized copying, republication, reuse, redistribution, or adaptation of this site's original source code, UI design, text, generated images, and other original content is prohibited, except where permitted by law or by the applicable license for each material.",
    privacyPolicy: "Privacy Policy",
    cookiePolicy: "Cookie Policy",
    aboutPage: "About & How to Use",
    faqPage: "FAQ",
    cookieBanner: "This site does not currently use advertising or analytics cookies. It uses browser storage to save visit records.",
    acceptEssential: "OK",
    jsonFormat: "View JSON format",
    allRegions: "All regions",
    allCategories: "All categories",
    allStatuses: "All",
    visitedOnly: "Visited",
    unvisitedOnly: "Not visited",
    cultural: "Cultural",
    natural: "Natural",
    mixed: "Mixed",
    africa: "Africa",
    arab: "Arab States",
    asia: "Asia and the Pacific",
    europe: "Europe and North America",
    latin: "Latin America and Caribbean",
    unknown: "Other",
    markVisited: "Mark visited",
    markUnvisited: "Mark unvisited",
    details: "Record",
    official: "Official page",
    detailPage: "Details",
    uploadPhoto: "Add photo",
    photoUploadNote: "You can save one photo per World Heritage site. Adding a new photo replaces the previous one.",
    removePhoto: "Remove photo",
    createTravelJournal: "SNS post",
    createTravelJournalNote: "Load this visit date, memo, and photo into AI Travel Journal Maker. The photo itself is not sent to AI.",
    createTravelJournalDisabled: "Save a photo first to create an SNS post.",
    createTravelJournalUnsavedPhoto: "The photo has not been saved yet. Press Save to create an SNS post.",
    visitDate: "Visit date",
    today: "Today",
    dateYear: "Year",
    dateMonth: "Month",
    dateDay: "Day",
    stampType: "Stamp type",
    stampClassic: "Classic",
    stampSeal: "Gold seal",
    stampPostmark: "Postmark",
    stampTicket: "Ticket",
    stampBadge: "Badge",
    homeCity: "Home city",
    travelDistance: "Cumulative travel distance",
    travelDistanceBody: "Round-trip great-circle distance from {city} to visited World Heritage sites",
    travelDistanceKm: "{km} km",
    earthLaps: "About {laps} trips around Earth",
    distanceNoData: "Calculated for visited sites with coordinates",
    memo: "Memo",
    save: "Save",
    noPhoto: "No photo",
    stampsEmpty: "Visited sites will appear here as recent stamps",
    stampPreviewSummary: "Latest {shown} / {visited} visited",
    viewAllStamps: "View all stamps",
    sampleBadge: "Sample preview",
    sampleCreateOwn: "Create my own passport",
    memorialButton: "View completion memorial",
    achievementShareX: "Share on X",
    achievementShareImage: "Save achievement image",
    achievementShareText: "I've conquered {visited}/{total} World Heritage sites with World Heritage Passport 🏛️",
    memorialEyebrow: "Complete journey",
    memorialTitle: "World Heritage Passport complete",
    memorialIntro: "Replay every visit photo and record in chronological order.",
    memorialTimelineLabel: "Journey memories",
    completeCardTitle: "Completion achieved",
    completeCardSubtitle: "{visited}/{total} stamps",
    completeCardDate: "Completed on {date}",
    completeCardPrivate: "This certificate is shown from records stored in this browser.",
    memorialClose: "Close",
    regionMemorialButton: "Region memorial",
    regionMemorialEyebrow: "Region complete",
    regionMemorialTitle: "{region} complete",
    regionMemorialIntro: "Replay the World Heritage sites you visited in {region} in chronological order.",
    regionCompleteCardTitle: "{region} completed",
    regionCompleteCardPrivate: "This region memorial is shown from records stored in this browser.",
    visitDateUnknown: "Date not set",
    showImageSamples: "View sites with images",
    imageReady: "Featured image",
    listCount: "Showing {count}",
    sampleDataStatus: "Preparing the World Heritage list",
    importedDataStatus: "Imported data: {total}",
    remoteDataStatus: "Loaded {total} sites from UNESCO DataHub",
    dataLoadingStatus: "Loading the World Heritage list from UNESCO DataHub",
    dataLoadErrorStatus: "Showing {total} samples because loading failed",
    stampSummary: "{visited}/{total} stamps",
    exported: "Backup exported.",
    exportedRecords: "Backup without photos exported.",
    imported: "Backup merged into the current records.",
    importError: "Could not import backup."
  },
  "zh-CN": {
    eyebrow: "私人旅行记录",
    appTitle: "世界遗产护照",
    heroTitle: "用照片印章记录去过的世界遗产。",
    heroBody: "记录只保存在此浏览器中，不会上传照片或访问数据。",
    export: "备份",
    import: "恢复",
    completed: "已访问",
    remaining: "剩余",
    ageLabel: "当前年龄",
    ageSuffix: "岁",
    progress: "完成率",
    worldProgress: "世界完成情况",
    privacyNote: "照片保存在本机",
    passport: "护照",
    search: "按遗产或国家搜索",
    list: "世界遗产列表",
    dataUpdate: "列表更新",
    dataUpdateBody: "世界遗产列表会从基于官方来源的结构化数据读取。显示内容限于名称、国家、地区、类型、列入年份等事实信息。",
    jsonFormat: "查看JSON格式",
    allRegions: "所有地区",
    allCategories: "所有类型",
    allStatuses: "全部",
    visitedOnly: "已访问",
    unvisitedOnly: "未访问",
    cultural: "文化",
    natural: "自然",
    mixed: "混合",
    africa: "非洲",
    arab: "阿拉伯国家",
    asia: "亚洲和太平洋",
    europe: "欧洲和北美",
    latin: "拉丁美洲和加勒比",
    markVisited: "标记已访问",
    markUnvisited: "取消访问",
    details: "记录",
    official: "官方页面",
    detailPage: "详情页",
    uploadPhoto: "添加照片",
    removePhoto: "删除照片",
    visitDate: "访问日期",
    today: "今天",
    dateYear: "年",
    dateMonth: "月",
    dateDay: "日",
    memo: "备注",
    save: "保存",
    noPhoto: "无照片",
    stampsEmpty: "已访问的地点会在这里显示为最新印章",
    stampPreviewSummary: "最新{shown}个 / 已访问{visited}个",
    viewAllStamps: "查看全部印章",
    sampleBadge: "示例展示",
    sampleCreateOwn: "制作我自己的护照",
    memorialButton: "查看完全完成回忆",
    achievementShareX: "在X上分享",
    achievementShareImage: "保存成就图片",
    achievementShareText: "我在世界遗产护照中已征服 {visited}/{total} 处世界遗产🏛️",
    memorialEyebrow: "完整旅程",
    memorialTitle: "世界遗产护照 完全完成",
    memorialIntro: "按时间顺序回顾访问照片和记录。",
    memorialTimelineLabel: "旅程记忆",
    completeCardTitle: "完全完成达成",
    completeCardSubtitle: "{visited}/{total} 个印章",
    completeCardDate: "完成日期 {date}",
    completeCardPrivate: "这张纪念卡由此浏览器内保存的记录生成。",
    memorialClose: "关闭",
    visitDateUnknown: "未设置记录日期",
    listCount: "显示{count}项",
    stampSummary: "{visited}/{total} 个印章",
    exported: "已导出备份。",
    imported: "已恢复备份。",
    importError: "无法导入备份。"
  },
  "zh-TW": {
    eyebrow: "私人旅行紀錄",
    appTitle: "世界遺產護照",
    heroTitle: "用照片印章記錄去過的世界遺產。",
    heroBody: "記錄只保存在此瀏覽器中，不會上傳照片或造訪資料。",
    export: "備份",
    import: "還原",
    completed: "已造訪",
    remaining: "剩餘",
    ageLabel: "目前年齡",
    ageSuffix: "歲",
    progress: "完成率",
    worldProgress: "世界完成狀況",
    privacyNote: "照片保存在本機",
    passport: "護照",
    search: "依遺產或國家搜尋",
    list: "世界遺產列表",
    dataUpdate: "列表更新",
    dataUpdateBody: "世界遺產列表會從基於官方來源的結構化資料讀取。顯示內容限於名稱、國家、地區、類型、列入年份等事實資訊。",
    jsonFormat: "查看JSON格式",
    allRegions: "所有地區",
    allCategories: "所有類型",
    allStatuses: "全部",
    visitedOnly: "已造訪",
    unvisitedOnly: "未造訪",
    cultural: "文化",
    natural: "自然",
    mixed: "混合",
    africa: "非洲",
    arab: "阿拉伯國家",
    asia: "亞洲和太平洋",
    europe: "歐洲和北美",
    latin: "拉丁美洲和加勒比",
    markVisited: "標記已造訪",
    markUnvisited: "取消造訪",
    details: "記錄",
    official: "官方頁面",
    detailPage: "詳細頁",
    uploadPhoto: "新增照片",
    removePhoto: "刪除照片",
    visitDate: "造訪日期",
    today: "今天",
    dateYear: "年",
    dateMonth: "月",
    dateDay: "日",
    memo: "備註",
    save: "儲存",
    noPhoto: "無照片",
    stampsEmpty: "已造訪的地點會在這裡顯示為最新印章",
    stampPreviewSummary: "最新{shown}個 / 已造訪{visited}個",
    viewAllStamps: "查看全部印章",
    sampleBadge: "範例展示",
    sampleCreateOwn: "製作我自己的護照",
    memorialButton: "查看完全達成回憶",
    achievementShareX: "在X上分享",
    achievementShareImage: "保存成就圖片",
    achievementShareText: "我在世界遺產護照中已征服 {visited}/{total} 處世界遺產🏛️",
    memorialEyebrow: "完整旅程",
    memorialTitle: "世界遺產護照 完全達成",
    memorialIntro: "依時間順序回顧造訪照片與紀錄。",
    memorialTimelineLabel: "旅程記憶",
    completeCardTitle: "完全達成",
    completeCardSubtitle: "{visited}/{total} 個印章",
    completeCardDate: "達成日 {date}",
    completeCardPrivate: "這張紀念卡由此瀏覽器內保存的紀錄顯示。",
    memorialClose: "關閉",
    visitDateUnknown: "未設定紀錄日期",
    listCount: "顯示{count}項",
    stampSummary: "{visited}/{total} 個印章",
    exported: "已匯出備份。",
    imported: "已還原備份。",
    importError: "無法匯入備份。"
  },
  ko: {
    eyebrow: "개인 여행 기록",
    appTitle: "세계유산 패스포트",
    heroTitle: "방문한 세계유산을 사진 스탬프로 남기세요.",
    heroBody: "기록은 이 브라우저 안에만 저장되며 외부 서버로 전송되지 않습니다.",
    export: "백업",
    import: "복원",
    completed: "방문",
    remaining: "남음",
    ageLabel: "현재 나이",
    ageSuffix: "세",
    progress: "달성률",
    worldProgress: "세계 달성 현황",
    privacyNote: "사진은 기기에 저장",
    passport: "패스포트",
    search: "유산명 또는 국가 검색",
    list: "세계유산 목록",
    dataUpdate: "목록 업데이트",
    dataUpdateBody: "세계유산 목록은 공식 출처를 바탕으로 한 구조화 데이터에서 불러옵니다. 표시 항목은 이름, 국가, 지역, 유형, 등재 연도 같은 사실 정보로 제한합니다.",
    jsonFormat: "JSON 형식 보기",
    allRegions: "모든 지역",
    allCategories: "모든 유형",
    allStatuses: "전체",
    visitedOnly: "방문",
    unvisitedOnly: "미방문",
    cultural: "문화",
    natural: "자연",
    mixed: "복합",
    africa: "아프리카",
    arab: "아랍 국가",
    asia: "아시아 태평양",
    europe: "유럽 및 북미",
    latin: "라틴아메리카 및 카리브",
    markVisited: "방문 표시",
    markUnvisited: "미방문으로",
    details: "기록",
    official: "공식 페이지",
    detailPage: "상세 페이지",
    uploadPhoto: "사진 추가",
    removePhoto: "사진 삭제",
    visitDate: "방문일",
    today: "오늘",
    dateYear: "년",
    dateMonth: "월",
    dateDay: "일",
    memo: "메모",
    save: "저장",
    noPhoto: "사진 없음",
    stampsEmpty: "방문한 장소가 최신 스탬프로 여기에 표시됩니다",
    stampPreviewSummary: "최신 {shown}개 / 방문 {visited}개",
    viewAllStamps: "모든 스탬프 보기",
    sampleBadge: "샘플 보기",
    sampleCreateOwn: "내 여권 만들기",
    memorialButton: "완전 달성 메모리얼 보기",
    achievementShareX: "X에 공유",
    achievementShareImage: "달성 이미지 저장",
    achievementShareText: "세계유산 여권으로 {visited}/{total}곳을 정복했습니다🏛️",
    memorialEyebrow: "완전한 여정",
    memorialTitle: "세계유산 패스포트 완전 달성",
    memorialIntro: "방문 사진과 기록을 시간순으로 되돌아봅니다.",
    memorialTimelineLabel: "여행의 기억",
    completeCardTitle: "완전 달성",
    completeCardSubtitle: "{visited}/{total} 스탬프",
    completeCardDate: "달성일 {date}",
    completeCardPrivate: "이 기념 카드는 이 브라우저 안의 기록으로 표시됩니다.",
    memorialClose: "닫기",
    visitDateUnknown: "기록일 미설정",
    listCount: "{count}개 표시",
    stampSummary: "{visited}/{total} 스탬프",
    exported: "백업을 내보냈습니다.",
    imported: "백업을 복원했습니다.",
    importError: "백업을 가져올 수 없습니다."
  },
  es: {
    eyebrow: "Registro privado de viaje",
    appTitle: "Pasaporte del Patrimonio Mundial",
    heroTitle: "Guarda cada visita como un sello con foto.",
    heroBody: "Tus datos se guardan solo en este navegador y no se envían a servidores externos.",
    export: "Copia",
    import: "Restaurar",
    completed: "Visitados",
    remaining: "Faltan",
    ageLabel: "Edad actual",
    ageSuffix: "años",
    progress: "Progreso",
    worldProgress: "Progreso mundial",
    privacyNote: "Fotos guardadas en el dispositivo",
    passport: "Pasaporte",
    search: "Buscar por sitio o país",
    list: "Lista del Patrimonio Mundial",
    dataUpdate: "Actualizar lista",
    dataUpdateBody: "La lista del Patrimonio Mundial se carga desde datos estructurados basados en fuentes oficiales. Se muestran solo datos factuales como nombre, país, región, categoría y año de inscripción.",
    jsonFormat: "Ver formato JSON",
    allRegions: "Todas las regiones",
    allCategories: "Todas las categorías",
    allStatuses: "Todo",
    visitedOnly: "Visitados",
    unvisitedOnly: "No visitados",
    cultural: "Cultural",
    natural: "Natural",
    mixed: "Mixto",
    africa: "África",
    arab: "Estados árabes",
    asia: "Asia y Pacífico",
    europe: "Europa y Norteamérica",
    latin: "América Latina y Caribe",
    markVisited: "Marcar visitado",
    markUnvisited: "Desmarcar",
    details: "Registro",
    official: "Página oficial",
    detailPage: "Página de detalles",
    uploadPhoto: "Añadir foto",
    removePhoto: "Eliminar foto",
    visitDate: "Fecha de visita",
    today: "Hoy",
    dateYear: "Año",
    dateMonth: "Mes",
    dateDay: "Día",
    memo: "Nota",
    save: "Guardar",
    noPhoto: "Sin foto",
    stampsEmpty: "Los sitios visitados aparecerán aquí como sellos recientes",
    stampPreviewSummary: "Últimos {shown} / {visited} visitados",
    viewAllStamps: "Ver todos los sellos",
    sampleBadge: "Vista de ejemplo",
    sampleCreateOwn: "Crear mi propio pasaporte",
    memorialButton: "Ver memorial de finalización",
    achievementShareX: "Compartir en X",
    achievementShareImage: "Guardar imagen de logro",
    achievementShareText: "He conquistado {visited}/{total} sitios del Patrimonio Mundial con World Heritage Passport 🏛️",
    memorialEyebrow: "Viaje completo",
    memorialTitle: "Pasaporte del Patrimonio Mundial completado",
    memorialIntro: "Revive tus fotos y registros en orden cronológico.",
    memorialTimelineLabel: "Recuerdos del viaje",
    completeCardTitle: "Completado",
    completeCardSubtitle: "{visited}/{total} sellos",
    completeCardDate: "Completado el {date}",
    completeCardPrivate: "Esta tarjeta se muestra a partir de los registros guardados en este navegador.",
    memorialClose: "Cerrar",
    visitDateUnknown: "Fecha no registrada",
    listCount: "Mostrando {count}",
    stampSummary: "{visited}/{total} sellos",
    exported: "Copia exportada.",
    imported: "Copia restaurada.",
    importError: "No se pudo importar la copia."
  },
  fr: {
    eyebrow: "Carnet de voyage privé",
    appTitle: "Passeport du Patrimoine mondial",
    heroTitle: "Conservez chaque visite comme un tampon photo.",
    heroBody: "Vos données restent dans ce navigateur et ne sont pas envoyées à un serveur externe.",
    export: "Sauvegarde",
    import: "Restaurer",
    completed: "Visités",
    remaining: "Restants",
    ageLabel: "Age actuel",
    ageSuffix: "ans",
    progress: "Progression",
    worldProgress: "Progression mondiale",
    privacyNote: "Photos stockées sur l'appareil",
    passport: "Passeport",
    search: "Rechercher par site ou pays",
    list: "Liste du Patrimoine mondial",
    dataUpdate: "Mise à jour de la liste",
    dataUpdateBody: "La liste du Patrimoine mondial est chargée depuis des données structurées fondées sur des sources officielles. Les champs affichés se limitent aux informations factuelles comme le nom, le pays, la région, la catégorie et l'année d'inscription.",
    jsonFormat: "Voir le format JSON",
    allRegions: "Toutes les régions",
    allCategories: "Toutes les catégories",
    allStatuses: "Tout",
    visitedOnly: "Visités",
    unvisitedOnly: "Non visités",
    cultural: "Culturel",
    natural: "Naturel",
    mixed: "Mixte",
    africa: "Afrique",
    arab: "États arabes",
    asia: "Asie et Pacifique",
    europe: "Europe et Amérique du Nord",
    latin: "Amérique latine et Caraïbes",
    markVisited: "Marquer visité",
    markUnvisited: "Annuler",
    details: "Carnet",
    official: "Page officielle",
    detailPage: "Page de détails",
    uploadPhoto: "Ajouter une photo",
    removePhoto: "Supprimer la photo",
    visitDate: "Date de visite",
    today: "Aujourd'hui",
    dateYear: "Année",
    dateMonth: "Mois",
    dateDay: "Jour",
    memo: "Mémo",
    save: "Enregistrer",
    noPhoto: "Aucune photo",
    stampsEmpty: "Les sites visités apparaîtront ici comme tampons récents",
    stampPreviewSummary: "{shown} récents / {visited} visités",
    viewAllStamps: "Voir tous les tampons",
    sampleBadge: "Aperçu d'exemple",
    sampleCreateOwn: "Créer mon propre passeport",
    memorialButton: "Voir le mémorial complet",
    achievementShareX: "Partager sur X",
    achievementShareImage: "Enregistrer l'image de réussite",
    achievementShareText: "J'ai conquis {visited}/{total} sites du patrimoine mondial avec World Heritage Passport 🏛️",
    memorialEyebrow: "Voyage complet",
    memorialTitle: "Passeport du Patrimoine mondial complété",
    memorialIntro: "Revivez vos photos et carnets de visite dans l'ordre chronologique.",
    memorialTimelineLabel: "Souvenirs du voyage",
    completeCardTitle: "Objectif complété",
    completeCardSubtitle: "{visited}/{total} tampons",
    completeCardDate: "Complété le {date}",
    completeCardPrivate: "Cette carte est affichée à partir des données enregistrées dans ce navigateur.",
    memorialClose: "Fermer",
    visitDateUnknown: "Date non renseignée",
    listCount: "{count} affichés",
    stampSummary: "{visited}/{total} tampons",
    exported: "Sauvegarde exportée.",
    imported: "Sauvegarde restaurée.",
    importError: "Impossible d'importer la sauvegarde."
  }
};

const seedSites = [
  site("jp-kyoto", "asia", "cultural", 1994, 688, "日本", "Japan", "古都京都の文化財", "Historic Monuments of Ancient Kyoto"),
  site("jp-fuji", "asia", "cultural", 2013, 1418, "日本", "Japan", "富士山-信仰の対象と芸術の源泉", "Fujisan, sacred place and source of artistic inspiration"),
  site("cn-great-wall", "asia", "cultural", 1987, 438, "中国", "China", "万里の長城", "The Great Wall"),
  site("in-taj-mahal", "asia", "cultural", 1983, 252, "インド", "India", "タージ・マハル", "Taj Mahal"),
  site("kh-angkor", "asia", "cultural", 1992, 668, "カンボジア", "Cambodia", "アンコール", "Angkor"),
  site("au-great-barrier", "asia", "natural", 1981, 154, "オーストラリア", "Australia", "グレート・バリア・リーフ", "Great Barrier Reef"),
  site("eg-pyramids", "arab", "cultural", 1979, 86, "エジプト", "Egypt", "メンフィスとその墓地遺跡", "Memphis and its Necropolis"),
  site("jo-petra", "arab", "cultural", 1985, 326, "ヨルダン", "Jordan", "ペトラ", "Petra"),
  site("it-rome", "europe", "cultural", 1980, 91, "イタリア", "Italy", "ローマ歴史地区", "Historic Centre of Rome"),
  site("fr-mont-saint-michel", "europe", "cultural", 1979, 80, "フランス", "France", "モン-サン-ミシェルとその湾", "Mont-Saint-Michel and its Bay"),
  site("es-alhambra", "europe", "cultural", 1984, 314, "スペイン", "Spain", "グラナダのアルハンブラ、ヘネラリーフェ、アルバイシン", "Alhambra, Generalife and Albayzin, Granada"),
  site("gb-stonehenge", "europe", "cultural", 1986, 373, "英国", "United Kingdom", "ストーンヘンジ、エーヴベリーと関連遺跡群", "Stonehenge, Avebury and Associated Sites"),
  site("us-yellowstone", "europe", "natural", 1978, 28, "アメリカ合衆国", "United States", "イエローストーン国立公園", "Yellowstone National Park"),
  site("ca-rocky", "europe", "natural", 1984, 304, "カナダ", "Canada", "カナディアン・ロッキー山脈自然公園群", "Canadian Rocky Mountain Parks"),
  site("pe-machu-picchu", "latin", "mixed", 1983, 274, "ペルー", "Peru", "マチュ・ピチュの歴史保護区", "Historic Sanctuary of Machu Picchu"),
  site("br-iguacu", "latin", "natural", 1986, 355, "ブラジル", "Brazil", "イグアス国立公園", "Iguaçu National Park"),
  site("mx-chichen-itza", "latin", "cultural", 1988, 483, "メキシコ", "Mexico", "古代都市チチェン・イッツァ", "Pre-Hispanic City of Chichen-Itza"),
  site("za-robben", "africa", "cultural", 1999, 916, "南アフリカ", "South Africa", "ロベン島", "Robben Island"),
  site("tz-serengeti", "africa", "natural", 1981, 156, "タンザニア", "Tanzania", "セレンゲティ国立公園", "Serengeti National Park"),
  site("ma-marrakesh", "arab", "cultural", 1985, 331, "モロッコ", "Morocco", "マラケシュ旧市街", "Medina of Marrakesh")
];

function site(id, region, category, year, unescoId, countryJa, countryEn, nameJa, nameEn) {
  return {
    id,
    region,
    category,
    year,
    officialUrl: `https://whc.unesco.org/en/list/${unescoId}`,
    country: { ja: countryJa, en: countryEn },
    name: { ja: nameJa, en: nameEn }
  };
}

const dbName = "world-heritage-passport";
const recordKey = "whp.records";
const siteKey = "whp.sites";
const siteSourceKey = "whp.siteSource";
const siteVersionKey = "whp.siteVersion";
const SITE_DATA_VERSION = "2026-08-1273";
const languageKey = "whp.language";
const ageKey = "whp.age";
const profileNameKey = "whp.profileName";
const homeCityKey = "whp.homeCity";
const cookieNoticeKey = "whp.cookieNoticeAccepted";
const completionSeenKey = "whp.completionMemorialSeen";
const regionCompletionSeenKey = "whp.regionCompletionMemorialSeen";
const samplePassportDismissedKey = "whp.samplePassportDismissed";

// サンプルパスポートに表示する有名世界遺産（UNESCO ID）。
// 富士山・古都京都・万里の長城・タージマハル・ピラミッド・マチュピチュ。
const SAMPLE_STAMP_UNESCO_IDS = ["1418", "688", "438", "252", "86", "274"];
const SAMPLE_ACHIEVEMENT_PERCENT = 8;
const unescoDataEndpoint = "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records";
const heritageImageManifestPath = "assets/heritage/manifest.json";
const heritageSlugMapPath = "assets/heritage/slugs.json";
const debugParams = new URLSearchParams(location.search);
const debugImagesEnabled = debugParams.get("debug") === "images";
let pendingOpenUnescoId = debugParams.get("open");
const earthCircumferenceKm = 40075;
const stampTypes = ["classic", "seal", "postmark", "ticket", "badge"];
const homeCities = [
  { key: "tokyo", ja: "日本・東京", en: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { key: "osaka", ja: "日本・大阪", en: "Osaka, Japan", lat: 34.6937, lon: 135.5023 },
  { key: "sapporo", ja: "日本・札幌", en: "Sapporo, Japan", lat: 43.0618, lon: 141.3545 },
  { key: "fukuoka", ja: "日本・福岡", en: "Fukuoka, Japan", lat: 33.5902, lon: 130.4017 },
  { key: "seoul", ja: "韓国・ソウル", en: "Seoul, South Korea", lat: 37.5665, lon: 126.978 },
  { key: "taipei", ja: "台湾・台北", en: "Taipei, Taiwan", lat: 25.033, lon: 121.5654 },
  { key: "singapore", ja: "シンガポール", en: "Singapore", lat: 1.3521, lon: 103.8198 },
  { key: "bangkok", ja: "タイ・バンコク", en: "Bangkok, Thailand", lat: 13.7563, lon: 100.5018 },
  { key: "hongkong", ja: "香港", en: "Hong Kong", lat: 22.3193, lon: 114.1694 },
  { key: "beijing", ja: "中国・北京", en: "Beijing, China", lat: 39.9042, lon: 116.4074 },
  { key: "shanghai", ja: "中国・上海", en: "Shanghai, China", lat: 31.2304, lon: 121.4737 },
  { key: "delhi", ja: "インド・デリー", en: "Delhi, India", lat: 28.6139, lon: 77.209 },
  { key: "dubai", ja: "UAE・ドバイ", en: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
  { key: "london", ja: "英国・ロンドン", en: "London, United Kingdom", lat: 51.5072, lon: -0.1276 },
  { key: "paris", ja: "フランス・パリ", en: "Paris, France", lat: 48.8566, lon: 2.3522 },
  { key: "rome", ja: "イタリア・ローマ", en: "Rome, Italy", lat: 41.9028, lon: 12.4964 },
  { key: "newyork", ja: "米国・ニューヨーク", en: "New York, USA", lat: 40.7128, lon: -74.006 },
  { key: "losangeles", ja: "米国・ロサンゼルス", en: "Los Angeles, USA", lat: 34.0522, lon: -118.2437 },
  { key: "sydney", ja: "豪州・シドニー", en: "Sydney, Australia", lat: -33.8688, lon: 151.2093 }
];
const japanHeritageNamesJa = {
  "660": "法隆寺地域の仏教建造物",
  "661": "姫路城",
  "662": "屋久島",
  "663": "白神山地",
  "688": "古都京都の文化財（京都市、宇治市、大津市）",
  "734": "白川郷・五箇山の合掌造り集落",
  "775": "広島平和記念碑（原爆ドーム）",
  "776": "厳島神社",
  "870": "古都奈良の文化財",
  "913": "日光の社寺",
  "972": "琉球王国のグスク及び関連遺産群",
  "1142": "紀伊山地の霊場と参詣道",
  "1193": "知床",
  "1246": "石見銀山遺跡とその文化的景観",
  "1277": "平泉－仏国土（浄土）を表す建築・庭園及び考古学的遺跡群",
  "1321": "ル・コルビュジエの建築作品－近代建築運動への顕著な貢献",
  "1362": "小笠原諸島",
  "1418": "富士山－信仰の対象と芸術の源泉",
  "1449": "富岡製糸場と絹産業遺産群",
  "1484": "明治日本の産業革命遺産 製鉄・製鋼、造船、石炭産業",
  "1495": "長崎と天草地方の潜伏キリシタン関連遺産",
  "1535": "「神宿る島」宗像・沖ノ島と関連遺産群",
  "1574": "奄美大島、徳之島、沖縄島北部及び西表島",
  "1593": "百舌鳥・古市古墳群－古代日本の墳墓群",
  "1632": "北海道・北東北の縄文遺跡群",
  "1698": "佐渡島の金山",
  "1757": "飛鳥・藤原の宮都とその関連資産群"
};
let heritageImageManifest = {};
/** 代表画像一覧（manifest.json）の読み込み完了を待つための Promise */
let heritageImageManifestReady = null;
/** いま詳細ダイアログに表示している遺産の id */
let openDialogItemId = null;
/** 初回描画（bindEvents / render）が済んだか */
let appInitialized = false;
let heritageSlugMap = {};
let htmlDecodeElement;

/**
 * 独立URLを持つ言語と、そのURLセグメントの対応。
 * 日本語は既存URL（/heritage）を維持するためセグメントを持たない。
 * ここに無い言語（韓国語・繁体字など）はページ内切替のみ。
 *
 * state の初期化（下の language: languageFromPath() ...）がこの定数を
 * 参照するため、state より前で const 初期化を終えておく必要がある
 * （後ろに置くと「Cannot access before initialization」エラーになる）。
 */
const localeSegments = { en: "en", "zh-TW": "zh-hant" };

function localeAppPath(language) {
  const segment = localeSegments[language];
  return segment ? `/heritage/${segment}` : "/heritage";
}

/** 現在開いているページに対応するアプリのパス（末尾スラッシュを無視して比較する） */
function currentAppPath() {
  const path = location.pathname.replace(/\/+$/, "") || "/heritage";
  const match = path.match(/^\/heritage\/(en|zh-hant)$/);
  return match ? `/heritage/${match[1]}` : "/heritage";
}

/** URLから言語を決める。/heritage/en なら常に英語で表示する */
function languageFromPath() {
  const segment = currentAppPath().split("/")[2];
  if (!segment) return null;
  return Object.keys(localeSegments).find((lang) => localeSegments[lang] === segment) || null;
}

let state = {
  // URLで言語が指定されていればそれを最優先する（/heritage/fr は必ずフランス語）
  language: languageFromPath() || localStorage.getItem(languageKey) || preferredLanguage(),
  sites: loadSites(),
  records: loadRecords(),
  photos: new Map(),
  pendingPhotos: new Map(),
  pendingDialogRecords: new Map(),
  age: localStorage.getItem(ageKey) || "",
  profileName: localStorage.getItem(profileNameKey) || "",
  homeCity: localStorage.getItem(homeCityKey) || "tokyo",
  dataStatus: isSeedDataset(loadSites()) ? "sample" : "remote",
  viewMode: "countries",
  selectedCountry: "",
  imageSamplesOnly: false,
  page: 1,
  filters: { query: "", region: "all", category: "all", status: "all" }
};

const pageSize = 60;
const countryFlagCodes = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");
const countryFlagAliases = {
  "bolivia plurinational state of": "BO",
  "cabo verde": "CV",
  "cote d ivoire": "CI",
  "czechia": "CZ",
  "democratic people s republic of korea": "KP",
  "democratic republic of the congo": "CD",
  "holy see": "VA",
  "iran islamic republic of": "IR",
  "korea democratic people s republic of": "KP",
  "korea republic of": "KR",
  "lao people s democratic republic": "LA",
  "micronesia federated states of": "FM",
  "moldova republic of": "MD",
  "palestine": "PS",
  "republic of korea": "KR",
  "russian federation": "RU",
  "syrian arab republic": "SY",
  "tanzania united republic of": "TZ",
  "turkiye": "TR",
  "united kingdom of great britain and northern ireland": "GB",
  "united states of america": "US",
  "venezuela bolivarian republic of": "VE",
  "viet nam": "VN"
};
let countryFlagNameMap;

const $ = (selector) => document.querySelector(selector);
const t = (key, vars = {}) => {
  const dict = { ...translations.en, ...translations[state.language] };
  return (dict[key] || translations.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
};

function preferredLanguage() {
  const supported = Object.keys(translations);
  return supported.find((lang) => navigator.language.startsWith(lang)) || "ja";
}

/**
 * 前回自分で選んだ言語に独立URLがある場合は、そのURLへ寄せる。
 * 自動判定した言語では動かさず、明示的に切り替えた人だけが対象。
 * 遷移先では languageFromPath() が一致するため、ループしない。
 */
(function applyStoredLanguageUrl() {
  if (languageFromPath()) return;
  const stored = localStorage.getItem(languageKey);
  if (!stored) return;
  const target = localeAppPath(stored);
  if (target !== currentAppPath()) location.replace(target + location.search);
})();

const localNameKeysByLanguage = {
  ja: ["ja"],
  en: ["en"],
  "zh-CN": ["zh"],
  "zh-TW": ["zh"],
  ko: ["ko"],
  es: ["es"],
  fr: ["fr"]
};

function cleanDataText(value) {
  const text = String(value ?? "");
  const withoutTags = text.replace(/<[^>]*>/g, "");
  if (!withoutTags.includes("&")) return withoutTags.trim();
  htmlDecodeElement ||= document.createElement("textarea");
  htmlDecodeElement.innerHTML = withoutTags;
  return htmlDecodeElement.value.trim();
}

function cleanLocalizedName(value) {
  const entries = Object.entries(value || {});
  return entries.reduce((cleaned, [key, text]) => {
    cleaned[key] = cleanDataText(text);
    return cleaned;
  }, {});
}

function countryHasJapan(country) {
  const countryNames = [country?.en, country?.ja].filter(Boolean).join(" / ");
  return countryNames.split(/\s+\/\s+/).some((name) => cleanDataText(name) === "Japan" || name === "日本");
}

function siteUnescoId(item) {
  return String(item?.unescoId || item?.id || "").replace(/^unesco-/, "");
}

function normalizeSiteData(sites) {
  return Array.isArray(sites) ? sites.map(normalizeSite) : [];
}

function normalizeSite(item) {
  const unescoId = siteUnescoId(item);
  const cleanCountry = cleanLocalizedName(item.country);
  const cleanName = cleanLocalizedName(item.name);
  const japanName = japanHeritageNamesJa[unescoId];

  if (japanName) cleanName.ja = japanName;
  if (japanName && countryHasJapan(cleanCountry)) cleanCountry.ja = "日本";

  return {
    ...item,
    country: cleanCountry,
    name: cleanName,
    criteria: cleanDataText(item.criteria || "")
  };
}

function localName(value) {
  if (!value) return "";
  const languageKeys = localNameKeysByLanguage[state.language] || [state.language];
  for (const key of languageKeys) {
    if (value[key]) return cleanDataText(value[key]);
  }
  return cleanDataText(value.ja || value.en || Object.values(value)[0] || "");
}

function normalizeCountryForFlag(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function countryFlagMap() {
  if (countryFlagNameMap) return countryFlagNameMap;
  countryFlagNameMap = new Map(Object.entries(countryFlagAliases));
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  countryFlagCodes.forEach((code) => {
    const name = displayNames.of(code);
    if (name) countryFlagNameMap.set(normalizeCountryForFlag(name), code);
  });
  return countryFlagNameMap;
}

function countryFlagItems(country, maxShown = 4) {
  const sourceName = country?.en || country?.ja || "";
  const parts = sourceName.split(/\s+\/\s+/).map((part) => part.trim()).filter(Boolean);
  const map = countryFlagMap();
  const codes = [];
  parts.forEach((part) => {
    const code = map.get(normalizeCountryForFlag(part));
    if (code && !codes.includes(code)) codes.push(code);
  });
  const shownCodes = codes.slice(0, maxShown);
  return {
    flags: shownCodes.map((code) => ({ code, url: `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/flags/4x3/${code.toLowerCase()}.svg` })),
    hiddenCount: Math.max(0, codes.length - shownCodes.length)
  };
}

function homeCityLabel(city) {
  return state.language === "ja" ? city.ja : city.en;
}

function selectedHomeCity() {
  return homeCities.find((city) => city.key === state.homeCity) || homeCities[0];
}

function radians(value) {
  return value * Math.PI / 180;
}

function distanceKm(from, to) {
  if (!from || !to || typeof to.lat !== "number" || typeof to.lon !== "number") return 0;
  const earthRadiusKm = 6371;
  const dLat = radians(to.lat - from.lat);
  const dLon = radians(to.lon - from.lon);
  const lat1 = radians(from.lat);
  const lat2 = radians(to.lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function travelDistanceStats() {
  const home = selectedHomeCity();
  const visitedWithCoordinates = state.sites.filter((item) => (
    state.records[item.id]?.visited
    && typeof item.coordinates?.lat === "number"
    && typeof item.coordinates?.lon === "number"
  ));
  const totalKm = visitedWithCoordinates.reduce((sum, item) => (
    sum + distanceKm(home, item.coordinates) * 2
  ), 0);
  return {
    home,
    totalKm,
    earthLaps: totalKm / earthCircumferenceKm,
    countedSites: visitedWithCoordinates.length
  };
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat(state.language, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

function loadSites() {
  try {
    const savedSites = JSON.parse(localStorage.getItem(siteKey));
    return normalizeSiteData(Array.isArray(savedSites) && savedSites.length ? savedSites : seedSites);
  } catch {
    return normalizeSiteData(seedSites);
  }
}

function isSeedDataset(sites) {
  return Array.isArray(sites)
    && sites.length === seedSites.length
    && sites.every((item, index) => item.id === seedSites[index]?.id);
}

async function loadRemoteWorldHeritageSites() {
  const existingSource = localStorage.getItem(siteSourceKey);
  if (existingSource === "custom" && !isSeedDataset(state.sites)) return;
  const cachedVersion = localStorage.getItem(siteVersionKey);
  if (
    existingSource === "unesco-datahub-whc001"
    && state.sites.length >= 1200
    && cachedVersion === SITE_DATA_VERSION
  ) {
    state.dataStatus = "remote";
    render();
    tryOpenPendingSite();
    return;
  }
  state.dataStatus = "loading";
  render();

  try {
    const sites = await fetchUnescoDataHubSites();
    if (sites.length >= 1200) {
      state.sites = sites;
      state.dataStatus = "remote";
      localStorage.setItem(siteKey, JSON.stringify(sites));
      localStorage.setItem(siteSourceKey, "unesco-datahub-whc001");
      localStorage.setItem(siteVersionKey, SITE_DATA_VERSION);
      render();
      tryOpenPendingSite();
    }
  } catch (error) {
    console.warn("Failed to load UNESCO DataHub sites", error);
    state.dataStatus = "error";
    render();
  }
}

async function fetchUnescoDataHubSites() {
  const all = [];
  const limit = 100;
  let offset = 0;
  let total = Infinity;

  while (all.length < total) {
    const response = await fetch(`${unescoDataEndpoint}?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error(`UNESCO DataHub request failed: ${response.status}`);
    const payload = await response.json();
    total = payload.total_count;
    all.push(...payload.results);
    offset += limit;
  }

  return all.map(transformUnescoRecord).sort((a, b) => (
    `${a.country.en}${a.name.en}`.localeCompare(`${b.country.en}${b.name.en}`)
  ));
}

function transformUnescoRecord(item) {
  const idNo = String(item.id_no);
  const stateNames = Array.isArray(item.states_names) ? item.states_names : [item.states_names];
  const states = stateNames.map(cleanDataText).filter(Boolean).join(" / ");
  const isJapanSite = stateNames.some((name) => cleanDataText(name) === "Japan");
  const englishName = cleanDataText(item.name_en || "");
  const site = {
    id: `unesco-${idNo}`,
    source: "UNESCO DataHub whc001",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://data.unesco.org/explore/dataset/whc001/",
    officialUrl: `https://whc.unesco.org/en/list/${idNo}`,
    unescoId: idNo,
    country: { ja: isJapanSite ? "日本" : states, en: states },
    name: {
      ja: japanHeritageNamesJa[idNo] || englishName,
      en: englishName,
      zh: cleanDataText(item.name_zh || ""),
      fr: cleanDataText(item.name_fr || ""),
      es: cleanDataText(item.name_es || ""),
      ar: cleanDataText(item.name_ar || ""),
      ru: cleanDataText(item.name_ru || "")
    },
    region: regionFromDataHub(item.region),
    category: categoryFromDataHub(item.category),
    year: item.date_inscribed ? Number(item.date_inscribed) : null,
    criteria: cleanDataText(item.criteria_txt || ""),
    coordinates: item.coordinates ? { lat: item.coordinates.lat, lon: item.coordinates.lon } : null
  };
  return normalizeSite(site);
}

function regionFromDataHub(value) {
  return {
    "Africa": "africa",
    "Arab States": "arab",
    "Asia and the Pacific": "asia",
    "Europe and North America": "europe",
    "Latin America and the Caribbean": "latin"
  }[value] || "unknown";
}

function categoryFromDataHub(value) {
  return {
    Cultural: "cultural",
    Natural: "natural",
    Mixed: "mixed"
  }[value] || "mixed";
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(recordKey)) || {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(recordKey, JSON.stringify(state.records));
}

function saveSites() {
  localStorage.setItem(siteKey, JSON.stringify(state.sites));
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putPhoto(id, dataUrl) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").put(dataUrl, id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  state.photos.set(id, dataUrl);
}

async function deletePhoto(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  state.photos.delete(id);
}

async function loadPhotos() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const request = tx.objectStore("photos").getAllKeys();
    request.onsuccess = async () => {
      const keys = request.result;
      const entries = await Promise.all(keys.map((key) => getPhoto(key)));
      state.photos = new Map(keys.map((key, index) => [key, entries[index]]));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

async function getPhoto(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const request = tx.objectStore("photos").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function setLanguage(language) {
  localStorage.setItem(languageKey, language);

  // 独立URLを持つ言語は、そのURLへ遷移させる（検索エンジンに言語別ページとして拾わせるため）。
  // URLを持たない言語（韓国語・繁体字）は、これまで通りページ内で切り替える。
  const target = localeAppPath(language);
  if (target !== currentAppPath()) {
    location.href = target + location.search;
    return;
  }

  state.language = language;
  document.documentElement.lang = language;
  render();
}

function translateStaticText() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}

function renderFilters() {
  $("#regionFilter").innerHTML = option("all", t("allRegions")) + ["africa", "arab", "asia", "europe", "latin"].map((id) => option(id, t(id))).join("");
  $("#categoryFilter").innerHTML = option("all", t("allCategories")) + ["cultural", "natural", "mixed"].map((id) => option(id, t(id))).join("");
  $("#statusFilter").innerHTML = [
    option("all", t("allStatuses")),
    option("visited", t("visitedOnly")),
    option("unvisited", t("unvisitedOnly"))
  ].join("");
  $("#regionFilter").value = state.filters.region;
  $("#categoryFilter").value = state.filters.category;
  $("#statusFilter").value = state.filters.status;
}

function renderSearchContext() {
  const helpKey = state.viewMode === "visited"
    ? "searchHelpVisited"
    : state.viewMode === "heritage"
      ? "searchHelpHeritage"
      : "searchHelpCountries";
  $("#searchHelp").textContent = t(helpKey);
}

function option(value, label) {
  return `<option value="${value}">${escapeHtml(label)}</option>`;
}

function countryKey(item) {
  return item.country?.en || item.country?.ja || "Unknown";
}

function isVisited(item) {
  return Boolean(state.records[item.id]?.visited);
}

function matchesQuery(item, query) {
  if (!query) return true;
  const searchText = [
    localName(item.name),
    item.name?.en,
    item.name?.ja,
    localName(item.country),
    item.country?.en,
    item.country?.ja
  ].map(cleanDataText).join(" ").toLowerCase();
  return searchText.includes(query);
}

function matchesFilters(item, options = {}) {
  const query = options.ignoreQuery ? "" : state.filters.query.trim().toLowerCase();
  return matchesQuery(item, query)
    && (state.filters.region === "all" || item.region === state.filters.region)
    && (state.filters.category === "all" || item.category === state.filters.category)
    && (state.filters.status === "all" || (state.filters.status === "visited" ? isVisited(item) : !isVisited(item)));
}

function countryIndex() {
  const groups = new Map();
  state.sites.filter((item) => matchesFilters(item, { ignoreQuery: true })).forEach((item) => {
    const key = countryKey(item);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        region: item.region || "unknown",
        country: item.country || { en: key, ja: key },
        sites: []
      });
    }
    groups.get(key).sites.push(item);
  });

  return Array.from(groups.values()).map((group) => {
    const visited = group.sites.filter(isVisited).length;
    const total = group.sites.length;
    return {
      ...group,
      total,
      visited,
      remaining: total - visited,
      progress: Math.round((visited / total) * 100) || 0
    };
  }).sort((a, b) => localName(a.country).localeCompare(localName(b.country), state.language));
}

function filteredSites() {
  const query = state.filters.query.trim().toLowerCase();
  return state.sites.filter((item) => {
    const countryMatches = query || !state.selectedCountry || countryKey(item) === state.selectedCountry;
    const modeMatches = state.viewMode !== "visited" || isVisited(item);
    const imageMatches = !state.imageSamplesOnly || hasPresetImage(item);
    return countryMatches && modeMatches && imageMatches && matchesFilters(item);
  });
}

function renderStats() {
  const total = state.sites.length;
  const visited = state.sites.filter((item) => state.records[item.id]?.visited).length;
  const remaining = total - visited;
  $("#visitedCount").textContent = visited;
  $("#remainingCount").textContent = remaining;
  $("#ageInput").value = state.age;
  const profileNameInput = $("#profileNameInput");
  if (profileNameInput && profileNameInput.value !== state.profileName) {
    profileNameInput.value = state.profileName;
  }
  $("#progressPercent").textContent = `${Math.round((visited / total) * 100) || 0}%`;
  $("#stampSummary").textContent = t("stampSummary", { visited, total });
  renderTravelDistance();
}

function renderTravelDistance() {
  const select = $("#homeCitySelect");
  if (!select) return;
  select.innerHTML = homeCities.map((city) => (
    `<option value="${escapeHtml(city.key)}" ${city.key === state.homeCity ? "selected" : ""}>${escapeHtml(homeCityLabel(city))}</option>`
  )).join("");
  const stats = travelDistanceStats();
  $("#travelDistanceKm").textContent = t("travelDistanceKm", { km: formatNumber(Math.round(stats.totalKm)) });
  $("#travelDistanceNote").textContent = t("travelDistanceBody", { city: homeCityLabel(stats.home) });
  $("#earthLaps").textContent = t("earthLaps", { laps: formatNumber(stats.earthLaps, 2) });
}

function renderRegions() {
  const regions = ["africa", "arab", "asia", "europe", "latin"];
  const completedRegions = [];
  $("#regionMap").innerHTML = regions.map((region) => {
    const sites = state.sites.filter((item) => item.region === region);
    const visited = sites.filter((item) => state.records[item.id]?.visited).length;
    const pct = Math.round((visited / sites.length) * 100) || 0;
    const complete = sites.length > 0 && visited === sites.length;
    if (complete) completedRegions.push({ region, sites, visited, total: sites.length });
    return `
      <article class="region-card ${complete ? "complete" : ""}">
        <strong>${escapeHtml(t(region))}</strong>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <p class="progress-text">${visited}/${sites.length} · ${pct}%</p>
        ${complete ? `<button class="region-memorial-button" type="button" data-region-memorial="${escapeHtml(region)}">${escapeHtml(t("regionMemorialButton"))}</button>` : ""}
      </article>
    `;
  }).join("");
  renderRegionCompletionAccess(completedRegions);
}

function stampTypeValue(record = {}) {
  return stampTypes.includes(record.stampType) ? record.stampType : "classic";
}

function stampTypeLabel(type) {
  return t({
    classic: "stampClassic",
    seal: "stampSeal",
    postmark: "stampPostmark",
    ticket: "stampTicket",
    badge: "stampBadge"
  }[type] || "stampClassic");
}

function stampTypeChoices(selectedType) {
  return stampTypes.map((type) => {
    const label = escapeHtml(stampTypeLabel(type));
    return `
      <label class="stamp-type-option">
        <input type="radio" name="stampType" value="${type}" ${type === selectedType ? "checked" : ""}>
        <span class="stamp stamp-preview stamp-${type}" aria-hidden="true">
          <span>${label}</span>
          <small>2026.06</small>
        </span>
        <span class="stamp-type-name">${label}</span>
      </label>
    `;
  }).join("");
}

function isSamplePassportDismissed() {
  return localStorage.getItem(samplePassportDismissedKey) === "true";
}

function dismissSamplePassport() {
  localStorage.setItem(samplePassportDismissedKey, "true");
  render();
}

function sampleStampItems() {
  return SAMPLE_STAMP_UNESCO_IDS
    .map((uid) => state.sites.find((item) => String(item.unescoId || "").replace(/\D/g, "") === uid))
    .filter(Boolean);
}

function renderSamplePassport() {
  const sampleItems = sampleStampItems();
  $("#stampSummary").textContent = t("sampleBadge");
  $("#stampSummary").classList.add("sample-mode");
  $("#sampleProgressBar").hidden = false;
  $("#createOwnPassportBtn").hidden = false;
  $("#viewAllStampsBtn").hidden = true;
  $("#stampGrid").innerHTML = sampleItems.map((item) => {
    const presetImage = sitePresetImage(item);
    return `
      <div class="stamp stamp-ticket stamp-sample" aria-hidden="true">
        ${presetImage ? `<img src="${presetImage}" alt="">` : ""}
        <span>${escapeHtml(localName(item.name))}</span>
      </div>
    `;
  }).join("");
}

function renderStamps() {
  const visited = state.sites
    .filter((item) => state.records[item.id]?.visited)
    .sort((a, b) => {
      const recordA = state.records[a.id] || {};
      const recordB = state.records[b.id] || {};
      return String(recordB.updatedAt || recordB.date || "").localeCompare(String(recordA.updatedAt || recordA.date || ""));
    });

  if (visited.length === 0 && !isSamplePassportDismissed()) {
    renderSamplePassport();
    renderCompletionAccess(visited);
    return;
  }

  $("#stampSummary").classList.remove("sample-mode");
  $("#sampleProgressBar").hidden = true;
  $("#createOwnPassportBtn").hidden = true;
  const latest = visited.slice(0, 12);
  $("#stampSummary").textContent = visited.length
    ? t("stampPreviewSummary", { shown: latest.length, visited: visited.length })
    : t("stampSummary", { visited: 0, total: state.sites.length });
  $("#viewAllStampsBtn").hidden = visited.length === 0;
  $("#stampGrid").innerHTML = visited.length
    ? latest.map((item) => {
      const record = state.records[item.id] || {};
      return `
        <button class="stamp stamp-${escapeHtml(stampTypeValue(record))}" type="button" data-open="${escapeHtml(item.id)}">
          <span>${escapeHtml(localName(item.name))}</span>
          <small>${escapeHtml(formatStampDate(item))}</small>
        </button>
      `;
    }).join("")
    : `<div class="stamp empty">${escapeHtml(t("stampsEmpty"))}</div>`;
  renderCompletionAccess(visited);
}

function completionStats(visitedItems = null) {
  const visited = visitedItems || state.sites.filter((item) => state.records[item.id]?.visited);
  const total = state.sites.length;
  return {
    total,
    visited: visited.length,
    isComplete: total > 0 && visited.length === total
  };
}

function generateAchievementShareCard(stats) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の生成に失敗しました");
  const fontStack = '"Hiragino Kaku Gothic ProN", "Noto Sans JP", "Meiryo", sans-serif';

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#b45309");
  bg.addColorStop(1, "#1c1917");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(1020, 120, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 24px ${fontStack}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("🏛️ " + t("appTitle"), 60, 90);

  ctx.font = `800 58px ${fontStack}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${t("completed")} ${stats.visited} / ${stats.total}`, 60, 260);

  ctx.font = `500 30px ${fontStack}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const pct = Math.round((stats.visited / stats.total) * 100) || 0;
  ctx.fillText(`${t("progress")} ${pct}%`, 60, 320);

  ctx.font = `600 22px ${fontStack}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "right";
  ctx.fillText("ai-drive-planner.com/heritage", canvas.width - 40, canvas.height - 36);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

function handleAchievementShareX() {
  const stats = completionStats();
  const text = t("achievementShareText", stats);
  const params = new URLSearchParams({
    text,
    url: "https://www.ai-drive-planner.com/heritage/",
    hashtags: "世界遺産,世界遺産パスポート"
  });
  window.open(`https://twitter.com/intent/tweet?${params.toString()}`, "_blank", "noopener,noreferrer");
}

function handleAchievementShareImage() {
  const stats = completionStats();
  const dataUrl = generateAchievementShareCard(stats);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = "世界遺産パスポート-実績.png";
  anchor.click();
}

function renderCompletionAccess(visitedItems) {
  const button = $("#memorialBtn");
  if (!button) return;
  const stats = completionStats(visitedItems);
  button.hidden = !stats.isComplete;
  if (!stats.isComplete) return;
  const seenValue = `${stats.total}:${stats.visited}`;
  if (localStorage.getItem(completionSeenKey) !== seenValue && !$("#memorialDialog")?.open) {
    localStorage.setItem(completionSeenKey, seenValue);
    window.setTimeout(() => openMemorialDialog(), 350);
  }
}

function renderRegionCompletionAccess(completedRegions) {
  if (completionStats().isComplete) return;
  const seen = JSON.parse(localStorage.getItem(regionCompletionSeenKey) || "{}");
  const next = completedRegions.find((entry) => {
    const seenValue = `${entry.total}:${entry.visited}`;
    return seen[entry.region] !== seenValue;
  });
  if (!next || $("#memorialDialog")?.open) return;
  seen[next.region] = `${next.total}:${next.visited}`;
  localStorage.setItem(regionCompletionSeenKey, JSON.stringify(seen));
  window.setTimeout(() => openRegionMemorialDialog(next.region), 350);
}

function chronologicalVisitedSites(items = state.sites) {
  return items
    .filter((item) => state.records[item.id]?.visited)
    .sort((a, b) => {
      const recordA = state.records[a.id] || {};
      const recordB = state.records[b.id] || {};
      return String(recordA.date || recordA.updatedAt || "").localeCompare(String(recordB.date || recordB.updatedAt || ""));
    });
}

function memorialHighlights(items, max = 60) {
  if (items.length <= max) return items;
  const highlights = [];
  for (let index = 0; index < max; index += 1) {
    const sourceIndex = Math.round(index * (items.length - 1) / (max - 1));
    highlights.push(items[sourceIndex]);
  }
  return [...new Map(highlights.map((item) => [item.id, item])).values()];
}

function formatRecordDate(item) {
  const record = state.records[item.id] || {};
  const value = record.date || record.updatedAt || "";
  return formatDateValue(value);
}

function formatStampDate(item) {
  const record = state.records[item.id] || {};
  return formatDateValue(record.date || "");
}

function formatDateValue(value) {
  if (!value) return t("visitDateUnknown");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(state.language, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function memorialImage(item) {
  const photo = state.photos.get(item.id);
  const presetImage = sitePresetImage(item);
  const imageAlt = escapeHtml(localName(item.name));
  if (photo) return `<img src="${photo}" alt="${imageAlt}">`;
  if (presetImage) {
    return `<img src="${presetImage}" data-fallback="${previewFallbackImage(presetImage)}" alt="${imageAlt}" loading="lazy" onerror="if (this.dataset.fallback && !this.dataset.triedFallback) { this.dataset.triedFallback = 'true'; this.src = this.dataset.fallback; } else { this.closest('.memorial-photo').classList.add('image-error'); this.remove(); }">`;
  }
  return `<div class="placeholder-visual ${categoryClass(item)}" aria-hidden="true"></div>`;
}

function renderMemorialDialog(options = {}) {
  const visited = options.items || chronologicalVisitedSites();
  const total = options.total || state.sites.length;
  const completedAt = visited.reduce((latest, item) => {
    const record = state.records[item.id] || {};
    const value = record.date || record.updatedAt || "";
    return value > latest ? value : latest;
  }, "");
  const completedDate = completedAt ? formatDateValue(completedAt) : formatDateValue(new Date().toISOString());
  const showAllItems = options.showAllItems !== false;
  const timelineItems = showAllItems ? visited : memorialHighlights(visited);
  const duplicateTimeline = timelineItems.length > 0 && timelineItems.length <= 80;
  const view = {
    eyebrow: options.eyebrow || t("memorialEyebrow"),
    title: options.title || t("memorialTitle"),
    intro: options.intro || t("memorialIntro"),
    cardTitle: options.cardTitle || t("completeCardTitle"),
    cardPrivate: options.cardPrivate || t("completeCardPrivate")
  };
  const timeline = timelineItems.map((item, index) => {
    const record = state.records[item.id] || {};
    const memo = String(record.memo || "").trim();
    return `
      <article class="memorial-slide" style="--i:${index}">
        <div class="memorial-photo">${memorialImage(item)}</div>
        <div class="memorial-slide-text">
          <span>${escapeHtml(formatRecordDate(item))}</span>
          <strong>${escapeHtml(localName(item.name))}</strong>
          <p>${escapeHtml(localName(item.country))}${memo ? ` · ${escapeHtml(memo.slice(0, 44))}` : ""}</p>
        </div>
      </article>
    `;
  }).join("");

  $("#memorialContent").innerHTML = `
    <section class="memorial-hero">
      <p class="eyebrow">${escapeHtml(view.eyebrow)}</p>
      <h2>${escapeHtml(view.title)}</h2>
      <p>${escapeHtml(view.intro)}</p>
    </section>
    <section class="memorial-timeline ${duplicateTimeline ? "" : "all-items"}" aria-label="${escapeHtml(t("memorialTimelineLabel"))}">
      <div class="memorial-track ${duplicateTimeline ? "" : "all-items"}">
        ${timeline}${duplicateTimeline ? timeline : ""}
      </div>
    </section>
    <section class="completion-card">
      <p class="eyebrow">${escapeHtml(t("passport"))}</p>
      <h3>${escapeHtml(view.cardTitle)}</h3>
      <strong>${escapeHtml(t("completeCardSubtitle", { visited: visited.length, total }))}</strong>
      <p>${escapeHtml(t("completeCardDate", { date: completedDate }))}</p>
      <small>${escapeHtml(view.cardPrivate)}</small>
    </section>
    <button class="ghost memorial-done" type="button" data-close-memorial>${escapeHtml(t("memorialClose"))}</button>
  `;
}

function openMemorialDialog() {
  const dialog = $("#memorialDialog");
  if (!dialog) return;
  renderMemorialDialog();
  if (!dialog.open) dialog.showModal();
}

function openRegionMemorialDialog(region) {
  const dialog = $("#memorialDialog");
  if (!dialog) return;
  const regionName = t(region);
  const regionSites = state.sites.filter((item) => item.region === region);
  renderMemorialDialog({
    items: chronologicalVisitedSites(regionSites),
    total: regionSites.length,
    eyebrow: t("regionMemorialEyebrow"),
    title: t("regionMemorialTitle", { region: regionName }),
    intro: t("regionMemorialIntro", { region: regionName }),
    cardTitle: t("regionCompleteCardTitle", { region: regionName }),
    cardPrivate: t("regionCompleteCardPrivate")
  });
  if (!dialog.open) dialog.showModal();
}

function renderCountryIndex() {
  const countries = countryIndex();
  const query = state.filters.query.trim();
  $("#countrySection").hidden = state.viewMode !== "countries" || Boolean(query);
  $("#countrySummary").textContent = state.selectedCountry
    ? t("selectedCountrySummary", { country: localName(countries.find((country) => country.key === state.selectedCountry)?.country || { en: state.selectedCountry }), count: filteredSites().length })
    : t("countrySummary", { count: countries.length });
  $("#clearCountryBtn").hidden = !state.selectedCountry;

  const regions = ["africa", "arab", "asia", "europe", "latin", "unknown"];
  $("#countryIndex").innerHTML = regions.map((region) => {
    const regionCountries = countries.filter((country) => country.region === region);
    if (!regionCountries.length) return "";
    const isSelectedRegion = state.selectedCountry && regionCountries.some((country) => country.key === state.selectedCountry);
    return `
      <details class="region-group" ${isSelectedRegion ? "open" : ""}>
        <summary>${escapeHtml(t(region))}</summary>
        <div class="country-table">
          ${regionCountries.map((country) => countryRow(country)).join("")}
        </div>
      </details>
    `;
  }).join("");
}

function countryRow(country) {
  const active = state.selectedCountry === country.key;
  const flagItems = countryFlagItems(country.country);
  const flagsHtml = flagItems.flags.length
    ? `<div class="country-flags" aria-hidden="true">${flagItems.flags.map((flag) => `<span title="${escapeHtml(flag.code)}"><img src="${escapeHtml(flag.url)}" alt="" loading="lazy" onerror="this.closest('span').hidden=true"></span>`).join("")}${flagItems.hiddenCount ? `<em>+${flagItems.hiddenCount}</em>` : ""}</div>`
    : `<div class="country-flags empty" aria-hidden="true"></div>`;
  return `
    <button class="country-card ${active ? "active" : ""}" type="button" data-country="${escapeHtml(country.key)}">
      ${flagsHtml}
      <strong>${escapeHtml(localName(country.country))}</strong>
      <span class="country-stat">${escapeHtml(t("sitesLabel", { count: country.total }))}</span>
      <span class="country-stat">${escapeHtml(t("visitedLabel", { count: country.visited }))}</span>
      <span class="country-stat">${escapeHtml(t("remainingLabel", { count: country.remaining }))}</span>
      <div class="country-progress"><i style="width:${country.progress}%"></i></div>
      <b class="country-percent">${country.progress}%</b>
    </button>
  `;
}

const legacySiteImageMap = {
  "28": "assets/heritage/yellowstone.webp",
  "80": "assets/heritage/mont-saint-michel.webp",
  "86": "assets/heritage/pyramids.webp",
  "91": "assets/heritage/rome.webp",
  "154": "assets/heritage/great-barrier-reef.webp",
  "156": "assets/heritage/serengeti.webp",
  "252": "assets/heritage/taj-mahal.webp",
  "274": "assets/heritage/machu-picchu.webp",
  "304": "assets/heritage/canadian-rockies.webp",
  "314": "assets/heritage/alhambra.webp",
  "326": "assets/heritage/petra.webp",
  "331": "assets/heritage/marrakesh.webp",
  "355": "assets/heritage/iguacu.webp",
  "373": "assets/heritage/stonehenge.webp",
  "438": "assets/heritage/great-wall.webp",
  "483": "assets/heritage/chichen-itza.webp",
  "660": "assets/heritage/horyu-ji.webp",
  "661": "assets/heritage/himeji-jo.webp",
  "662": "assets/heritage/yakushima.webp",
  "663": "assets/heritage/shirakami-sanchi.webp",
  "668": "assets/heritage/angkor.webp",
  "688": "assets/heritage/kyoto.webp",
  "734": "assets/heritage/shirakawa-go-gokayama.webp",
  "775": "assets/heritage/hiroshima-peace-memorial.webp",
  "776": "assets/heritage/itsukushima.webp",
  "870": "assets/heritage/nara.webp",
  "913": "assets/heritage/nikko.webp",
  "916": "assets/heritage/robben-island.webp",
  "972": "assets/heritage/ryukyu-gusuku.webp",
  "1142": "assets/heritage/kii-mountain.webp",
  "1193": "assets/heritage/shiretoko.webp",
  "1246": "assets/heritage/iwami-ginzan.webp",
  "1277": "assets/heritage/hiraizumi.webp",
  "1321": "assets/heritage/le-corbusier-japan.webp",
  "1362": "assets/heritage/ogasawara.webp",
  "1418": "assets/heritage/fuji.webp",
  "1449": "assets/heritage/tomioka-silk.webp",
  "1484": "assets/heritage/meiji-industrial.webp",
  "1495": "assets/heritage/hidden-christian-nagasaki.webp",
  "1535": "assets/heritage/okinoshima.webp",
  "1574": "assets/heritage/amami-okinawa.webp",
  "1593": "assets/heritage/mozu-furuichi.webp",
  "1632": "assets/heritage/jomon.webp",
  "1698": "assets/heritage/sado-gold-mines.webp"
};

// 静的生成した個別ページ(/heritage/sites/{slug})への対応表。
// scripts/heritage-build-data.mjs が assets/heritage/slugs.json を書き出す。
async function loadHeritageSlugMap() {
  try {
    const response = await fetch(heritageSlugMapPath);
    if (!response.ok) return;
    const payload = await response.json();
    heritageSlugMap = payload?.slugs && typeof payload.slugs === "object" ? payload.slugs : {};
    render();
  } catch (error) {
    console.warn("Failed to load heritage slug map", error);
  }
}

function siteDetailPagePath(item) {
  const id = String(item?.unescoId || "").replace(/\D/g, "");
  const slug = heritageSlugMap[id];
  if (!slug) return "";
  // 表示中の言語に対応する個別ページへ送る（日本語は /heritage/sites/... のまま）
  return `${localeAppPath(state.language)}/sites/${encodeURIComponent(slug)}`;
}

async function loadHeritageImageManifest() {
  try {
    const response = await fetch(heritageImageManifestPath);
    if (!response.ok) return;
    const payload = await response.json();
    heritageImageManifest = payload?.images && typeof payload.images === "object" ? payload.images : {};
    // 初期化前に届いた場合は、初期化時の描画で反映されるので何もしない
    if (!appInitialized) return;
    render();
    // 既に開いているダイアログが簡易表示のままなら代表画像に差し替える
    upgradeOpenDialogImage();
  } catch (error) {
    console.warn("Failed to load heritage image manifest", error);
  }
}

/**
 * ダイアログは開いた時点の内容で固定されるため、後から代表画像が届いた場合に
 * 画像部分だけを差し替える（入力中のメモや日付は触らない）。
 */
function upgradeOpenDialogImage() {
  const dialog = $("#siteDialog");
  if (!dialog?.open || !openDialogItemId) return;
  const holder = dialog.querySelector(".dialog-photo");
  if (!holder || !holder.querySelector(".placeholder-visual")) return;
  const item = state.sites.find((siteItem) => siteItem.id === openDialogItemId);
  if (!item) return;
  const presetImage = sitePresetImage(item);
  if (!presetImage) return;
  holder.innerHTML = dialogPresetImageMarkup(presetImage, escapeHtml(localName(item.name)));
}

function categoryClass(item) {
  return ["cultural", "natural", "mixed"].includes(item.category) ? item.category : "mixed";
}

function sitePresetImage(item) {
  const id = String(item.unescoId || "").replace(/\D/g, "");
  return heritageImageManifest[id] || legacySiteImageMap[id];
}

function previewFallbackImage(path) {
  return path?.replace(/^assets\/heritage\//, "/generated-heritage/");
}

/** ダイアログに出す代表画像のHTML（読み込み失敗時は別フォルダの画像へ切り替える） */
function dialogPresetImageMarkup(presetImage, imageAlt) {
  return `<img src="${presetImage}" data-fallback="${previewFallbackImage(presetImage)}" alt="${imageAlt}" onerror="if (this.dataset.fallback && !this.dataset.triedFallback) { this.dataset.triedFallback = 'true'; this.src = this.dataset.fallback; }"><span>${escapeHtml(t("imageReady"))}</span>`;
}

function hasPresetImage(item) {
  return Boolean(sitePresetImage(item));
}

function siteTileImage(item, photo) {
  const presetImage = sitePresetImage(item);
  const imageAlt = escapeHtml(localName(item.name));
  return photo
    ? `<div class="site-tile-image"><img src="${photo}" alt="${imageAlt}"></div>`
    : presetImage
      ? `<div class="site-tile-image has-preset"><img src="${presetImage}" data-fallback="${previewFallbackImage(presetImage)}" alt="${imageAlt}" loading="lazy" onerror="if (this.dataset.fallback && !this.dataset.triedFallback) { this.dataset.triedFallback = 'true'; this.src = this.dataset.fallback; } else { this.closest('.site-tile-image').classList.add('image-error'); this.remove(); }"><span>${escapeHtml(t("imageReady"))}</span></div>`
    : `<div class="site-tile-image placeholder-visual ${categoryClass(item)}" aria-hidden="true"></div>`;
}

function renderList() {
  const query = state.filters.query.trim();
  const sites = filteredSites();
  const shouldShowSites = state.viewMode !== "countries" || state.selectedCountry || query;
  renderDataStatus();
  $("#listSection").hidden = !shouldShowSites;
  if (!shouldShowSites) {
    $("#siteList").innerHTML = "";
    renderPagination(0, 0, 0, false);
    return;
  }
  const totalPages = Math.max(1, Math.ceil(sites.length / pageSize));
  state.page = Math.min(Math.max(state.page, 1), totalPages);
  const startIndex = (state.page - 1) * pageSize;
  const visibleSites = sites.slice(startIndex, startIndex + pageSize);
  const selectedCountry = state.selectedCountry
    ? state.sites.find((item) => countryKey(item) === state.selectedCountry)?.country
    : null;
  $("#listTitle").textContent = query
    ? t("listSearchResults")
    : state.imageSamplesOnly
      ? t("showImageSamples")
    : selectedCountry
      ? t("listSelectedCountry", { country: localName(selectedCountry) })
      : state.viewMode === "visited"
        ? t("listVisited")
        : t("list");
  $("#listCount").textContent = query
    ? t("searchResultCount", { query, count: sites.length })
    : selectedCountry
      ? t("selectedCountrySummary", { country: localName(selectedCountry), count: sites.length })
      : t("listCount", { count: sites.length });
  renderPagination(sites.length, startIndex, visibleSites.length, shouldShowSites);
  if (!visibleSites.length) {
    $("#siteList").innerHTML = `<div class="empty-state">${escapeHtml(t("noResults"))}</div>`;
    return;
  }
  $("#siteList").innerHTML = visibleSites.map((item) => {
    const record = state.records[item.id] || {};
    const photo = state.photos.get(item.id);
    const detailPath = siteDetailPagePath(item);
    return `
      <article class="site-tile ${record.visited ? "visited-tile" : ""}" data-open="${item.id}">
        ${siteTileImage(item, photo)}
        <div class="site-tile-body">
          <h4>${escapeHtml(localName(item.name))}</h4>
          <p>${escapeHtml(localName(item.country))} · ${item.year} · ${escapeHtml(t(item.category))}</p>
          <span>${escapeHtml(record.visited ? t("visitedOnly") : t("notVisited"))}</span>
          ${detailPath ? `<a class="site-detail-link" href="${detailPath}">${escapeHtml(t("detailPage"))}</a>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function scrollToFirstVisibleSite() {
  window.requestAnimationFrame(() => {
    const target = $("#siteList .site-tile") || $("#listSection");
    if (!target) return;
    const toolbarHeight = $(".toolbar")?.getBoundingClientRect().height || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - toolbarHeight - 14;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  });
}

function renderDataStatus() {
  const isSampleData = isSeedDataset(state.sites);
  $("#dataStatus").textContent = state.dataStatus === "loading"
    ? t("dataLoadingStatus")
    : state.dataStatus === "error"
      ? t("dataLoadErrorStatus", { total: state.sites.length })
      : state.dataStatus === "remote"
        ? t("remoteDataStatus", { total: state.sites.length })
        : isSampleData
          ? t("sampleDataStatus", { total: state.sites.length })
          : t("importedDataStatus", { total: state.sites.length });
}

function renderPagination(total, startIndex, visibleCount, shouldShowSites) {
  const pagination = $("#pagination");
  const hasPages = shouldShowSites && total > 0;
  pagination.hidden = !hasPages;
  if (!hasPages) return;
  const end = startIndex + visibleCount;
  $("#pageStatus").textContent = t("pageStatus", { start: startIndex + 1, end, total });
  $("#prevPageBtn").disabled = state.page <= 1;
  $("#nextPageBtn").disabled = end >= total;
}

function dateParts(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? { year: match[1], month: match[2], day: match[3] } : { year: "", month: "", day: "" };
}

function paddedNumber(value) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function dateSelectOptions(type, selectedValue) {
  const today = new Date();
  if (type === "year") {
    const currentYear = today.getFullYear();
    const years = Array.from({ length: currentYear - 1977 }, (_, index) => currentYear - index);
    return `<option value="">${escapeHtml(t("dateYear"))}</option>${years.map((year) => `<option value="${year}" ${String(year) === selectedValue ? "selected" : ""}>${year}</option>`).join("")}`;
  }
  if (type === "month") {
    return `<option value="">${escapeHtml(t("dateMonth"))}</option>${Array.from({ length: 12 }, (_, index) => {
      const value = paddedNumber(index + 1);
      return `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${index + 1}</option>`;
    }).join("")}`;
  }
  return `<option value="">${escapeHtml(t("dateDay"))}</option>${Array.from({ length: 31 }, (_, index) => {
    const value = paddedNumber(index + 1);
    return `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${index + 1}</option>`;
  }).join("")}`;
}

function todayDateValue() {
  const today = new Date();
  return `${today.getFullYear()}-${paddedNumber(today.getMonth() + 1)}-${paddedNumber(today.getDate())}`;
}

function syncDatePartsFromInput() {
  const parts = dateParts($("#visitDateInput").value);
  $("#visitYearSelect").value = parts.year;
  $("#visitMonthSelect").value = parts.month;
  refreshDayOptions(parts.day);
}

function syncDateInputFromParts() {
  const year = $("#visitYearSelect").value;
  const month = $("#visitMonthSelect").value;
  const day = $("#visitDaySelect").value;
  if (year && month && day) $("#visitDateInput").value = `${year}-${month}-${day}`;
}

function refreshDayOptions(selectedDay = $("#visitDaySelect")?.value || "") {
  const year = $("#visitYearSelect").value;
  const month = $("#visitMonthSelect").value;
  const maxDay = daysInMonth(year, month);
  const safeDay = Number(selectedDay) > maxDay ? paddedNumber(maxDay) : selectedDay;
  $("#visitDaySelect").innerHTML = `<option value="">${escapeHtml(t("dateDay"))}</option>${Array.from({ length: maxDay }, (_, index) => {
    const value = paddedNumber(index + 1);
    return `<option value="${value}" ${value === safeDay ? "selected" : ""}>${index + 1}</option>`;
  }).join("")}`;
}

function currentDialogRecordDraft() {
  return {
    date: $("#visitDateInput").value,
    stampType: document.querySelector('input[name="stampType"]:checked')?.value || "classic",
    memo: $("#memoInput").value,
  };
}

async function saveDialogRecord(item) {
  const pendingPhoto = state.pendingPhotos.get(item.id);
  if (pendingPhoto) {
    await putPhoto(item.id, pendingPhoto);
    state.pendingPhotos.delete(item.id);
  }
  const draft = currentDialogRecordDraft();
  state.records[item.id] = {
    ...state.records[item.id],
    visited: true,
    date: draft.date,
    stampType: draft.stampType,
    memo: draft.memo,
    updatedAt: new Date().toISOString()
  };
  state.pendingDialogRecords.delete(item.id);
  saveRecords();
}

async function openTravelJournalMaker(item) {
  if (state.pendingPhotos.has(item.id)) {
    alert(t("createTravelJournalUnsavedPhoto"));
    return;
  }
  if (!state.photos.get(item.id)) {
    alert(t("createTravelJournalDisabled"));
    return;
  }
  saveSites();
  await saveDialogRecord(item);
  const shioriBase = state.language === "ja" ? "/shiori" : "/en/shiori";
  location.href = `${shioriBase}?source=heritage&ids=${encodeURIComponent(item.id)}`;
}
function renderDialog(item) {
  openDialogItemId = item.id;
  const record = { ...(state.records[item.id] || {}), ...(state.pendingDialogRecords.get(item.id) || {}) };
  const savedPhoto = state.photos.get(item.id);
  const pendingPhoto = state.pendingPhotos.get(item.id);
  const photo = pendingPhoto || savedPhoto;
  const canCreateTravelJournal = Boolean(savedPhoto) && !pendingPhoto;
  const shioriNote = pendingPhoto
    ? t("createTravelJournalUnsavedPhoto")
    : canCreateTravelJournal
    ? t("createTravelJournalNote")
    : t("createTravelJournalDisabled");
  const presetImage = sitePresetImage(item);
  const imageAlt = escapeHtml(localName(item.name));
  const detailPath = siteDetailPagePath(item);
  const parts = dateParts(record.date);
  $("#dialogContent").innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-photo">${photo ? `<img src="${photo}" alt="${imageAlt}">` : presetImage ? dialogPresetImageMarkup(presetImage, imageAlt) : `<div class="placeholder-visual ${categoryClass(item)}"></div>`}</div>
      <div>
        <h3>${escapeHtml(localName(item.name))}</h3>
        <p class="site-meta">${escapeHtml(localName(item.country))} · ${item.year} · ${escapeHtml(t(item.region))} · ${escapeHtml(t(item.category))}</p>
        <button id="toggleVisitedBtn" class="${record.visited ? "visited" : ""}" type="button">${escapeHtml(record.visited ? t("markUnvisited") : t("markVisited"))}</button>
        <div class="dialog-fields">
          <label class="date-field">${escapeHtml(t("visitDate"))}
            <div class="date-input-row">
              <input id="visitDateInput" type="date" value="${escapeHtml(record.date || "")}">
              <button id="todayDateBtn" class="ghost mini-button" type="button">${escapeHtml(t("today"))}</button>
            </div>
            <div class="date-select-row">
              <select id="visitYearSelect" aria-label="${escapeHtml(t("dateYear"))}">${dateSelectOptions("year", parts.year)}</select>
              <select id="visitMonthSelect" aria-label="${escapeHtml(t("dateMonth"))}">${dateSelectOptions("month", parts.month)}</select>
              <select id="visitDaySelect" aria-label="${escapeHtml(t("dateDay"))}">${dateSelectOptions("day", parts.day)}</select>
            </div>
          </label>
          <fieldset class="stamp-type-field">
            <legend>${escapeHtml(t("stampType"))}</legend>
            <div class="stamp-type-choices">${stampTypeChoices(stampTypeValue(record))}</div>
          </fieldset>
          <label>${escapeHtml(t("memo"))}<textarea id="memoInput">${escapeHtml(record.memo || "")}</textarea></label>
          <div class="mini-actions">
            <label class="ghost file-label">
              <span>${escapeHtml(t("uploadPhoto"))}</span>
              <input id="photoInput" type="file" accept="image/*">
            </label>
            <button id="saveRecordBtn" type="button">${escapeHtml(t("save"))}</button>
            <button id="removePhotoBtn" class="ghost" type="button">${escapeHtml(t("removePhoto"))}</button>
            <button id="createShioriBtn" class="shiori-link-button" type="button" ${canCreateTravelJournal ? "" : "disabled"}>${escapeHtml(t("createTravelJournal"))}</button>
            ${detailPath ? `<a class="ghost file-label" href="${detailPath}">${escapeHtml(t("detailPage"))}</a>` : ""}
            <a class="ghost file-label" href="${item.officialUrl}" target="_blank" rel="noreferrer">${escapeHtml(t("official"))}</a>
          </div>
          <p class="photo-note">${escapeHtml(t("photoUploadNote"))}</p>
          <p class="shiori-link-note">${escapeHtml(shioriNote)}</p>
        </div>
      </div>
    </div>
  `;
  $("#toggleVisitedBtn").addEventListener("click", () => {
    toggleVisited(item.id);
    renderDialog(item);
  });
  refreshDayOptions(parts.day);
  $("#visitDateInput").addEventListener("change", syncDatePartsFromInput);
  $("#todayDateBtn").addEventListener("click", () => {
    $("#visitDateInput").value = todayDateValue();
    syncDatePartsFromInput();
  });
  ["#visitYearSelect", "#visitMonthSelect"].forEach((selector) => {
    $(selector).addEventListener("change", () => {
      refreshDayOptions();
      syncDateInputFromParts();
    });
  });
  $("#visitDaySelect").addEventListener("change", syncDateInputFromParts);
  $("#saveRecordBtn").addEventListener("click", async () => {
    await saveDialogRecord(item);
    $("#siteDialog").close();
    render();
  });
  $("#createShioriBtn").addEventListener("click", () => {
    openTravelJournalMaker(item);
  });
  $("#removePhotoBtn").addEventListener("click", async () => {
    if (state.pendingPhotos.has(item.id)) {
      state.pendingPhotos.delete(item.id);
      renderDialog(item);
      return;
    }
    await deletePhoto(item.id);
    renderDialog(item);
    render();
  });
  $("#photoInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    state.pendingDialogRecords.set(item.id, currentDialogRecordDraft());
    state.pendingPhotos.set(item.id, dataUrl);
    renderDialog(item);
  });
}

function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1200;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function toggleVisited(id) {
  const record = state.records[id] || {};
  state.records[id] = { ...record, visited: !record.visited, updatedAt: new Date().toISOString() };
  saveRecords();
  render();
}

function resetToSampleSites() {
  state.sites = seedSites;
  state.dataStatus = "sample";
  state.viewMode = "countries";
  state.selectedCountry = "";
  state.imageSamplesOnly = false;
  state.page = 1;
  state.filters = { query: "", region: "all", category: "all", status: "all" };
  $("#searchInput").value = "";
  localStorage.removeItem(siteKey);
  localStorage.setItem(siteSourceKey, "sample");
  render();
}

async function exportBackup(options = {}) {
  const includePhotos = options.includePhotos !== false;
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sites: state.sites,
    records: state.records,
    age: state.age,
    profileName: state.profileName
  };
  if (includePhotos) {
    payload.photos = Object.fromEntries(state.photos.entries());
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = includePhotos
    ? "world-heritage-passport-backup.json"
    : "world-heritage-passport-records-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
  alert(t(includePhotos ? "exported" : "exportedRecords"));
}

function recordUpdatedAt(record) {
  const timestamp = Date.parse(record?.updatedAt || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeRecord(currentRecord = {}, importedRecord = {}) {
  const importedIsNewer = recordUpdatedAt(importedRecord) > recordUpdatedAt(currentRecord);
  const newer = importedIsNewer ? importedRecord : currentRecord;
  const older = importedIsNewer ? currentRecord : importedRecord;
  return {
    ...older,
    ...newer,
    visited: Boolean(currentRecord.visited || importedRecord.visited),
    date: newer.date || older.date || "",
    memo: newer.memo || older.memo || ""
  };
}

function mergeRecords(currentRecords = {}, importedRecords = {}) {
  const merged = { ...currentRecords };
  Object.entries(importedRecords).forEach(([id, importedRecord]) => {
    if (["__proto__", "constructor", "prototype"].includes(id)) return;
    if (!importedRecord || typeof importedRecord !== "object" || Array.isArray(importedRecord)) return;
    merged[id] = merged[id] ? mergeRecord(merged[id], importedRecord) : importedRecord;
  });
  return merged;
}

function mergeSites(currentSites = [], importedSites = []) {
  const merged = new Map(currentSites.filter((item) => item?.id).map((item) => [item.id, item]));
  importedSites.forEach((item) => {
    if (!item?.id) return;
    merged.set(item.id, merged.has(item.id) ? { ...item, ...merged.get(item.id) } : item);
  });
  return [...merged.values()];
}

async function importBackup(file) {
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (Array.isArray(payload)) {
      state.sites = payload;
      state.dataStatus = "imported";
      localStorage.setItem(siteSourceKey, "custom");
      saveSites();
    } else {
      const currentRecords = state.records;
      const importedRecords = payload.records && typeof payload.records === "object" && !Array.isArray(payload.records)
        ? payload.records
        : {};
      state.sites = Array.isArray(payload.sites) ? mergeSites(state.sites, payload.sites) : state.sites;
      state.records = mergeRecords(currentRecords, importedRecords);
      state.age = state.age || payload.age || "";
      state.profileName = state.profileName || String(payload.profileName || "");
      state.dataStatus = "imported";
      localStorage.setItem(ageKey, state.age);
      localStorage.setItem(profileNameKey, state.profileName);
      localStorage.setItem(siteSourceKey, "custom");
      saveSites();
      saveRecords();
      if (payload.photos && typeof payload.photos === "object" && !Array.isArray(payload.photos)) {
        await Promise.all(Object.entries(payload.photos).map(([id, data]) => {
          if (typeof data !== "string") return Promise.resolve();
          const importedIsNewer = recordUpdatedAt(importedRecords[id]) > recordUpdatedAt(currentRecords[id]);
          return !state.photos.has(id) || importedIsNewer ? putPhoto(id, data) : Promise.resolve();
        }));
      }
    }
    await loadPhotos();
    render();
    alert(t("imported"));
  } catch {
    alert(t("importError"));
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function bindEvents() {
  $("#languageSelect").value = state.language;
  $("#languageSelect").addEventListener("change", (event) => setLanguage(event.target.value));
  const showVisitedStamps = () => {
    state.viewMode = "visited";
    state.selectedCountry = "";
    state.imageSamplesOnly = false;
    state.page = 1;
    state.filters.status = "visited";
    render();
    $(".toolbar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.viewMode = button.dataset.view;
      state.selectedCountry = "";
      state.imageSamplesOnly = false;
      state.page = 1;
      if (state.viewMode === "visited") state.filters.status = "visited";
      if (state.viewMode !== "visited" && state.filters.status === "visited") state.filters.status = "all";
      render();
    });
  });
  $("#ageInput").addEventListener("input", (event) => {
    state.age = event.target.value;
    localStorage.setItem(ageKey, state.age);
  });
  $("#profileNameInput")?.addEventListener("input", (event) => {
    state.profileName = event.target.value.trim();
    localStorage.setItem(profileNameKey, state.profileName);
  });
  $("#homeCitySelect")?.addEventListener("change", (event) => {
    state.homeCity = event.target.value;
    localStorage.setItem(homeCityKey, state.homeCity);
    renderTravelDistance();
  });
  $("#searchInput").addEventListener("input", (event) => {
    state.filters.query = event.target.value;
    state.imageSamplesOnly = false;
    state.page = 1;
    render();
  });
  $("#regionFilter").addEventListener("change", (event) => {
    state.filters.region = event.target.value;
    state.imageSamplesOnly = false;
    state.page = 1;
    render();
  });
  $("#categoryFilter").addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    state.imageSamplesOnly = false;
    state.page = 1;
    render();
  });
  $("#statusFilter").addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    state.imageSamplesOnly = false;
    state.page = 1;
    render();
  });
  $("#countryIndex").addEventListener("click", (event) => {
    const row = event.target.closest("[data-country]");
    if (!row) return;
    state.selectedCountry = state.selectedCountry === row.dataset.country ? "" : row.dataset.country;
    state.viewMode = "countries";
    state.imageSamplesOnly = false;
    state.page = 1;
    render();
    if (state.selectedCountry) {
      scrollToFirstVisibleSite();
    }
  });
  $("#regionMap").addEventListener("click", (event) => {
    const button = event.target.closest("[data-region-memorial]");
    if (!button) return;
    openRegionMemorialDialog(button.dataset.regionMemorial);
  });
  $("#clearCountryBtn").addEventListener("click", () => {
    state.selectedCountry = "";
    state.imageSamplesOnly = false;
    render();
  });
  $("#siteList").addEventListener("click", (event) => {
    // 個別ページへのリンクを押したときは記録ダイアログを開かない
    if (event.target.closest("a")) return;
    const openId = event.target.closest("[data-open], .site-tile")?.dataset.open;
    if (openId) {
      const item = state.sites.find((siteItem) => siteItem.id === openId);
      renderDialog(item);
      $("#siteDialog").showModal();
    }
  });
  $("#stampGrid").addEventListener("click", (event) => {
    const openId = event.target.closest("[data-open]")?.dataset.open;
    if (!openId) return;
    const item = state.sites.find((siteItem) => siteItem.id === openId);
    if (!item) return;
    renderDialog(item);
    $("#siteDialog").showModal();
  });
  $("#viewAllStampsBtn").addEventListener("click", showVisitedStamps);
  $("#createOwnPassportBtn")?.addEventListener("click", dismissSamplePassport);
  $("#memorialBtn")?.addEventListener("click", openMemorialDialog);
  $("#achievementShareXBtn")?.addEventListener("click", handleAchievementShareX);
  $("#achievementShareImageBtn")?.addEventListener("click", handleAchievementShareImage);
  $("#memorialDialog")?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-memorial]")) {
      $("#memorialDialog").close();
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("#viewAllStampsBtn")) {
      showVisitedStamps();
    }
  });
  $("#prevPageBtn").addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderList();
  });
  $("#nextPageBtn").addEventListener("click", () => {
    state.page += 1;
    renderList();
  });
  $("#exportBtn").addEventListener("click", () => exportBackup({ includePhotos: true }));
  $("#exportRecordsBtn")?.addEventListener("click", () => exportBackup({ includePhotos: false }));
  $("#cookieAcceptBtn")?.addEventListener("click", () => {
    localStorage.setItem(cookieNoticeKey, "true");
    $("#cookieBanner").hidden = true;
  });
  $("#importInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importBackup(file);
    event.target.value = "";
  });
}

function render() {
  translateStaticText();
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.viewMode);
  });
  const cookieBanner = $("#cookieBanner");
  if (cookieBanner) {
    cookieBanner.hidden = localStorage.getItem(cookieNoticeKey) === "true";
  }
  renderFilters();
  renderSearchContext();
  renderStats();
  renderRegions();
  renderStamps();
  renderCountryIndex();
  renderList();
}

let openingPendingSite = false;

async function tryOpenPendingSite() {
  if (!pendingOpenUnescoId || openingPendingSite) return;
  const item = state.sites.find((siteItem) => siteUnescoId(siteItem) === pendingOpenUnescoId);
  if (!item) return;
  openingPendingSite = true;
  // 個別ページのボタンから来た場合、代表画像の一覧が届く前に開くと簡易表示に
  // なってしまうため、少しだけ待ってから開く（遅い回線でも開けるよう上限あり）。
  await Promise.race([
    heritageImageManifestReady,
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
  openingPendingSite = false;
  if (!pendingOpenUnescoId) return;
  pendingOpenUnescoId = null;
  renderDialog(item);
  $("#siteDialog").showModal();
  const url = new URL(location.href);
  url.searchParams.delete("open");
  history.replaceState(null, "", url);
}

// 代表画像の一覧は他の読み込みを待たずに取得を始める
heritageImageManifestReady = loadHeritageImageManifest();

loadPhotos().finally(() => {
  window.__passportFallbackAbort?.();
  bindEvents();
  appInitialized = true;
  render();
  tryOpenPendingSite();
  loadHeritageSlugMap();
  loadRemoteWorldHeritageSites();
  window.__passportReady = true;
});
