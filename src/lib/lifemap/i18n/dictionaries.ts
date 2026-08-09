// 人生体験マップ 多言語辞書
// 対応言語: 日本語 / English / 한국어 / 简体中文 / 繁體中文 / Español / Русский

export type LangCode = "ja" | "en" | "ko" | "zh-CN" | "zh-TW" | "es" | "ru";

export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "es", label: "Español" },
  { code: "ru", label: "Русский" },
];

export interface LifeMapDict {
  app: {
    title: string;
    subtitle: string;
    backLink: string;
    desc: string;
    privacy: string;
  };
  entries: {
    sectionTitle: string;
    replayBtn: string;
  };
  form: {
    sectionTitle: string;
    gpsSuccess: string;
    gpsSuccessHint: string;
    noGps: string;
    mapMode: string;
    prefMode: string;
    noneMode: string;
    mapTapHint: string;
    mapTapDone: string;
    prefLabel: string;
    prefSelect: string;
    catLabel: string;
    catRequired: string;
    dateLabel: string;
    memoLabel: string;
    memoOptional: string;
    memoPlaceholder: string;
    locationNameLabel: string;
    locationNameOptional: string;
    locationNamePlaceholder: string;
    precisionLabel: string;
    precisionExact: string;
    precisionApprox: string;
    precisionHint: string;
    saveBtn: string;
    saving: string;
    errPhoto: string;
    errPref: string;
    errMapTap: string;
    errCoords: string;
    errSave: string;
    coordsMode: string;
    coordsLatLabel: string;
    coordsLngLabel: string;
    coordsHint: string;
    editCategoryBtn: string;
  };
  card: {
    showOnMap: string;
    deleteAria: string;
    approxLocation: string;
    prefectureOnly: string;
    revisitLink: string;
    editBtn: string;
    selectBtn: string;
    selectedBtn: string;
    /** その記録1件だけでAI旅行記メーカーへ渡すボタン */
    journalBtn: string;
    /** 写真が無くて上のボタンが押せないときの補足（旅行単位でなら作れる） */
    journalBtnDisabledHint: string;
  };
  edit: {
    title: string;
    saveBtn: string;
    cancelBtn: string;
    closeAria: string;
    photoLocked: string;
    prefDetecting: string;
    prefDetected: string; // {{name}} placeholder
    precisionWarn: string;
  };
  list: {
    timeline: string;
    prefecture: string;
    /** 一覧の各ボタンが何を作るものかの説明。記録が1件以上あるときだけ出す */
    journalHint: string;
  };
  country: {
    label: string;
  };
  timeline: {
    newest: string;
    oldest: string;
    empty: string;
    /** 旅行グループの見出しに置く、AI旅行記メーカーへのリンク文言 */
    tripJournalBtn: string;
    /** 1回の旅行の記録がAI生成の上限を超えるときの注記 */
    tripLimitNote: string; // {{max}} placeholder
  };
  prefecture: {
    backLink: string;
    countTemplate: string; // e.g. "{{count}}件"
    all: string;
    noFiltered: string;
    noEntries: string;
  };
  backup: {
    exportBtn: string;
    importBtn: string;
    exportEmpty: string;
    exportSuccess: string;
    exportError: string;
    importSuccess: string; // {{count}} placeholder
    importError: string;
    hint: string;
  };
  share: {
    // UI
    buttonLabel: string;
    emptyHint: string;
    modalTitle: string;
    closeAria: string;
    tabMap: string;
    tabStats: string;
    rangeAll: string;
    rangeYear: string;
    saveBtn: string;
    shareImageBtn: string;
    xBtn: string;
    savedMsg: string;
    saveError: string;
    longPressHint: string;
    privacyNote: string;
    noJapanNote: string;
    postText: string; // {{count}} placeholder
    hashtags: string; // カンマ区切り（#は不要）
    // 画像内に描画する文言
    cardMapTitle: string;
    cardStatsTitle: string;
    cardPrefLabel: string;
    cardTotalLabel: string;
    cardCountValue: string; // {{count}} placeholder
    cardCountUnit: string;
    cardCategoryLabel: string;
    cardSinceLabel: string;
    cardDurationYM: string; // {{years}} / {{months}} placeholder
    cardDurationM: string; // {{months}} placeholder
    cardRangeYear: string;
    cardRangeAll: string;
    cardOthers: string; // {{count}} placeholder
  };
  photo: {
    selectBtn: string;
    cameraBtn: string;
    bulkBtn: string;
    bulkHint: string;
    loading: string;
    previewAlt: string;
  };
  replay: {
    title: string;
    closeAria: string;
    choosePeriod: string;
    chooseCategory: string;
    allCategories: string;
    all: string;
    period1y: string;
    period2y: string;
    period3y: string;
    noEntries: string;
    changePeriodBtn: string;
    changePeriod: string;
    pauseAria: string;
    playAria: string;
  };
  map: {
    loading: string;
    newPin: string;
    approxSuffix: string;
    revisitLink: string;
    googleMapsLink: string;
  };
  errors: {
    loadFailed: string;
    deleteFailed: string;
    photoError: string;
  };
  drive: {
    planBtn: string;
    hint: string;      // {{count}} placeholder
    clearBtn: string;
    selectHint: string;
  };
  confirm: {
    delete: string;
  };
  categories: {
    travel: string;
    fishing: string;
    food: string;
    dog: string;
    onsen: string;
    castle: string;
    friends: string;
    family: string;
    other: string;
    other1: string;
    other2: string;
    other3: string;
  };
  disclaimer: string;
  /** ページ下部の「使い方」「よくある質問」セクション */
  guide: {
    howtoTitle: string;
    howtoLead: string;
    steps: { title: string; body: string }[];
    faqTitle: string;
    faqLead: string;
    faqs: { q: string; a: string }[];
  };
  heritageLink: string;
  /** ヘッダー・ヒーロー・フッター等、guideセクション以外の固定UI文言 */
  landing: {
    followX: string;
    journalName: string;
    recordCta: string;
    heroEyebrow: string;
    heroHeadline1: string;
    heroHeadline2: string;
    since: string;
    demoLocation1: string;
    demoLocation2: string;
    journalBannerTitle: string;
    journalBannerBody: string;
    journalBannerCta: string;
    journalWithSelectionCta: string;
    queueProgress: string; // {{current}} / {{total}} placeholder
    noticeAccordionTitle: string;
    noticeTitle: string;
    noticeBody: string;
    dataStorageTitle: string;
    dataStorageBody1: string;
    dataStorageBody2: string;
    dataStorageBody3: string;
    footerPrivacyLink: string;
    footerCookieLink: string;
    footerBrandName: string;
  };
}

export const translations: Record<LangCode, LifeMapDict> = {
  ja: {
    app: {
      title: "人生体験マップ",
      subtitle: "写真で残す、あなたの思い出と地図",
      backLink: "🚗 AI ドライブプランナー",
      desc: "旅行、釣り、食事、犬連れ、温泉、お城、お友達と、家族など、人生の体験を写真と場所で記録できます。",
      privacy:
        "記録はすべてお使いの端末内（ブラウザ）にのみ保存されます。非公開で、自分だけが振り返るためのものです。外部への送信は行いません。",
    },
    entries: {
      sectionTitle: "記録した体験",
      replayBtn: "思い出を振り返る",
    },
    form: {
      sectionTitle: "体験を記録する",
      gpsSuccess: "写真から位置情報を取得しました。地図のピンで場所をご確認ください。",
      gpsSuccessHint: "保存前に、必要に応じて下の「場所の保存精度」をご調整ください。",
      noGps: "位置情報が見つかりませんでした。場所の登録方法を選んでください。",
      mapMode: "地図から場所を選ぶ",
      prefMode: "都道府県だけ登録する",
      noneMode: "場所情報なしで保存する",
      mapTapHint: "👉 右（下）の地図をタップして場所を指定してください。",
      mapTapDone: "地図で場所を指定しました。",
      prefLabel: "都道府県",
      prefSelect: "選択してください",
      catLabel: "カテゴリ",
      catRequired: "*必須",
      dateLabel: "日付",
      memoLabel: "メモ",
      memoOptional: "（任意）",
      memoPlaceholder: "例: 妻と日帰りで行った。海鮮丼がおいしかった。また行きたい。",
      locationNameLabel: "場所の名前",
      locationNameOptional: "（任意）",
      locationNamePlaceholder: "例: 上田城、城ヶ島港",
      precisionLabel: "場所の保存精度",
      precisionExact: "正確な場所",
      precisionApprox: "おおまかな場所",
      precisionHint:
        "釣り場や自宅近くなど、正確な位置を残したくない場合は「おおまかな場所」を選べます（都道府県情報は引き続き保存されます）。",
      saveBtn: "この体験を保存する",
      saving: "保存中...",
      errPhoto: "写真を選択してください。",
      errPref: "都道府県を選択してください。",
      errMapTap: "地図をタップして場所を指定してください。",
      errCoords: "緯度・経度を入力してください。",
      errSave: "保存に失敗しました。",
      coordsMode: "緯度・経度を直接入力",
      coordsLatLabel: "緯度（Latitude）",
      coordsLngLabel: "経度（Longitude）",
      coordsHint: "Google マップで場所を右クリック → 表示された数字をコピーして入力してください。「35.796402, 139.531056」のようにコンマ区切りのまま貼り付ければ、緯度と経度に自動で振り分けられます。",
      editCategoryBtn: "カテゴリ名を変更（絵文字も使えます）",
    },
    card: {
      showOnMap: "地図で見る",
      deleteAria: "削除",
      approxLocation: "おおまかな場所",
      prefectureOnly: "都道府県のみ",
      revisitLink: "この場所へ再訪プラン作成",
      editBtn: "編集",
      selectBtn: "ドライブに選ぶ",
      selectedBtn: "選択中",
      journalBtn: "この記録で作る",
      journalBtnDisabledHint: "写真を保存すると、この記録だけで作れます。",
    },
    edit: {
      title: "記録を編集",
      saveBtn: "変更を保存",
      cancelBtn: "キャンセル",
      closeAria: "閉じる",
      photoLocked: "写真は変更できません。写真を変えたい場合は、この記録を削除して登録し直してください。",
      prefDetecting: "座標から都道府県を判定しています…",
      prefDetected: "座標から「{{name}}」と判定しました。",
      precisionWarn: "「おおまかな場所」で保存すると、緯度・経度は約1km単位に丸められます。正確な位置を残したい場合は「正確な場所」を選んでください。",
    },
    list: {
      timeline: "時系列",
      prefecture: "地域別",
      journalHint: "写真と記録から、旅行記とSNS投稿文を作れます。",
    },
    country: {
      label: "居住国",
    },
    timeline: {
      newest: "新しい順",
      oldest: "古い順",
      empty: "まだ記録がありません。写真を追加して最初の思い出を記録しましょう。",
      tripJournalBtn: "この旅行で作る",
      tripLimitNote: "古い順に先頭{{max}}件が最初に選ばれます",
    },
    prefecture: {
      backLink: "地域一覧に戻る",
      countTemplate: "{{count}}件",
      all: "すべて",
      noFiltered: "該当する記録がありません。",
      noEntries: "まだ記録がありません。",
    },
    backup: {
      exportBtn: "バックアップを保存",
      importBtn: "バックアップから復元",
      exportEmpty: "保存する記録がありません。",
      exportSuccess: "バックアップを保存しました。",
      exportError: "バックアップの保存に失敗しました。",
      importSuccess: "{{count}}件の記録を復元しました。",
      importError: "復元に失敗しました。",
      hint: "全記録を1つのファイルに保存できます。機種変更や別端末への移行、ブラウザのデータ削除に備えてときどき保存してください。また、このファイルをお子様やご家族に渡すことで、思い出のアルバムとして引き継ぐこともできます。\n\n読み込み（インポート）時は、すでに保存されている記録と自動でマージされます。スマホとPCなど複数の端末で記録した場合も、それぞれのバックアップを読み込むことで、両方の記録をまとめることができます。",
    },
    photo: {
      selectBtn: "写真を選ぶ",
      cameraBtn: "カメラで撮影",
      bulkBtn: "まとめて追加（複数枚）",
      bulkHint: "同じ場所・同じ日の写真は1枚を目安にしてください。位置情報（GPS）が記録されていない写真は、地図上でタップして場所を指定できます。",
      loading: "写真を読み込み中...",
      previewAlt: "アップロードした写真のプレビュー",
    },
    replay: {
      title: "思い出を振り返る",
      closeAria: "閉じる",
      choosePeriod: "振り返る期間を選んでください",
      chooseCategory: "カテゴリで絞り込む",
      allCategories: "すべて",
      all: "すべて",
      period1y: "直近1年",
      period2y: "直近2年",
      period3y: "直近3年",
      noEntries: "この期間の記録はありません。",
      changePeriodBtn: "期間を選び直す",
      changePeriod: "期間変更",
      pauseAria: "一時停止",
      playAria: "再生",
    },
    map: {
      loading: "地図を読み込み中...",
      newPin: "新しい記録の場所",
      approxSuffix: "（おおまかな場所）",
      revisitLink: "この場所へ再訪プラン作成",
      googleMapsLink: "Google マップで開く",
    },
    errors: {
      loadFailed: "記録の読み込みに失敗しました",
      deleteFailed: "削除に失敗しました。",
      photoError: "写真の読み込みに失敗しました。別の写真をお試しください。",
    },
    drive: {
      planBtn: "思い出ドライブを計画する",
      hint: "{{count}}件選択中",
      clearBtn: "選択を解除",
      selectHint: "日本の記録を選んで思い出のドライブルートを計画できます",
    },
    confirm: {
      delete: "この記録を削除しますか？",
    },
    categories: {
      travel: "旅行",
      fishing: "釣り",
      food: "食事",
      dog: "犬連れ",
      onsen: "温泉",
      castle: "お城",
      friends: "お友達と",
      family: "家族",
      other: "その他",
      other1: "その他①",
      other2: "その他②",
      other3: "その他③",
    },
    disclaimer: "本サービスは個人の記録目的で提供されます。記録データはすべてお使いの端末内にのみ保存され、外部サーバーへの送信は行いません。本サービスの利用により生じた損害について、運営者は一切の責任を負いません。コンテンツは予告なく変更・終了する場合があります。",
    share: {
      buttonLabel: "シェア画像を作る",
      emptyHint: "記録してから使えます",
      modalTitle: "シェア画像を作る",
      closeAria: "閉じる",
      tabMap: "都道府県制覇マップ",
      tabStats: "体験統計カード",
      rangeAll: "全期間",
      rangeYear: "今年",
      saveBtn: "画像を保存",
      shareImageBtn: "画像ごとシェア",
      xBtn: "Xでシェア",
      savedMsg: "画像を保存しました。",
      saveError: "画像の保存に失敗しました。もう一度お試しください。",
      longPressHint: "保存できない場合は、上の画像を長押し（パソコンでは右クリック）して保存してください。",
      privacyNote: "画像に含まれるのは件数と都道府県の色分けだけです。写真・メモ・地名は含まれません。",
      noJapanNote: "日本国内の記録がないため、都道府県マップは作成できません。体験統計カードをご利用ください。",
      postText: "人生体験マップで思い出を記録中📍 これまでに{{count}}件の体験を記録しました",
      hashtags: "人生体験マップ,ライフログ",
      cardMapTitle: "都道府県 制覇マップ",
      cardStatsTitle: "体験の記録",
      cardPrefLabel: "訪問した都道府県",
      cardTotalLabel: "記録した体験",
      cardCountValue: "{{count}}件",
      cardCountUnit: "件",
      cardCategoryLabel: "カテゴリ別の記録数",
      cardSinceLabel: "記録開始",
      cardDurationYM: "{{years}}年{{months}}か月",
      cardDurationM: "{{months}}か月",
      cardRangeYear: "今年",
      cardRangeAll: "全期間",
      cardOthers: "ほか {{count}}件",
    },
    guide: {
      howtoTitle: "使い方",
      howtoLead:
        "写真を1枚選ぶところから始められます。登録も費用も不要で、記録はすべてお使いの端末内だけに保存されます。",
      steps: [
        {
          title: "写真を選ぶ",
          body: "「写真を選ぶ」または「カメラで撮影」から1枚選びます。「まとめて追加」を使えば複数枚を続けて登録できます。写真は端末内で長辺1600pxのJPEGに自動圧縮され、外部へ送信されることはありません。",
        },
        {
          title: "場所と日付を確認する",
          body: "写真に位置情報（Exif）が入っていれば、場所と日付が自動で入ります。入っていない場合は「地図から場所を選ぶ」「都道府県だけ登録する」「場所情報なしで保存する」から選べます。自宅などを正確に残したくないときは、保存精度を「おおよその場所」に切り替えられます。",
        },
        {
          title: "カテゴリとメモをつけて保存",
          body: "旅行・釣り・食事・犬連れ・温泉・お城など全12カテゴリから選び、日付・メモ・場所の名前を添えて保存します。「その他①〜③」は名前を自由に変更できるので、キャンプや登山など自分専用のカテゴリを作れます。",
        },
        {
          title: "地図と一覧で振り返る",
          body: "保存した体験は地図のピンと一覧の両方に並びます。一覧は「時系列」と「エリア別」で切り替えられ、「思い出を振り返る」ではスライドショーのように写真を流して見返せます。",
        },
        {
          title: "シェア画像を作って投稿する",
          body: "「シェア画像を作る」から、都道府県制覇マップと体験統計カードの2種類の画像（1200×630）を作れます。画像に入るのは記録件数と塗りつぶした都道府県だけで、写真・メモ・地名は含まれません。保存してXへ投稿できます。",
        },
        {
          title: "定期的にバックアップする",
          body: "データは端末内にしかありません。「バックアップ書き出し」でJSONファイルとして保存しておけば、機種変更やブラウザを変えたときに「バックアップ復元」から元に戻せます。",
        },
      ],
      faqTitle: "よくある質問",
      faqLead: "はじめての方からよくいただく質問をまとめました。",
      faqs: [
        {
          q: "記録したデータはどこに保存されますか？",
          a: "お使いの端末のブラウザ内（IndexedDB）にのみ保存されます。写真・メモ・位置情報を当サイトのサーバーへ送ることはなく、他の人に公開されることもありません。",
        },
        {
          q: "会員登録は必要ですか？ 料金はかかりますか？",
          a: "どちらも不要です。登録なし・無料でそのままお使いいただけます。",
        },
        {
          q: "機種変更やブラウザを変えるとデータはどうなりますか？",
          a: "端末やブラウザが変わると引き継がれません。ブラウザの「閲覧データの削除」でも消えてしまいます。「バックアップ書き出し」でファイルを保存し、新しい端末の同じページで「バックアップ復元」から読み込んでください。",
        },
        {
          q: "写真に位置情報が入っていないときはどうすればいいですか？",
          a: "地図をタップして場所を指定するか、都道府県だけを選んで登録できます。場所を残したくない場合は「場所情報なしで保存する」も選べます。",
        },
        {
          q: "シェア画像に写真やメモは入りますか？",
          a: "入りません。画像に描かれるのは記録件数・カテゴリ別の件数・訪問した都道府県の塗りつぶしだけです。写真・メモ・場所の名前・座標は一切含まれません。画像の生成もすべてブラウザ内で完結します。",
        },
        {
          q: "シェア画像はどうやってXに投稿しますか？",
          a: "「画像を保存」でPNGを保存し、「Xでシェア」で開いた投稿画面に添付してください。スマートフォンでは「画像ごとシェア」から、画像を付けたまま共有メニューに渡せます。",
        },
        {
          q: "日本以外に住んでいますが使えますか？",
          a: "使えます。地図は世界中に対応し、表示言語は7言語から選べます。都道府県制覇マップは日本国内の記録があるときだけ表示され、ないときは体験統計カードをお使いいただけます。",
        },
        {
          q: "記録は何件まで保存できますか？",
          a: "上限は端末の空き容量によります。写真は保存時に自動で圧縮されるため1件あたりの容量は抑えられていますが、容量が不足すると保存できなくなるため、こまめなバックアップをおすすめします。",
        },
      ],
    },
    heritageLink: "世界遺産パスポート",
    landing: {
      followX: "公式X（@AIDRIVEPLAN）をフォロー",
      journalName: "AI旅行記メーカー",
      recordCta: "体験を記録",
      heroEyebrow: "非公開のライフログ",
      heroHeadline1: "写真と場所で、",
      heroHeadline2: "人生の体験を残す。",
      since: "Since 2026年6月",
      demoLocation1: "神奈川県",
      demoLocation2: "東京都",
      journalBannerTitle: "保存した写真とメモから、SNS投稿文・アイキャッチ画像を作る",
      journalBannerBody: "人生体験マップの記録を読み込み、旅行後の思い出整理に使えます。",
      journalBannerCta: "AI旅行記へ",
      journalWithSelectionCta: "選択した記録でSNS投稿",
      queueProgress: "{{current}} / {{total}} 枚目を処理中",
      noticeAccordionTitle: "ご利用上の注意・データの保存について",
      noticeTitle: "ご利用上の注意",
      noticeBody: "・本サイトのソースコード・デザイン・コンテンツの無断複製・転用・再配布を禁止します。",
      dataStorageTitle: "データの保存について",
      dataStorageBody1: "・登録した写真・場所・メモ等のデータは、お使いの端末のブラウザ内（ローカルストレージ）にのみ保存されます。サーバーへの送信・クラウドへのバックアップは行われません。",
      dataStorageBody2: "・ブラウザの「閲覧データ削除」「キャッシュクリア」、端末の初期化・機種変更、ブラウザの変更等により、データが消失する場合があります。",
      dataStorageBody3: "・データの消失・破損に関して、当サービスは一切の責任を負いかねます。大切なデータは定期的に「バックアップ書き出し」ボタンでファイルに保存しておくことをお勧めします。",
      footerPrivacyLink: "プライバシーポリシー",
      footerCookieLink: "Cookieについて",
      footerBrandName: "AIドライブプランナー",
    },
  },

  en: {
    app: {
      title: "Life Experience Map",
      subtitle: "Your memories, pinned on a map",
      backLink: "🚗 AI Drive Planner",
      desc: "Record life experiences — travel, fishing, dining, dog trips, hot springs, castles, outings with friends, family memories and more — with photos and locations.",
      privacy:
        "All records are stored only on your device (browser). They are private and for your personal reflection only. Nothing is sent externally.",
    },
    entries: {
      sectionTitle: "Recorded Experiences",
      replayBtn: "View memories",
    },
    form: {
      sectionTitle: "Record an Experience",
      gpsSuccess: "Location found in photo. Check the map pin to confirm.",
      gpsSuccessHint: "Before saving, adjust \"Location precision\" below if needed.",
      noGps: "No location found in photo. Choose how to register the place.",
      mapMode: "Pick location on map",
      prefMode: "Register prefecture only",
      noneMode: "Save without location",
      mapTapHint: "👉 Tap the map (right/below) to set the location.",
      mapTapDone: "Location set on map.",
      prefLabel: "Prefecture",
      prefSelect: "Select...",
      catLabel: "Category",
      catRequired: "*Required",
      dateLabel: "Date",
      memoLabel: "Memo",
      memoOptional: "(optional)",
      memoPlaceholder: "e.g. Day trip with my wife. The seafood bowl was amazing. Want to go back.",
      locationNameLabel: "Location name",
      locationNameOptional: "(optional)",
      locationNamePlaceholder: "e.g. Ueda Castle, Jōgashima Port",
      precisionLabel: "Location precision",
      precisionExact: "Exact location",
      precisionApprox: "Approximate location",
      precisionHint:
        "Choose \"Approximate\" to avoid saving precise coordinates (e.g. fishing spots, near home). Prefecture info is always saved.",
      saveBtn: "Save this experience",
      saving: "Saving...",
      errPhoto: "Please select a photo.",
      errPref: "Please select a prefecture.",
      errMapTap: "Please tap the map to set a location.",
      errCoords: "Please enter latitude and longitude.",
      errSave: "Failed to save.",
      coordsMode: "Enter coordinates (lat/lng)",
      coordsLatLabel: "Latitude",
      coordsLngLabel: "Longitude",
      coordsHint: "Right-click a spot in Google Maps → copy the numbers shown. You can paste the whole comma-separated pair (e.g. 35.796402, 139.531056) and it will be split into latitude and longitude automatically.",
      editCategoryBtn: "Rename (emoji OK)",
    },
    card: {
      showOnMap: "View on map",
      deleteAria: "Delete",
      approxLocation: "Approx. location",
      prefectureOnly: "Prefecture only",
      revisitLink: "Plan a revisit here",
      editBtn: "Edit",
      selectBtn: "Select for drive",
      selectedBtn: "Selected",
      journalBtn: "Use this record",
      journalBtnDisabledHint: "Save a photo to build one from this record alone.",
    },
    edit: {
      title: "Edit record",
      saveBtn: "Save changes",
      cancelBtn: "Cancel",
      closeAria: "Close",
      photoLocked: "The photo cannot be changed. To use a different photo, delete this record and add it again.",
      prefDetecting: "Looking up the region from the coordinates…",
      prefDetected: "Detected “{{name}}” from the coordinates.",
      precisionWarn: "Saving as an approximate location rounds the coordinates to about 1 km. Choose “Exact location” to keep the precise position.",
    },
    list: {
      timeline: "Timeline",
      prefecture: "By area",
      journalHint: "Turn your photos and records into a travel journal and a social post.",
    },
    country: {
      label: "Home country",
    },
    timeline: {
      newest: "Newest first",
      oldest: "Oldest first",
      empty: "No records yet. Add a photo to save your first memory.",
      tripJournalBtn: "Use this trip",
      tripLimitNote: "The first {{max}} entries, oldest first, are selected to start.",
    },
    prefecture: {
      backLink: "← Back to list",
      countTemplate: "{{count}} entries",
      all: "All",
      noFiltered: "No matching records.",
      noEntries: "No records yet.",
    },
    backup: {
      exportBtn: "Save backup",
      importBtn: "Restore backup",
      exportEmpty: "No records to save.",
      exportSuccess: "Backup saved.",
      exportError: "Failed to save backup.",
      importSuccess: "Restored {{count}} records.",
      importError: "Restore failed.",
      hint: "Save all records to a single file. Do this occasionally in case of device changes or browser data clearing. You can also share this file with your children or family as a keepsake album to pass down.",
    },
    photo: {
      selectBtn: "Select photo",
      cameraBtn: "Take photo",
      bulkBtn: "Add multiple photos",
      bulkHint: "Aim for one photo per location per day. If your photo has no GPS data, you can tap the map to set the location.",
      loading: "Loading photo...",
      previewAlt: "Preview of uploaded photo",
    },
    replay: {
      title: "View Memories",
      closeAria: "Close",
      choosePeriod: "Select a time period",
      chooseCategory: "Filter by category",
      allCategories: "All",
      all: "All time",
      period1y: "Past 1 year",
      period2y: "Past 2 years",
      period3y: "Past 3 years",
      noEntries: "No records for this period.",
      changePeriodBtn: "Choose period",
      changePeriod: "Change period",
      pauseAria: "Pause",
      playAria: "Play",
    },
    map: {
      loading: "Loading map...",
      newPin: "New entry location",
      approxSuffix: "(approx. location)",
      revisitLink: "Plan a revisit here",
      googleMapsLink: "Open in Google Maps",
    },
    errors: {
      loadFailed: "Failed to load records",
      deleteFailed: "Failed to delete.",
      photoError: "Failed to load photo. Please try another photo.",
    },
    drive: {
      planBtn: "Plan a memory drive",
      hint: "{{count}} selected",
      clearBtn: "Clear selection",
      selectHint: "Select Japan entries to plan a drive route through your memories",
    },
    confirm: {
      delete: "Delete this record?",
    },
    categories: {
      travel: "Travel",
      fishing: "Fishing",
      food: "Dining",
      dog: "Dog trip",
      onsen: "Hot spring",
      castle: "Castle",
      friends: "With friends",
      family: "Family",
      other: "Other",
      other1: "Custom 1",
      other2: "Custom 2",
      other3: "Custom 3",
    },
    disclaimer: "This service is provided for personal recording purposes. All data is stored solely on your device and is never sent to external servers. The operator accepts no responsibility for any damages arising from use of this service. Content may be changed or discontinued without notice.",
    share: {
      buttonLabel: "Create a share image",
      emptyHint: "Available once you add a record",
      modalTitle: "Create a share image",
      closeAria: "Close",
      tabMap: "Prefecture map",
      tabStats: "Stats card",
      rangeAll: "All time",
      rangeYear: "This year",
      saveBtn: "Save image",
      shareImageBtn: "Share image",
      xBtn: "Share on X",
      savedMsg: "Image saved.",
      saveError: "Could not save the image. Please try again.",
      longPressHint: "If the download does not start, long-press the image above (right-click on a computer) to save it.",
      privacyNote: "The image contains only record counts and the coloured prefectures. Photos, notes and place names are never included.",
      noJapanNote: "No records in Japan yet, so the prefecture map is unavailable. Please use the stats card instead.",
      postText: "Recording my memories on the Life Experience Map 📍 {{count}} experiences logged so far",
      hashtags: "LifeMap,LifeLog",
      cardMapTitle: "Japan prefecture map",
      cardStatsTitle: "My experiences",
      cardPrefLabel: "Prefectures visited",
      cardTotalLabel: "Experiences recorded",
      cardCountValue: "{{count}}",
      cardCountUnit: "records",
      cardCategoryLabel: "By category",
      cardSinceLabel: "Since",
      cardDurationYM: "{{years}}y {{months}}m",
      cardDurationM: "{{months}} months",
      cardRangeYear: "This year",
      cardRangeAll: "All time",
      cardOthers: "+{{count}} more",
    },
    guide: {
      howtoTitle: "How it works",
      howtoLead:
        "You can start with a single photo. No sign-up, no cost, and every record stays on your own device.",
      steps: [
        {
          title: "Pick a photo",
          body: "Choose one photo with “Select photo” or “Take photo”. Use “Add multiple photos” to register several in a row. Photos are resized on your device to a JPEG with a 1600px long edge and are never uploaded anywhere.",
        },
        {
          title: "Check the place and date",
          body: "If the photo carries Exif location data, the place and date are filled in automatically. If not, choose “Pick a place on the map”, “Record the prefecture only”, or “Save without location”. When you would rather not pin down your home exactly, switch the accuracy to “Approximate area”.",
        },
        {
          title: "Add a category and a note, then save",
          body: "Pick from 12 categories such as travel, fishing, dining, dog trips, hot springs and castles, then add a date, a note and a place name. “Custom 1–3” can be renamed freely, so you can build your own categories for camping, hiking and anything else.",
        },
        {
          title: "Look back on the map and in the list",
          body: "Saved experiences appear both as map pins and in the list. Switch the list between “Timeline” and “By area”, or open “View memories” to play your photos back like a slideshow.",
        },
        {
          title: "Create a share image and post it",
          body: "“Create a share image” builds two kinds of 1200×630 images: the Japan prefecture map and the stats card. They contain only your record counts and the coloured prefectures — never photos, notes or place names. Save one and post it to X.",
        },
        {
          title: "Back up regularly",
          body: "Your data exists only on this device. Use “Save backup” to write a JSON file, and “Restore backup” to bring everything back when you change phones or browsers.",
        },
      ],
      faqTitle: "Frequently asked questions",
      faqLead: "The questions we hear most often from people getting started.",
      faqs: [
        {
          q: "Where is my data stored?",
          a: "Only inside your browser on this device (IndexedDB). Your photos, notes and locations are never sent to our servers and are never shown to anyone else.",
        },
        {
          q: "Do I need an account? Does it cost anything?",
          a: "Neither. There is no sign-up and no charge — just start using it.",
        },
        {
          q: "What happens to my data if I change phones or browsers?",
          a: "It does not carry over, and clearing your browsing data will erase it. Use “Save backup” to export a file, then load it with “Restore backup” on the same page on your new device.",
        },
        {
          q: "What if my photo has no location data?",
          a: "Tap the map to set the place, or record just the prefecture. If you would rather not keep any location, choose “Save without location”.",
        },
        {
          q: "Do share images include my photos or notes?",
          a: "No. The image shows only your record counts, the per-category counts and the coloured prefectures. Photos, notes, place names and coordinates are never included, and the image is generated entirely inside your browser.",
        },
        {
          q: "How do I post a share image to X?",
          a: "Use “Save image” to download the PNG, then attach it in the compose window opened by “Share on X”. On a smartphone, “Share with image” hands the picture straight to your share sheet.",
        },
        {
          q: "I live outside Japan — can I still use it?",
          a: "Yes. The map covers the whole world and the interface is available in 7 languages. The prefecture map appears only when you have records in Japan; otherwise you can use the stats card.",
        },
        {
          q: "How many records can I save?",
          a: "The limit depends on the free space on your device. Photos are compressed automatically so each record stays small, but saving will fail once storage runs out — so back up often.",
        },
      ],
    },
    heritageLink: "World Heritage Passport",
    landing: {
      followX: "Follow us on X (@AIDRIVEPLAN)",
      journalName: "AI Travel Journal Maker",
      recordCta: "Record an experience",
      heroEyebrow: "A private life log",
      heroHeadline1: "Capture your life experiences",
      heroHeadline2: "through photos and places.",
      since: "Since June 2026",
      demoLocation1: "Kanagawa",
      demoLocation2: "Tokyo",
      journalBannerTitle: "Turn your saved photos and notes into a social post and eye-catching image",
      journalBannerBody: "Load your Life Experience Map records and use them to put your trip memories together.",
      journalBannerCta: "Open AI Travel Journal",
      journalWithSelectionCta: "Post selected records to social media",
      queueProgress: "Processing {{current}} / {{total}}",
      noticeAccordionTitle: "Terms of use & data storage",
      noticeTitle: "Terms of use",
      noticeBody: "· Copying, repurposing, or redistributing this site's source code, design, or content without permission is prohibited.",
      dataStorageTitle: "About data storage",
      dataStorageBody1: "· Photos, places, notes, and other data you register are stored only in your device's browser (local storage). Nothing is sent to a server or backed up to the cloud.",
      dataStorageBody2: "· Data may be lost if you clear your browsing data or cache, reset or replace your device, or switch browsers.",
      dataStorageBody3: "· We accept no responsibility for any loss or corruption of data. We recommend periodically saving a file with the \"Save backup\" button for anything important.",
      footerPrivacyLink: "Privacy Policy",
      footerCookieLink: "Cookies",
      footerBrandName: "AI Drive Planner",
    },
  },

  ko: {
    app: {
      title: "인생 체험 지도",
      subtitle: "사진으로 남기는 나의 추억 지도",
      backLink: "🚗 AI 드라이브 플래너",
      desc: "여행, 낚시, 식사, 반려견 동행, 온천, 성, 친구와 함께, 가족 추억 등 인생의 체험을 사진과 장소로 기록할 수 있습니다.",
      privacy:
        "모든 기록은 기기(브라우저)에만 저장됩니다. 비공개이며 본인만 열람할 수 있습니다. 외부 전송은 없습니다.",
    },
    entries: {
      sectionTitle: "기록한 체험",
      replayBtn: "추억 되돌아보기",
    },
    form: {
      sectionTitle: "체험 기록하기",
      gpsSuccess: "사진에서 위치 정보를 가져왔습니다. 지도 핀으로 장소를 확인하세요.",
      gpsSuccessHint: "저장하기 전에 필요하면 아래의 「위치 저장 정밀도」를 조정하세요.",
      noGps: "위치 정보를 찾을 수 없습니다. 장소 등록 방법을 선택하세요.",
      mapMode: "지도에서 장소 선택",
      prefMode: "광역단체만 등록",
      noneMode: "위치 정보 없이 저장",
      mapTapHint: "👉 오른쪽(아래) 지도를 탭하여 장소를 지정하세요.",
      mapTapDone: "지도에서 장소를 지정했습니다.",
      prefLabel: "도도부현",
      prefSelect: "선택하세요",
      catLabel: "카테고리",
      catRequired: "*필수",
      dateLabel: "날짜",
      memoLabel: "메모",
      memoOptional: "(선택 사항)",
      memoPlaceholder: "예: 아내와 당일치기 여행. 해산물 덮밥이 맛있었다. 또 가고 싶다.",
      locationNameLabel: "장소 이름",
      locationNameOptional: "(선택 사항)",
      locationNamePlaceholder: "예: 우에다 성, 조가시마 항",
      precisionLabel: "위치 저장 정밀도",
      precisionExact: "정확한 위치",
      precisionApprox: "대략적인 위치",
      precisionHint:
        "낚시터나 자택 근처 등 정확한 위치를 남기고 싶지 않은 경우 「대략적인 위치」를 선택하세요 (도도부현 정보는 계속 저장됩니다).",
      saveBtn: "이 체험 저장하기",
      saving: "저장 중...",
      errPhoto: "사진을 선택하세요.",
      errPref: "도도부현을 선택하세요.",
      errMapTap: "지도를 탭하여 장소를 지정하세요.",
      errCoords: "위도와 경도를 입력하세요.",
      errSave: "저장에 실패했습니다.",
      coordsMode: "위도·경도 직접 입력",
      coordsLatLabel: "위도（Latitude）",
      coordsLngLabel: "경도（Longitude）",
      coordsHint: "Google 지도에서 장소를 우클릭 → 표시된 숫자를 복사해 입력하세요. 「35.796402, 139.531056」처럼 쉼표로 구분된 상태로 붙여넣으면 위도와 경도로 자동 분리됩니다.",
      editCategoryBtn: "카테고리 이름 변경（이모지 가능）",
    },
    card: {
      showOnMap: "지도에서 보기",
      deleteAria: "삭제",
      approxLocation: "대략적인 위치",
      prefectureOnly: "광역단체만",
      revisitLink: "이 장소 재방문 계획 세우기",
      editBtn: "편집",
      selectBtn: "드라이브에 선택",
      selectedBtn: "선택됨",
      journalBtn: "이 기록으로 만들기",
      journalBtnDisabledHint: "사진을 저장하면 이 기록만으로 만들 수 있습니다.",
    },
    edit: {
      title: "기록 편집",
      saveBtn: "변경 사항 저장",
      cancelBtn: "취소",
      closeAria: "닫기",
      photoLocked: "사진은 변경할 수 없습니다. 다른 사진을 사용하려면 이 기록을 삭제하고 다시 등록해 주세요.",
      prefDetecting: "좌표에서 지역을 확인하는 중…",
      prefDetected: "좌표에서 '{{name}}'(으)로 확인되었습니다.",
      precisionWarn: "'대략적인 위치'로 저장하면 좌표가 약 1km 단위로 반올림됩니다. 정확한 위치를 남기려면 '정확한 위치'를 선택하세요.",
    },
    list: {
      timeline: "시계열",
      prefecture: "지역별",
      journalHint: "사진과 기록으로 여행기와 SNS 게시글을 만들 수 있습니다.",
    },
    country: {
      label: "거주 국가",
    },
    timeline: {
      newest: "최신순",
      oldest: "오래된 순",
      empty: "아직 기록이 없습니다. 사진을 추가해 첫 번째 추억을 기록하세요.",
      tripJournalBtn: "이 여행으로 만들기",
      tripLimitNote: "오래된 순으로 앞의 {{max}}건이 먼저 선택됩니다",
    },
    prefecture: {
      backLink: "← 목록으로 돌아가기",
      countTemplate: "{{count}}건",
      all: "전체",
      noFiltered: "해당 기록이 없습니다.",
      noEntries: "아직 기록이 없습니다.",
    },
    backup: {
      exportBtn: "백업 저장",
      importBtn: "백업에서 복원",
      exportEmpty: "저장할 기록이 없습니다.",
      exportSuccess: "백업을 저장했습니다.",
      exportError: "백업 저장에 실패했습니다.",
      importSuccess: "{{count}}건의 기록을 복원했습니다.",
      importError: "복원에 실패했습니다.",
      hint: "모든 기록을 하나의 파일에 저장할 수 있습니다. 기기 변경이나 브라우저 데이터 삭제에 대비해 가끔 저장하세요. 또한 이 파일을 자녀나 가족에게 전달하여 소중한 추억 앨범으로 이어줄 수 있습니다.",
    },
    photo: {
      selectBtn: "사진 선택",
      cameraBtn: "사진 촬영",
      bulkBtn: "여러 장 한꺼번에 추가",
      bulkHint: "같은 장소·같은 날의 사진은 1장을 기준으로 해 주세요. GPS 정보가 없는 사진은 지도에서 탭하여 위치를 지정할 수 있습니다.",
      loading: "사진 불러오는 중...",
      previewAlt: "업로드한 사진 미리보기",
    },
    replay: {
      title: "추억 되돌아보기",
      closeAria: "닫기",
      choosePeriod: "되돌아볼 기간을 선택하세요",
      chooseCategory: "카테고리로 필터링",
      allCategories: "전체",
      all: "전체",
      period1y: "최근 1년",
      period2y: "최근 2년",
      period3y: "최근 3년",
      noEntries: "이 기간의 기록이 없습니다.",
      changePeriodBtn: "기간 다시 선택",
      changePeriod: "기간 변경",
      pauseAria: "일시 정지",
      playAria: "재생",
    },
    map: {
      loading: "지도 불러오는 중...",
      newPin: "새 기록 위치",
      approxSuffix: "(대략적인 위치)",
      revisitLink: "이 장소 재방문 계획 세우기",
      googleMapsLink: "Google 지도에서 열기",
    },
    errors: {
      loadFailed: "기록 불러오기에 실패했습니다",
      deleteFailed: "삭제에 실패했습니다.",
      photoError: "사진 불러오기에 실패했습니다. 다른 사진을 시도하세요.",
    },
    drive: {
      planBtn: "추억 드라이브 계획하기",
      hint: "{{count}}개 선택 중",
      clearBtn: "선택 해제",
      selectHint: "일본 기록을 선택해 추억의 드라이브 루트를 계획할 수 있습니다",
    },
    confirm: {
      delete: "이 기록을 삭제하시겠습니까?",
    },
    categories: {
      travel: "여행",
      fishing: "낚시",
      food: "식사",
      dog: "반려견 동행",
      onsen: "온천",
      castle: "성",
      friends: "친구와 함께",
      family: "가족",
      other: "기타",
      other1: "기타①",
      other2: "기타②",
      other3: "기타③",
    },
    disclaimer: "본 서비스는 개인 기록 목적으로 제공됩니다. 모든 데이터는 기기에만 저장되며 외부 서버로 전송되지 않습니다. 본 서비스 이용으로 인한 손해에 대해 운영자는 일체의 책임을 지지 않습니다. 서비스 내용은 예고 없이 변경·종료될 수 있습니다.",
    share: {
      buttonLabel: "공유 이미지 만들기",
      emptyHint: "기록을 추가하면 사용할 수 있습니다",
      modalTitle: "공유 이미지 만들기",
      closeAria: "닫기",
      tabMap: "도도부현 정복 지도",
      tabStats: "체험 통계 카드",
      rangeAll: "전체 기간",
      rangeYear: "올해",
      saveBtn: "이미지 저장",
      shareImageBtn: "이미지 공유",
      xBtn: "X에 공유",
      savedMsg: "이미지를 저장했습니다.",
      saveError: "이미지를 저장하지 못했습니다. 다시 시도해 주세요.",
      longPressHint: "저장이 시작되지 않으면 위 이미지를 길게 누르거나(PC에서는 우클릭) 저장해 주세요.",
      privacyNote: "이미지에는 기록 수와 도도부현 색칠만 포함됩니다. 사진·메모·지명은 포함되지 않습니다.",
      noJapanNote: "일본 내 기록이 없어 도도부현 지도를 만들 수 없습니다. 체험 통계 카드를 이용해 주세요.",
      postText: "인생 체험 지도에 추억을 기록 중📍 지금까지 {{count}}건의 체험을 기록했습니다",
      hashtags: "인생체험지도,라이프로그",
      cardMapTitle: "일본 도도부현 지도",
      cardStatsTitle: "나의 체험 기록",
      cardPrefLabel: "방문한 도도부현",
      cardTotalLabel: "기록한 체험",
      cardCountValue: "{{count}}건",
      cardCountUnit: "건",
      cardCategoryLabel: "카테고리별 기록 수",
      cardSinceLabel: "기록 시작",
      cardDurationYM: "{{years}}년 {{months}}개월",
      cardDurationM: "{{months}}개월",
      cardRangeYear: "올해",
      cardRangeAll: "전체 기간",
      cardOthers: "그 외 {{count}}건",
    },
    guide: {
      howtoTitle: "사용 방법",
      howtoLead:
        "사진 한 장이면 바로 시작할 수 있습니다. 가입도 요금도 필요 없으며, 기록은 모두 사용 중인 기기 안에만 저장됩니다.",
      steps: [
        {
          title: "사진 고르기",
          body: "「사진 선택」 또는 「카메라로 촬영」에서 사진을 한 장 고릅니다. 「한꺼번에 추가」를 사용하면 여러 장을 이어서 등록할 수 있습니다. 사진은 기기 안에서 긴 변 1600px의 JPEG로 자동 압축되며 외부로 전송되지 않습니다.",
        },
        {
          title: "장소와 날짜 확인하기",
          body: "사진에 위치 정보(Exif)가 있으면 장소와 날짜가 자동으로 입력됩니다. 없을 때는 「지도에서 장소 선택」 「광역 지자체만 등록」 「위치 정보 없이 저장」 중에서 고를 수 있습니다. 집 등을 정확히 남기고 싶지 않다면 저장 정밀도를 「대략적인 장소」로 바꿀 수 있습니다.",
        },
        {
          title: "카테고리와 메모를 붙여 저장",
          body: "여행·낚시·식사·반려견 동반·온천·성 등 12가지 카테고리에서 고르고, 날짜·메모·장소 이름을 함께 저장합니다. 「기타①~③」은 이름을 자유롭게 바꿀 수 있어 캠핑이나 등산 같은 나만의 카테고리를 만들 수 있습니다.",
        },
        {
          title: "지도와 목록으로 돌아보기",
          body: "저장한 체험은 지도의 핀과 목록에 함께 표시됩니다. 목록은 「시간순」과 「지역별」로 전환할 수 있고, 「추억 돌아보기」에서는 슬라이드쇼처럼 사진을 넘겨 볼 수 있습니다.",
        },
        {
          title: "공유 이미지를 만들어 올리기",
          body: "「공유 이미지 만들기」에서 광역 지자체 정복 지도와 체험 통계 카드 두 종류의 이미지(1200×630)를 만들 수 있습니다. 이미지에 담기는 것은 기록 건수와 색칠된 지역뿐이며 사진·메모·지명은 들어가지 않습니다. 저장해 X에 올릴 수 있습니다.",
        },
        {
          title: "정기적으로 백업하기",
          body: "데이터는 기기 안에만 있습니다. 「백업 저장」으로 JSON 파일을 만들어 두면 기기를 바꾸거나 브라우저를 바꿨을 때 「백업 복원」으로 되돌릴 수 있습니다.",
        },
      ],
      faqTitle: "자주 묻는 질문",
      faqLead: "처음 사용하는 분들이 자주 하시는 질문을 모았습니다.",
      faqs: [
        {
          q: "기록한 데이터는 어디에 저장되나요?",
          a: "사용 중인 기기의 브라우저 안(IndexedDB)에만 저장됩니다. 사진·메모·위치 정보를 저희 서버로 보내지 않으며 다른 사람에게 공개되지도 않습니다.",
        },
        {
          q: "회원가입이 필요한가요? 요금이 드나요?",
          a: "둘 다 필요 없습니다. 가입 없이 무료로 바로 사용할 수 있습니다.",
        },
        {
          q: "기기를 바꾸거나 브라우저를 바꾸면 데이터는 어떻게 되나요?",
          a: "기기나 브라우저가 바뀌면 이어지지 않습니다. 브라우저의 「인터넷 사용 기록 삭제」로도 지워집니다. 「백업 저장」으로 파일을 만든 뒤 새 기기의 같은 페이지에서 「백업 복원」으로 불러오세요.",
        },
        {
          q: "사진에 위치 정보가 없을 때는 어떻게 하나요?",
          a: "지도를 눌러 장소를 지정하거나 광역 지자체만 골라 등록할 수 있습니다. 장소를 남기고 싶지 않다면 「위치 정보 없이 저장」도 선택할 수 있습니다.",
        },
        {
          q: "공유 이미지에 사진이나 메모가 들어가나요?",
          a: "들어가지 않습니다. 이미지에 그려지는 것은 기록 건수, 카테고리별 건수, 방문한 지역의 색칠뿐입니다. 사진·메모·장소 이름·좌표는 전혀 포함되지 않으며 이미지 생성도 브라우저 안에서 모두 처리됩니다.",
        },
        {
          q: "공유 이미지는 어떻게 X에 올리나요?",
          a: "「이미지 저장」으로 PNG를 저장한 뒤 「X에 공유」로 열리는 작성 화면에 첨부하세요. 스마트폰에서는 「이미지와 함께 공유」로 이미지를 붙인 채 공유 메뉴에 넘길 수 있습니다.",
        },
        {
          q: "일본 외 지역에 살고 있는데 사용할 수 있나요?",
          a: "사용할 수 있습니다. 지도는 전 세계를 지원하고 표시 언어는 7개 중에서 고를 수 있습니다. 일본의 지역 정복 지도는 일본 내 기록이 있을 때만 표시되며, 없을 때는 체험 통계 카드를 사용하시면 됩니다.",
        },
        {
          q: "기록은 몇 건까지 저장할 수 있나요?",
          a: "상한은 기기의 남은 용량에 따라 달라집니다. 사진은 저장 시 자동으로 압축되어 건당 용량은 작지만, 용량이 부족해지면 저장할 수 없게 되므로 자주 백업하시길 권합니다.",
        },
      ],
    },
    heritageLink: "세계유산 여권",
    landing: {
      followX: "공식 X（@AIDRIVEPLAN）팔로우",
      journalName: "AI 여행기 메이커",
      recordCta: "체험 기록하기",
      heroEyebrow: "비공개 라이프로그",
      heroHeadline1: "사진과 장소로,",
      heroHeadline2: "인생의 체험을 남기다.",
      since: "Since 2026년 6월",
      demoLocation1: "가나가와현",
      demoLocation2: "도쿄도",
      journalBannerTitle: "저장한 사진과 메모로 SNS 게시글・썸네일 이미지를 만들어요",
      journalBannerBody: "인생 체험 지도의 기록을 불러와 여행 후 추억 정리에 활용할 수 있습니다.",
      journalBannerCta: "AI 여행기로 이동",
      journalWithSelectionCta: "선택한 기록으로 SNS 게시",
      queueProgress: "{{current}} / {{total}}번째 처리 중",
      noticeAccordionTitle: "이용 시 주의사항・데이터 저장에 대해",
      noticeTitle: "이용 시 주의사항",
      noticeBody: "・본 사이트의 소스 코드・디자인・콘텐츠의 무단 복제・전용・재배포를 금지합니다。",
      dataStorageTitle: "데이터 저장에 대해",
      dataStorageBody1: "・등록한 사진・장소・메모 등의 데이터는 사용 중인 기기의 브라우저 내（로컬 스토리지）에만 저장됩니다。서버 전송・클라우드 백업은 이루어지지 않습니다。",
      dataStorageBody2: "・브라우저의 「인터넷 사용 기록 삭제」「캐시 삭제」, 기기 초기화・기종 변경, 브라우저 변경 등으로 데이터가 소실될 수 있습니다。",
      dataStorageBody3: "・데이터 소실・손상에 대해 당 서비스는 일체의 책임을 지지 않습니다。소중한 데이터는 정기적으로 「백업 저장」 버튼으로 파일에 저장해 두시기를 권장합니다。",
      footerPrivacyLink: "개인정보처리방침",
      footerCookieLink: "쿠키에 대해",
      footerBrandName: "AI 드라이브 플래너",
    },
  },

  "zh-CN": {
    app: {
      title: "人生体验地图",
      subtitle: "用照片记录你的人生回忆",
      backLink: "🚗 AI 自驾游规划",
      desc: "用照片和地点记录旅行、钓鱼、美食、遛狗、温泉、城堡、与朋友同行、家庭回忆等人生体验。",
      privacy:
        "所有记录仅保存在您的设备（浏览器）中，完全私密，仅供个人回顾，不会发送到外部。",
    },
    entries: {
      sectionTitle: "已记录的体验",
      replayBtn: "回顾回忆",
    },
    form: {
      sectionTitle: "记录体验",
      gpsSuccess: "已从照片获取位置信息，请在地图图钉处确认位置。",
      gpsSuccessHint: "保存前，如有需要请调整下方「位置保存精度」。",
      noGps: "未找到位置信息，请选择注册地点的方式。",
      mapMode: "从地图选择位置",
      prefMode: "仅注册都道府县",
      noneMode: "不含位置信息保存",
      mapTapHint: "👉 请点击右侧（下方）地图指定位置。",
      mapTapDone: "已在地图上指定位置。",
      prefLabel: "都道府县",
      prefSelect: "请选择",
      catLabel: "分类",
      catRequired: "*必填",
      dateLabel: "日期",
      memoLabel: "备注",
      memoOptional: "（可选）",
      memoPlaceholder: "例：和妻子一日游，海鲜盖饭很好吃，还想再去。",
      locationNameLabel: "地点名称",
      locationNameOptional: "（可选）",
      locationNamePlaceholder: "例：上田城、城岛港",
      precisionLabel: "位置保存精度",
      precisionExact: "精确位置",
      precisionApprox: "大致位置",
      precisionHint:
        "如不想保存精确位置（如钓鱼点、住家附近），请选择「大致位置」（都道府县信息仍会保存）。",
      saveBtn: "保存此体验",
      saving: "保存中...",
      errPhoto: "请选择照片。",
      errPref: "请选择都道府县。",
      errMapTap: "请点击地图指定位置。",
      errCoords: "请输入纬度和经度。",
      errSave: "保存失败。",
      coordsMode: "直接输入经纬度",
      coordsLatLabel: "纬度（Latitude）",
      coordsLngLabel: "经度（Longitude）",
      coordsHint: "在 Google 地图右键点击位置 → 复制显示的数字输入即可。像「35.796402, 139.531056」这样带逗号直接粘贴，会自动拆分为纬度和经度。",
      editCategoryBtn: "修改分类名称（可用表情符号）",
    },
    card: {
      showOnMap: "在地图上查看",
      deleteAria: "删除",
      approxLocation: "大致位置",
      prefectureOnly: "仅都道府县",
      revisitLink: "制定重访计划",
      editBtn: "编辑",
      selectBtn: "选入兜风路线",
      selectedBtn: "已选择",
      journalBtn: "用这条记录制作",
      journalBtnDisabledHint: "保存照片后，就能只用这条记录制作。",
    },
    edit: {
      title: "编辑记录",
      saveBtn: "保存更改",
      cancelBtn: "取消",
      closeAria: "关闭",
      photoLocked: "照片无法更改。如需更换照片，请删除此记录后重新添加。",
      prefDetecting: "正在根据坐标判断地区…",
      prefDetected: "已根据坐标判断为“{{name}}”。",
      precisionWarn: "以“大致位置”保存时，坐标会被四舍五入到约1公里。若要保留精确位置，请选择“精确位置”。",
    },
    list: {
      timeline: "时间轴",
      prefecture: "按地区",
      journalHint: "可以用照片和记录生成游记和社交媒体文案。",
    },
    country: {
      label: "居住国家",
    },
    timeline: {
      newest: "从新到旧",
      oldest: "从旧到新",
      empty: "暂无记录，请添加照片记录您的第一个回忆。",
      tripJournalBtn: "用这次旅行制作",
      tripLimitNote: "最早的{{max}}条记录会被预先选中",
    },
    prefecture: {
      backLink: "← 返回地区列表",
      countTemplate: "{{count}}件",
      all: "全部",
      noFiltered: "没有符合条件的记录。",
      noEntries: "暂无记录。",
    },
    backup: {
      exportBtn: "保存备份",
      importBtn: "从备份恢复",
      exportEmpty: "没有可保存的记录。",
      exportSuccess: "已保存备份。",
      exportError: "备份保存失败。",
      importSuccess: "已恢复 {{count}} 条记录。",
      importError: "恢复失败。",
      hint: "可将所有记录保存为一个文件。设备更换或浏览器数据清除时可用于恢复，建议定期保存。您还可以将此文件传给子女或家人，作为珍贵的回忆相册传承下去。",
    },
    photo: {
      selectBtn: "选择照片",
      cameraBtn: "拍摄照片",
      bulkBtn: "批量添加",
      bulkHint: "建议同一地点同一天只上传1张照片。没有GPS信息的照片，可在地图上点击指定位置。",
      loading: "正在加载照片...",
      previewAlt: "已上传照片的预览",
    },
    replay: {
      title: "回顾回忆",
      closeAria: "关闭",
      choosePeriod: "请选择回顾的时间段",
      chooseCategory: "按类别筛选",
      allCategories: "全部",
      all: "全部",
      period1y: "最近1年",
      period2y: "最近2年",
      period3y: "最近3年",
      noEntries: "该时间段暂无记录。",
      changePeriodBtn: "重新选择时间段",
      changePeriod: "更改时间段",
      pauseAria: "暂停",
      playAria: "播放",
    },
    map: {
      loading: "地图加载中...",
      newPin: "新记录位置",
      approxSuffix: "（大致位置）",
      revisitLink: "制定重访计划",
      googleMapsLink: "在 Google 地图中打开",
    },
    errors: {
      loadFailed: "记录加载失败",
      deleteFailed: "删除失败。",
      photoError: "照片加载失败，请尝试其他照片。",
    },
    drive: {
      planBtn: "规划回忆自驾游",
      hint: "已选择 {{count}} 件",
      clearBtn: "取消选择",
      selectHint: "选择日本的记录，规划一条充满回忆的自驾路线",
    },
    confirm: {
      delete: "确定要删除此记录吗？",
    },
    categories: {
      travel: "旅行",
      fishing: "钓鱼",
      food: "美食",
      dog: "遛狗",
      onsen: "温泉",
      castle: "城堡",
      friends: "与朋友同行",
      family: "家庭",
      other: "其他",
      other1: "其他①",
      other2: "其他②",
      other3: "其他③",
    },
    disclaimer: "本服务仅供个人记录使用。所有数据仅保存在您的设备上，不会发送至外部服务器。因使用本服务造成的任何损失，运营方概不负责。内容可能在不另行通知的情况下更改或终止。",
    share: {
      buttonLabel: "生成分享图片",
      emptyHint: "添加记录后即可使用",
      modalTitle: "生成分享图片",
      closeAria: "关闭",
      tabMap: "都道府县打卡地图",
      tabStats: "体验统计卡片",
      rangeAll: "全部时间",
      rangeYear: "今年",
      saveBtn: "保存图片",
      shareImageBtn: "分享图片",
      xBtn: "分享到 X",
      savedMsg: "图片已保存。",
      saveError: "图片保存失败，请重试。",
      longPressHint: "如果没有开始下载，请长按上方图片（电脑上点击右键）另存为。",
      privacyNote: "图片中仅包含记录数量和都道府县的着色，不含照片、备注和地名。",
      noJapanNote: "暂无日本境内的记录，无法生成都道府县地图。请使用体验统计卡片。",
      postText: "正在用人生体验地图记录回忆📍 目前已记录 {{count}} 条体验",
      hashtags: "人生体验地图,生活记录",
      cardMapTitle: "日本都道府县地图",
      cardStatsTitle: "我的体验记录",
      cardPrefLabel: "已访问的都道府县",
      cardTotalLabel: "记录的体验",
      cardCountValue: "{{count}} 条",
      cardCountUnit: "条",
      cardCategoryLabel: "各类别记录数",
      cardSinceLabel: "开始记录",
      cardDurationYM: "{{years}}年{{months}}个月",
      cardDurationM: "{{months}}个月",
      cardRangeYear: "今年",
      cardRangeAll: "全部时间",
      cardOthers: "其他 {{count}} 条",
    },
    guide: {
      howtoTitle: "使用方法",
      howtoLead:
        "从选一张照片开始即可。无需注册、无需费用，所有记录只保存在您自己的设备中。",
      steps: [
        {
          title: "选择照片",
          body: "通过「选择照片」或「拍照」选一张照片。使用「批量添加」可以连续登记多张。照片会在设备内自动压缩为长边 1600px 的 JPEG，不会发送到外部。",
        },
        {
          title: "确认地点和日期",
          body: "如果照片包含位置信息（Exif），地点和日期会自动填入。若没有，可从「在地图上选择地点」「仅登记省级地区」「不保存位置信息」中选择。如果不想精确留下住家等位置，可以把保存精度切换为「大致位置」。",
        },
        {
          title: "添加分类和备注后保存",
          body: "从旅行、钓鱼、用餐、带狗出行、温泉、城堡等 12 个分类中选择，再附上日期、备注和地点名称保存。「其他①～③」可以自由改名，方便建立露营、登山等专属分类。",
        },
        {
          title: "用地图和列表回顾",
          body: "保存的体验会同时出现在地图图钉和列表中。列表可在「时间顺序」和「按区域」之间切换，「回顾回忆」则能像幻灯片一样播放照片。",
        },
        {
          title: "生成分享图并发布",
          body: "在「制作分享图」中可生成两种 1200×630 的图片：日本都道府县征服地图和体验统计卡。图中只包含记录数量和已填色的地区，不含照片、备注和地名。保存后即可发布到 X。",
        },
        {
          title: "定期备份",
          body: "数据只存在于本设备中。用「保存备份」导出 JSON 文件，换手机或换浏览器时即可通过「恢复备份」还原。",
        },
      ],
      faqTitle: "常见问题",
      faqLead: "以下是初次使用者最常提出的问题。",
      faqs: [
        {
          q: "记录的数据保存在哪里？",
          a: "仅保存在您设备的浏览器内（IndexedDB）。照片、备注和位置信息不会发送到我们的服务器，也不会向他人公开。",
        },
        {
          q: "需要注册吗？会收费吗？",
          a: "两者都不需要。无需注册，免费即可直接使用。",
        },
        {
          q: "换手机或换浏览器后数据会怎样？",
          a: "更换设备或浏览器后数据不会延续，清除浏览数据也会将其删除。请用「保存备份」导出文件，再在新设备的同一页面通过「恢复备份」载入。",
        },
        {
          q: "照片没有位置信息时该怎么办？",
          a: "可以点击地图指定地点，或只选择省级地区登记。如果不想留下位置，也可以选择「不保存位置信息」。",
        },
        {
          q: "分享图中会包含照片或备注吗？",
          a: "不会。图片中只呈现记录数量、各分类的数量以及已访问地区的填色。照片、备注、地点名称和坐标都不会包含在内，图片的生成也全部在浏览器内完成。",
        },
        {
          q: "如何把分享图发布到 X？",
          a: "先用「保存图片」下载 PNG，再在「分享到 X」打开的发布界面中添加附件。在手机上可通过「连同图片分享」直接把图片交给系统的分享菜单。",
        },
        {
          q: "我住在日本以外的地区，也能使用吗？",
          a: "可以。地图覆盖全球，界面语言可从 7 种中选择。都道府县征服地图仅在有日本境内记录时显示，没有时可以使用体验统计卡。",
        },
        {
          q: "最多能保存多少条记录？",
          a: "上限取决于设备的剩余空间。照片在保存时会自动压缩，单条占用较小，但空间不足时将无法保存，因此建议经常备份。",
        },
      ],
    },
    heritageLink: "世界遗产护照",
    landing: {
      followX: "关注官方 X（@AIDRIVEPLAN）",
      journalName: "AI 旅行日记生成器",
      recordCta: "记录体验",
      heroEyebrow: "私密的生活记录",
      heroHeadline1: "用照片和地点，",
      heroHeadline2: "留下人生的体验。",
      since: "Since 2026年6月",
      demoLocation1: "神奈川县",
      demoLocation2: "东京都",
      journalBannerTitle: "用保存的照片和备注，生成社交媒体文案和封面图",
      journalBannerBody: "读取人生体验地图的记录，可用于整理旅行后的回忆。",
      journalBannerCta: "前往 AI 旅行日记",
      journalWithSelectionCta: "用选中的记录生成社交媒体文案",
      queueProgress: "正在处理第 {{current}} / {{total}} 张",
      noticeAccordionTitle: "使用须知・关于数据保存",
      noticeTitle: "使用须知",
      noticeBody: "・禁止未经许可复制、挪用或再发布本网站的源代码、设计与内容。",
      dataStorageTitle: "关于数据保存",
      dataStorageBody1: "・您登记的照片、地点、备注等数据仅保存在您设备的浏览器内（本地存储），不会发送到服务器，也不会备份到云端。",
      dataStorageBody2: "・清除浏览器的浏览数据/缓存、重置或更换设备、更换浏览器等操作，都可能导致数据丢失。",
      dataStorageBody3: "・对于数据丢失或损坏，本服务概不负责。建议您定期使用「保存备份」按钮将重要数据保存为文件。",
      footerPrivacyLink: "隐私政策",
      footerCookieLink: "关于 Cookie",
      footerBrandName: "AI 自驾游规划",
    },
  },

  "zh-TW": {
    app: {
      title: "人生體驗地圖",
      subtitle: "用照片記錄你的人生回憶",
      backLink: "🚗 AI 自駕遊規劃",
      desc: "用照片和地點記錄旅行、釣魚、美食、遛狗、溫泉、城堡、與朋友同行、家庭回憶等人生體驗。",
      privacy:
        "所有記錄僅保存在您的裝置（瀏覽器）中，完全私密，僅供個人回顧，不會傳送至外部。",
    },
    entries: {
      sectionTitle: "已記錄的體驗",
      replayBtn: "回顧回憶",
    },
    form: {
      sectionTitle: "記錄體驗",
      gpsSuccess: "已從照片取得位置資訊，請在地圖圖釘處確認位置。",
      gpsSuccessHint: "儲存前，如有需要請調整下方「位置儲存精度」。",
      noGps: "未找到位置資訊，請選擇登記地點的方式。",
      mapMode: "從地圖選擇位置",
      prefMode: "僅登記都道府縣",
      noneMode: "不含位置資訊儲存",
      mapTapHint: "👉 請點擊右側（下方）地圖指定位置。",
      mapTapDone: "已在地圖上指定位置。",
      prefLabel: "都道府縣",
      prefSelect: "請選擇",
      catLabel: "分類",
      catRequired: "*必填",
      dateLabel: "日期",
      memoLabel: "備註",
      memoOptional: "（可選）",
      memoPlaceholder: "例：和妻子一日遊，海鮮蓋飯很好吃，還想再去。",
      locationNameLabel: "地點名稱",
      locationNameOptional: "（可選）",
      locationNamePlaceholder: "例：上田城、城島港",
      precisionLabel: "位置儲存精度",
      precisionExact: "精確位置",
      precisionApprox: "大致位置",
      precisionHint:
        "如不想保存精確位置（如釣魚點、住家附近），請選擇「大致位置」（都道府縣資訊仍會儲存）。",
      saveBtn: "儲存此體驗",
      saving: "儲存中...",
      errPhoto: "請選擇照片。",
      errPref: "請選擇都道府縣。",
      errMapTap: "請點擊地圖指定位置。",
      errCoords: "請輸入緯度和經度。",
      errSave: "儲存失敗。",
      coordsMode: "直接輸入經緯度",
      coordsLatLabel: "緯度（Latitude）",
      coordsLngLabel: "經度（Longitude）",
      coordsHint: "在 Google 地圖右鍵點擊位置 → 複製顯示的數字輸入即可。像「35.796402, 139.531056」這樣帶逗號直接貼上，會自動拆分為緯度和經度。",
      editCategoryBtn: "修改分類名稱（可用表情符號）",
    },
    card: {
      showOnMap: "在地圖上查看",
      deleteAria: "刪除",
      approxLocation: "大致位置",
      prefectureOnly: "僅都道府縣",
      revisitLink: "制定重訪計劃",
      editBtn: "編輯",
      selectBtn: "選入兜風路線",
      selectedBtn: "已選擇",
      journalBtn: "用這筆紀錄製作",
      journalBtnDisabledHint: "儲存照片後，就能只用這筆紀錄製作。",
    },
    edit: {
      title: "編輯記錄",
      saveBtn: "儲存變更",
      cancelBtn: "取消",
      closeAria: "關閉",
      photoLocked: "照片無法變更。如需更換照片，請刪除此記錄後重新新增。",
      prefDetecting: "正在根據座標判斷地區…",
      prefDetected: "已根據座標判斷為「{{name}}」。",
      precisionWarn: "以「大致位置」儲存時，座標會四捨五入至約1公里。若要保留精確位置，請選擇「精確位置」。",
    },
    list: {
      timeline: "時間軸",
      prefecture: "按地區",
      journalHint: "可以用照片和紀錄產生遊記和社群貼文。",
    },
    country: {
      label: "居住國家",
    },
    timeline: {
      newest: "從新到舊",
      oldest: "從舊到新",
      empty: "尚無記錄，請新增照片記錄您的第一個回憶。",
      tripJournalBtn: "用這次旅行製作",
      tripLimitNote: "最早的{{max}}筆紀錄會被預先選取",
    },
    prefecture: {
      backLink: "← 返回地區列表",
      countTemplate: "{{count}}件",
      all: "全部",
      noFiltered: "沒有符合條件的記錄。",
      noEntries: "尚無記錄。",
    },
    backup: {
      exportBtn: "儲存備份",
      importBtn: "從備份還原",
      exportEmpty: "沒有可儲存的記錄。",
      exportSuccess: "已儲存備份。",
      exportError: "備份儲存失敗。",
      importSuccess: "已還原 {{count}} 筆記錄。",
      importError: "還原失敗。",
      hint: "可將所有記錄儲存為一個檔案。裝置更換或瀏覽器資料清除時可用於還原，建議定期儲存。您也可以將此檔案傳給子女或家人，作為珍貴的回憶相冊傳承下去。",
    },
    photo: {
      selectBtn: "選擇照片",
      cameraBtn: "拍攝照片",
      bulkBtn: "批次新增",
      bulkHint: "建議同一地點同一天只上傳1張照片。沒有GPS資訊的照片，可在地圖上點擊指定位置。",
      loading: "正在載入照片...",
      previewAlt: "已上傳照片的預覽",
    },
    replay: {
      title: "回顧回憶",
      closeAria: "關閉",
      choosePeriod: "請選擇回顧的時間段",
      chooseCategory: "依類別篩選",
      allCategories: "全部",
      all: "全部",
      period1y: "最近1年",
      period2y: "最近2年",
      period3y: "最近3年",
      noEntries: "該時間段尚無記錄。",
      changePeriodBtn: "重新選擇時間段",
      changePeriod: "變更時間段",
      pauseAria: "暫停",
      playAria: "播放",
    },
    map: {
      loading: "地圖載入中...",
      newPin: "新記錄位置",
      approxSuffix: "（大致位置）",
      revisitLink: "制定重訪計劃",
      googleMapsLink: "在 Google 地圖中開啟",
    },
    errors: {
      loadFailed: "記錄載入失敗",
      deleteFailed: "刪除失敗。",
      photoError: "照片載入失敗，請嘗試其他照片。",
    },
    drive: {
      planBtn: "規劃回憶自駕遊",
      hint: "已選擇 {{count}} 件",
      clearBtn: "取消選擇",
      selectHint: "選擇日本的記錄，規劃一條充滿回憶的自駕路線",
    },
    confirm: {
      delete: "確定要刪除此記錄嗎？",
    },
    categories: {
      travel: "旅行",
      fishing: "釣魚",
      food: "美食",
      dog: "遛狗",
      onsen: "溫泉",
      castle: "城堡",
      friends: "與朋友同行",
      family: "家庭",
      other: "其他",
      other1: "其他①",
      other2: "其他②",
      other3: "其他③",
    },
    disclaimer: "本服務僅供個人記錄使用。所有資料僅保存在您的裝置上，不會傳送至外部伺服器。因使用本服務造成的任何損失，營運方概不負責。內容可能在不另行通知的情況下更改或終止。",
    share: {
      buttonLabel: "產生分享圖片",
      emptyHint: "新增記錄後即可使用",
      modalTitle: "產生分享圖片",
      closeAria: "關閉",
      tabMap: "都道府縣攻略地圖",
      tabStats: "體驗統計卡片",
      rangeAll: "全部期間",
      rangeYear: "今年",
      saveBtn: "儲存圖片",
      shareImageBtn: "分享圖片",
      xBtn: "分享到 X",
      savedMsg: "圖片已儲存。",
      saveError: "圖片儲存失敗，請再試一次。",
      longPressHint: "若沒有開始下載，請長按上方圖片（電腦請按滑鼠右鍵）另存新檔。",
      privacyNote: "圖片僅包含記錄數量與都道府縣的著色，不含照片、備註與地名。",
      noJapanNote: "目前沒有日本境內的記錄，無法產生都道府縣地圖。請改用體驗統計卡片。",
      postText: "正在用人生體驗地圖記錄回憶📍 目前已記錄 {{count}} 筆體驗",
      hashtags: "人生體驗地圖,生活記錄",
      cardMapTitle: "日本都道府縣地圖",
      cardStatsTitle: "我的體驗記錄",
      cardPrefLabel: "造訪過的都道府縣",
      cardTotalLabel: "記錄的體驗",
      cardCountValue: "{{count}} 筆",
      cardCountUnit: "筆",
      cardCategoryLabel: "各類別記錄數",
      cardSinceLabel: "開始記錄",
      cardDurationYM: "{{years}}年{{months}}個月",
      cardDurationM: "{{months}}個月",
      cardRangeYear: "今年",
      cardRangeAll: "全部期間",
      cardOthers: "其他 {{count}} 筆",
    },
    guide: {
      howtoTitle: "使用方法",
      howtoLead:
        "從選一張照片開始即可。無須註冊、無須費用，所有紀錄只保存在您自己的裝置中。",
      steps: [
        {
          title: "選擇照片",
          body: "透過「選擇照片」或「拍照」選一張照片。使用「批次新增」可以連續登錄多張。照片會在裝置內自動壓縮為長邊 1600px 的 JPEG，不會傳送到外部。",
        },
        {
          title: "確認地點與日期",
          body: "如果照片含有位置資訊（Exif），地點與日期會自動填入。若沒有，可從「在地圖上選擇地點」「僅登錄縣市層級」「不保存位置資訊」中選擇。若不想精確留下住家等位置，可以把保存精度切換為「大致位置」。",
        },
        {
          title: "加上分類與備註後儲存",
          body: "從旅行、釣魚、用餐、帶狗出遊、溫泉、城堡等 12 種分類中選擇，再附上日期、備註與地點名稱儲存。「其他①～③」可以自由改名，方便建立露營、登山等專屬分類。",
        },
        {
          title: "用地圖與清單回顧",
          body: "儲存的體驗會同時出現在地圖圖釘與清單中。清單可在「時間順序」與「依區域」之間切換，「回顧回憶」則能像投影片一樣播放照片。",
        },
        {
          title: "製作分享圖並發佈",
          body: "在「製作分享圖」中可產生兩種 1200×630 的圖片：日本都道府縣征服地圖與體驗統計卡。圖中只包含紀錄數量與已填色的地區，不含照片、備註與地名。儲存後即可發佈到 X。",
        },
        {
          title: "定期備份",
          body: "資料只存在於本裝置中。用「儲存備份」匯出 JSON 檔案，換手機或換瀏覽器時即可透過「還原備份」復原。",
        },
      ],
      faqTitle: "常見問題",
      faqLead: "以下是初次使用者最常提出的問題。",
      faqs: [
        {
          q: "紀錄的資料保存在哪裡？",
          a: "僅保存在您裝置的瀏覽器內（IndexedDB）。照片、備註與位置資訊不會傳送到我們的伺服器，也不會向他人公開。",
        },
        {
          q: "需要註冊嗎？會收費嗎？",
          a: "兩者都不需要。無須註冊，免費即可直接使用。",
        },
        {
          q: "換手機或換瀏覽器後資料會怎樣？",
          a: "更換裝置或瀏覽器後資料不會延續，清除瀏覽資料也會將其刪除。請用「儲存備份」匯出檔案，再於新裝置的同一頁面透過「還原備份」載入。",
        },
        {
          q: "照片沒有位置資訊時該怎麼辦？",
          a: "可以點選地圖指定地點，或只選擇縣市層級登錄。若不想留下位置，也可以選擇「不保存位置資訊」。",
        },
        {
          q: "分享圖中會包含照片或備註嗎？",
          a: "不會。圖片中只呈現紀錄數量、各分類的數量以及已造訪地區的填色。照片、備註、地點名稱與座標都不會包含在內，圖片的產生也全部在瀏覽器內完成。",
        },
        {
          q: "如何把分享圖發佈到 X？",
          a: "先用「儲存圖片」下載 PNG，再於「分享到 X」開啟的發佈畫面中加入附件。在手機上可透過「連同圖片分享」直接把圖片交給系統的分享選單。",
        },
        {
          q: "我住在日本以外的地區，也能使用嗎？",
          a: "可以。地圖涵蓋全球，介面語言可從 7 種中選擇。都道府縣征服地圖僅在有日本境內紀錄時顯示，沒有時可以使用體驗統計卡。",
        },
        {
          q: "最多能保存多少筆紀錄？",
          a: "上限取決於裝置的剩餘空間。照片在儲存時會自動壓縮，單筆佔用較小，但空間不足時將無法儲存，因此建議經常備份。",
        },
      ],
    },
    heritageLink: "世界遺產護照",
    landing: {
      followX: "追蹤官方 X（@AIDRIVEPLAN）",
      journalName: "AI 旅行日記產生器",
      recordCta: "記錄體驗",
      heroEyebrow: "私密的生活紀錄",
      heroHeadline1: "用照片和地點，",
      heroHeadline2: "留下人生的體驗。",
      since: "Since 2026年6月",
      demoLocation1: "神奈川縣",
      demoLocation2: "東京都",
      journalBannerTitle: "用儲存的照片和備註，產生社群貼文與封面圖",
      journalBannerBody: "讀取人生體驗地圖的紀錄，可用於整理旅行後的回憶。",
      journalBannerCta: "前往 AI 旅行日記",
      journalWithSelectionCta: "用選取的紀錄產生社群貼文",
      queueProgress: "正在處理第 {{current}} / {{total}} 張",
      noticeAccordionTitle: "使用須知・關於資料保存",
      noticeTitle: "使用須知",
      noticeBody: "・禁止未經授權複製、挪用或再散布本網站的原始碼、設計與內容。",
      dataStorageTitle: "關於資料保存",
      dataStorageBody1: "・您登錄的照片、地點、備註等資料僅保存在您裝置的瀏覽器內（本機儲存），不會傳送至伺服器，也不會備份到雲端。",
      dataStorageBody2: "・清除瀏覽器的瀏覽資料/快取、重設或更換裝置、更換瀏覽器等操作，都可能導致資料遺失。",
      dataStorageBody3: "・對於資料遺失或損毀，本服務概不負責。建議您定期使用「儲存備份」按鈕將重要資料保存為檔案。",
      footerPrivacyLink: "隱私權政策",
      footerCookieLink: "關於 Cookie",
      footerBrandName: "AI 自駕遊規劃",
    },
  },

  es: {
    app: {
      title: "Mapa de Experiencias de Vida",
      subtitle: "Tus recuerdos, fijados en el mapa",
      backLink: "🚗 AI Planificador de viaje",
      desc: "Registra experiencias de vida — viajes, pesca, gastronomía, paseos con tu perro, balnearios, castillos, salidas con amigos, recuerdos en familia y más — con fotos y ubicaciones.",
      privacy:
        "Todos los registros se almacenan únicamente en tu dispositivo (navegador). Son privados y solo para tu revisión personal. Nada se envía al exterior.",
    },
    entries: {
      sectionTitle: "Experiencias registradas",
      replayBtn: "Ver recuerdos",
    },
    form: {
      sectionTitle: "Registrar una experiencia",
      gpsSuccess: "Ubicación encontrada en la foto. Verifica el lugar en el pin del mapa.",
      gpsSuccessHint: "Antes de guardar, ajusta la \"Precisión de ubicación\" si es necesario.",
      noGps: "No se encontró ubicación en la foto. Elige cómo registrar el lugar.",
      mapMode: "Seleccionar en el mapa",
      prefMode: "Registrar solo prefectura",
      noneMode: "Guardar sin ubicación",
      mapTapHint: "👉 Toca el mapa (derecha/abajo) para fijar la ubicación.",
      mapTapDone: "Ubicación fijada en el mapa.",
      prefLabel: "Prefectura",
      prefSelect: "Selecciona...",
      catLabel: "Categoría",
      catRequired: "*Obligatorio",
      dateLabel: "Fecha",
      memoLabel: "Nota",
      memoOptional: "(opcional)",
      memoPlaceholder: "Ej: Excursión de un día con mi esposa. El sushi estaba delicioso. Quiero volver.",
      locationNameLabel: "Nombre del lugar",
      locationNameOptional: "(opcional)",
      locationNamePlaceholder: "Ej: Castillo de Ueda, Puerto Jōgashima",
      precisionLabel: "Precisión de ubicación",
      precisionExact: "Ubicación exacta",
      precisionApprox: "Ubicación aproximada",
      precisionHint:
        "Elige \"Aproximada\" para no guardar coordenadas exactas (p. ej. zonas de pesca, cerca de casa). La info de prefectura siempre se guarda.",
      saveBtn: "Guardar esta experiencia",
      saving: "Guardando...",
      errPhoto: "Por favor selecciona una foto.",
      errPref: "Por favor selecciona una prefectura.",
      errMapTap: "Toca el mapa para fijar una ubicación.",
      errCoords: "Por favor ingresa latitud y longitud.",
      errSave: "Error al guardar.",
      coordsMode: "Ingresar coordenadas",
      coordsLatLabel: "Latitud",
      coordsLngLabel: "Longitud",
      coordsHint: "Haz clic derecho en un lugar en Google Maps → copia los números que aparecen. Puedes pegar el par completo separado por comas (p. ej. 35.796402, 139.531056) y se dividirá en latitud y longitud automáticamente.",
      editCategoryBtn: "Renombrar (emoji OK)",
    },
    card: {
      showOnMap: "Ver en mapa",
      deleteAria: "Eliminar",
      approxLocation: "Ubicación aprox.",
      prefectureOnly: "Solo prefectura",
      revisitLink: "Planificar una revisita",
      editBtn: "Editar",
      selectBtn: "Elegir para la ruta",
      selectedBtn: "Seleccionado",
      journalBtn: "Usar este registro",
      journalBtnDisabledHint: "Guarda una foto para crearlo solo con este registro.",
    },
    edit: {
      title: "Editar registro",
      saveBtn: "Guardar cambios",
      cancelBtn: "Cancelar",
      closeAria: "Cerrar",
      photoLocked: "La foto no se puede cambiar. Para usar otra foto, elimina este registro y vuelve a añadirlo.",
      prefDetecting: "Buscando la región a partir de las coordenadas…",
      prefDetected: "Se detectó «{{name}}» a partir de las coordenadas.",
      precisionWarn: "Al guardar como ubicación aproximada, las coordenadas se redondean a unos 1 km. Elige «Ubicación exacta» para conservar la posición precisa.",
    },
    list: {
      timeline: "Cronología",
      prefecture: "Por zona",
      journalHint: "Convierte tus fotos y registros en un diario de viaje y una publicación para redes.",
    },
    country: {
      label: "País de residencia",
    },
    timeline: {
      newest: "Más recientes",
      oldest: "Más antiguos",
      empty: "Sin registros aún. Añade una foto para guardar tu primer recuerdo.",
      tripJournalBtn: "Usar este viaje",
      tripLimitNote: "Los primeros {{max}} registros, del más antiguo al más reciente, se seleccionan al principio.",
    },
    prefecture: {
      backLink: "← Volver a la lista",
      countTemplate: "{{count}} entr.",
      all: "Todos",
      noFiltered: "Sin registros que coincidan.",
      noEntries: "Sin registros aún.",
    },
    backup: {
      exportBtn: "Guardar copia de seguridad",
      importBtn: "Restaurar copia de seguridad",
      exportEmpty: "No hay registros para guardar.",
      exportSuccess: "Copia de seguridad guardada.",
      exportError: "Error al guardar la copia de seguridad.",
      importSuccess: "{{count}} registros restaurados.",
      importError: "Error al restaurar.",
      hint: "Guarda todos tus registros en un archivo. Hazlo ocasionalmente en caso de cambios de dispositivo o borrado del navegador. También puedes compartir este archivo con tus hijos o familia como un álbum de recuerdos para las próximas generaciones.",
    },
    photo: {
      selectBtn: "Seleccionar foto",
      cameraBtn: "Tomar foto",
      bulkBtn: "Añadir varias fotos",
      bulkHint: "Se recomienda una foto por lugar y día. Si la foto no tiene GPS, puedes tocar el mapa para indicar la ubicación.",
      loading: "Cargando foto...",
      previewAlt: "Vista previa de la foto cargada",
    },
    replay: {
      title: "Ver recuerdos",
      closeAria: "Cerrar",
      choosePeriod: "Selecciona un período de tiempo",
      chooseCategory: "Filtrar por categoría",
      allCategories: "Todas",
      all: "Todo el tiempo",
      period1y: "Último año",
      period2y: "Últimos 2 años",
      period3y: "Últimos 3 años",
      noEntries: "Sin registros en este período.",
      changePeriodBtn: "Elegir período",
      changePeriod: "Cambiar período",
      pauseAria: "Pausa",
      playAria: "Reproducir",
    },
    map: {
      loading: "Cargando mapa...",
      newPin: "Ubicación del nuevo registro",
      approxSuffix: "(ubicación aprox.)",
      revisitLink: "Planificar una revisita",
      googleMapsLink: "Abrir en Google Maps",
    },
    errors: {
      loadFailed: "Error al cargar registros",
      deleteFailed: "Error al eliminar.",
      photoError: "Error al cargar la foto. Prueba con otra foto.",
    },
    drive: {
      planBtn: "Planificar ruta de recuerdos",
      hint: "{{count}} seleccionados",
      clearBtn: "Deseleccionar",
      selectHint: "Selecciona registros de Japón para planificar una ruta de recuerdos",
    },
    confirm: {
      delete: "¿Eliminar este registro?",
    },
    categories: {
      travel: "Viaje",
      fishing: "Pesca",
      food: "Gastronomía",
      dog: "Paseo con perro",
      onsen: "Balneario",
      castle: "Castillo",
      friends: "Con amigos",
      family: "Familia",
      other: "Otro",
      other1: "Personaliz. 1",
      other2: "Personaliz. 2",
      other3: "Personaliz. 3",
    },
    disclaimer: "Este servicio se ofrece con fines de registro personal. Todos los datos se almacenan únicamente en tu dispositivo y no se envían a servidores externos. El operador no se responsabiliza de ningún daño derivado del uso de este servicio. El contenido puede modificarse o interrumpirse sin previo aviso.",
    share: {
      buttonLabel: "Crear imagen para compartir",
      emptyHint: "Disponible cuando añadas un registro",
      modalTitle: "Crear imagen para compartir",
      closeAria: "Cerrar",
      tabMap: "Mapa de prefecturas",
      tabStats: "Tarjeta de estadísticas",
      rangeAll: "Todo el tiempo",
      rangeYear: "Este año",
      saveBtn: "Guardar imagen",
      shareImageBtn: "Compartir imagen",
      xBtn: "Compartir en X",
      savedMsg: "Imagen guardada.",
      saveError: "No se pudo guardar la imagen. Inténtalo de nuevo.",
      longPressHint: "Si no empieza la descarga, mantén pulsada la imagen de arriba (clic derecho en el ordenador) para guardarla.",
      privacyNote: "La imagen solo incluye el número de registros y las prefecturas coloreadas. Nunca incluye fotos, notas ni nombres de lugares.",
      noJapanNote: "Aún no hay registros en Japón, así que el mapa de prefecturas no está disponible. Usa la tarjeta de estadísticas.",
      postText: "Registrando mis recuerdos en el Mapa de Experiencias de Vida 📍 {{count}} experiencias registradas hasta ahora",
      hashtags: "MapaDeExperiencias,LifeLog",
      cardMapTitle: "Mapa de prefecturas de Japón",
      cardStatsTitle: "Mis experiencias",
      cardPrefLabel: "Prefecturas visitadas",
      cardTotalLabel: "Experiencias registradas",
      cardCountValue: "{{count}}",
      cardCountUnit: "registros",
      cardCategoryLabel: "Por categoría",
      cardSinceLabel: "Desde",
      cardDurationYM: "{{years}} a {{months}} m",
      cardDurationM: "{{months}} meses",
      cardRangeYear: "Este año",
      cardRangeAll: "Todo el tiempo",
      cardOthers: "+{{count}} más",
    },
    guide: {
      howtoTitle: "Cómo funciona",
      howtoLead:
        "Puedes empezar con una sola foto. Sin registro ni coste, y todos los recuerdos se guardan únicamente en tu dispositivo.",
      steps: [
        {
          title: "Elige una foto",
          body: "Selecciona una foto con «Elegir foto» o «Hacer foto». Con «Añadir varias fotos» puedes registrar varias seguidas. Las fotos se comprimen en tu dispositivo a un JPEG de 1600 px en el lado largo y nunca se envían a ningún servidor.",
        },
        {
          title: "Comprueba el lugar y la fecha",
          body: "Si la foto lleva datos de ubicación (Exif), el lugar y la fecha se rellenan solos. Si no, elige entre «Elegir el lugar en el mapa», «Registrar solo la prefectura» o «Guardar sin ubicación». Si prefieres no señalar tu casa con exactitud, cambia la precisión a «Zona aproximada».",
        },
        {
          title: "Añade categoría y nota, y guarda",
          body: "Elige entre 12 categorías como viaje, pesca, comida, salidas con perro, aguas termales o castillos, y añade fecha, nota y nombre del lugar. «Personalizada 1–3» se puede renombrar libremente para crear tus propias categorías de acampada, senderismo o lo que quieras.",
        },
        {
          title: "Repasa en el mapa y en la lista",
          body: "Cada experiencia guardada aparece como chincheta en el mapa y en la lista. Puedes alternar la lista entre «Cronología» y «Por zona», o abrir «Ver recuerdos» para reproducir tus fotos como una presentación.",
        },
        {
          title: "Crea una imagen para compartir",
          body: "«Crear imagen para compartir» genera dos tipos de imagen de 1200×630: el mapa de prefecturas de Japón y la tarjeta de estadísticas. Solo contienen el número de registros y las prefecturas coloreadas: nunca fotos, notas ni nombres de lugares. Guárdala y publícala en X.",
        },
        {
          title: "Haz copias de seguridad",
          body: "Tus datos solo existen en este dispositivo. Usa «Guardar copia» para exportar un archivo JSON y «Restaurar copia» para recuperarlo todo al cambiar de móvil o de navegador.",
        },
      ],
      faqTitle: "Preguntas frecuentes",
      faqLead: "Las dudas más habituales de quienes empiezan a usarlo.",
      faqs: [
        {
          q: "¿Dónde se guardan mis datos?",
          a: "Solo en el navegador de tu dispositivo (IndexedDB). Tus fotos, notas y ubicaciones nunca se envían a nuestros servidores ni se muestran a nadie más.",
        },
        {
          q: "¿Necesito una cuenta? ¿Tiene algún coste?",
          a: "Ninguna de las dos cosas. No hay registro ni cargo alguno: puedes empezar directamente.",
        },
        {
          q: "¿Qué pasa con mis datos si cambio de móvil o de navegador?",
          a: "No se transfieren, y borrar los datos de navegación también los elimina. Exporta un archivo con «Guardar copia» y cárgalo con «Restaurar copia» en la misma página del nuevo dispositivo.",
        },
        {
          q: "¿Y si mi foto no tiene datos de ubicación?",
          a: "Toca el mapa para indicar el lugar o registra solo la prefectura. Si prefieres no guardar ninguna ubicación, elige «Guardar sin ubicación».",
        },
        {
          q: "¿Las imágenes para compartir incluyen mis fotos o notas?",
          a: "No. La imagen muestra únicamente el número de registros, el recuento por categoría y las prefecturas coloreadas. Nunca incluye fotos, notas, nombres de lugares ni coordenadas, y se genera por completo dentro de tu navegador.",
        },
        {
          q: "¿Cómo publico una imagen en X?",
          a: "Descarga el PNG con «Guardar imagen» y adjúntalo en la ventana de publicación que abre «Compartir en X». En el móvil, «Compartir con imagen» entrega la imagen directamente al menú de compartir.",
        },
        {
          q: "Vivo fuera de Japón, ¿puedo usarlo igualmente?",
          a: "Sí. El mapa cubre todo el mundo y la interfaz está disponible en 7 idiomas. El mapa de prefecturas solo aparece si tienes registros en Japón; si no, puedes usar la tarjeta de estadísticas.",
        },
        {
          q: "¿Cuántos recuerdos puedo guardar?",
          a: "El límite depende del espacio libre de tu dispositivo. Las fotos se comprimen automáticamente, así que cada registro ocupa poco, pero si te quedas sin espacio no podrás guardar más: haz copias con frecuencia.",
        },
      ],
    },
    heritageLink: "Patrimonio Mundial",
    landing: {
      followX: "Síguenos en X (@AIDRIVEPLAN)",
      journalName: "AI Creador de Diario de Viaje",
      recordCta: "Registrar una experiencia",
      heroEyebrow: "Un registro de vida privado",
      heroHeadline1: "Con fotos y lugares,",
      heroHeadline2: "conserva tus experiencias de vida.",
      since: "Desde junio de 2026",
      demoLocation1: "Kanagawa",
      demoLocation2: "Tokio",
      journalBannerTitle: "Convierte tus fotos y notas guardadas en una publicación y una imagen destacada",
      journalBannerBody: "Carga tus registros del Mapa de Experiencias de Vida para organizar tus recuerdos de viaje.",
      journalBannerCta: "Ir a AI Diario de Viaje",
      journalWithSelectionCta: "Publicar los registros seleccionados en redes sociales",
      queueProgress: "Procesando {{current}} / {{total}}",
      noticeAccordionTitle: "Términos de uso y almacenamiento de datos",
      noticeTitle: "Términos de uso",
      noticeBody: "· Queda prohibido copiar, reutilizar o redistribuir sin permiso el código fuente, el diseño o el contenido de este sitio.",
      dataStorageTitle: "Sobre el almacenamiento de datos",
      dataStorageBody1: "· Las fotos, lugares, notas y demás datos que registres se guardan únicamente en el navegador de tu dispositivo (almacenamiento local). No se envían a ningún servidor ni se respaldan en la nube.",
      dataStorageBody2: "· Los datos pueden perderse al borrar los datos de navegación o la caché, al restablecer o cambiar de dispositivo, o al cambiar de navegador.",
      dataStorageBody3: "· No nos responsabilizamos de la pérdida o el daño de los datos. Te recomendamos guardar periódicamente un archivo con el botón «Guardar copia» para lo que sea importante.",
      footerPrivacyLink: "Política de privacidad",
      footerCookieLink: "Sobre las cookies",
      footerBrandName: "AI Drive Planner",
    },
  },

  ru: {
    app: {
      title: "Карта жизненного опыта",
      subtitle: "Ваши воспоминания на карте",
      backLink: "🚗 AI Планировщик поездок",
      desc: "Записывайте жизненные впечатления — путешествия, рыбалку, гастрономию, прогулки с собакой, горячие источники, замки, прогулки с друзьями, семейные воспоминания и многое другое — с фотографиями и местами.",
      privacy:
        "Все записи хранятся только на вашем устройстве (браузере). Они конфиденциальны и предназначены только для личного просмотра. Ничто не отправляется за пределы устройства.",
    },
    entries: {
      sectionTitle: "Записанные впечатления",
      replayBtn: "Просмотр воспоминаний",
    },
    form: {
      sectionTitle: "Записать впечатление",
      gpsSuccess: "Местоположение найдено в фото. Проверьте место на булавке карты.",
      gpsSuccessHint: "Перед сохранением при необходимости настройте «Точность местоположения».",
      noGps: "В фото не найдено местоположение. Выберите способ регистрации места.",
      mapMode: "Выбрать на карте",
      prefMode: "Только префектура",
      noneMode: "Сохранить без местоположения",
      mapTapHint: "👉 Нажмите на карту (справа/снизу), чтобы указать место.",
      mapTapDone: "Место указано на карте.",
      prefLabel: "Префектура",
      prefSelect: "Выберите...",
      catLabel: "Категория",
      catRequired: "*Обязательно",
      dateLabel: "Дата",
      memoLabel: "Заметка",
      memoOptional: "(необязательно)",
      memoPlaceholder: "Напр.: Однодневная поездка с супругой. Суши было восхитительно. Хочу вернуться.",
      locationNameLabel: "Название места",
      locationNameOptional: "(необязательно)",
      locationNamePlaceholder: "Напр.: Замок Уэда, порт Дзёгасима",
      precisionLabel: "Точность местоположения",
      precisionExact: "Точное место",
      precisionApprox: "Приблизительное место",
      precisionHint:
        "Выберите «Приблизительное», чтобы не сохранять точные координаты (напр., места рыбалки, район дома). Информация о префектуре всегда сохраняется.",
      saveBtn: "Сохранить впечатление",
      saving: "Сохранение...",
      errPhoto: "Пожалуйста, выберите фото.",
      errPref: "Пожалуйста, выберите префектуру.",
      errMapTap: "Нажмите на карту, чтобы указать место.",
      errCoords: "Пожалуйста, введите широту и долготу.",
      errSave: "Ошибка сохранения.",
      coordsMode: "Ввести координаты вручную",
      coordsLatLabel: "Широта (Latitude)",
      coordsLngLabel: "Долгота (Longitude)",
      coordsHint: "Нажмите правой кнопкой мыши на место в Google Maps → скопируйте числа. Можно вставить всю пару через запятую (например, 35.796402, 139.531056) — она автоматически разделится на широту и долготу.",
      editCategoryBtn: "Переименовать (эмодзи OK)",
    },
    card: {
      showOnMap: "Показать на карте",
      deleteAria: "Удалить",
      approxLocation: "Прибл. место",
      prefectureOnly: "Только префектура",
      revisitLink: "Запланировать повторный визит",
      editBtn: "Изменить",
      selectBtn: "Выбрать для маршрута",
      selectedBtn: "Выбрано",
      journalBtn: "Из этой записи",
      journalBtnDisabledHint: "Сохраните фото, чтобы создать по одной этой записи.",
    },
    edit: {
      title: "Редактирование записи",
      saveBtn: "Сохранить изменения",
      cancelBtn: "Отмена",
      closeAria: "Закрыть",
      photoLocked: "Фотографию нельзя изменить. Чтобы использовать другое фото, удалите эту запись и добавьте её заново.",
      prefDetecting: "Определяем регион по координатам…",
      prefDetected: "По координатам определён регион «{{name}}».",
      precisionWarn: "При сохранении как «примерное место» координаты округляются примерно до 1 км. Выберите «точное место», чтобы сохранить точную позицию.",
    },
    list: {
      timeline: "Хронология",
      prefecture: "По области",
      journalHint: "Из фото и записей можно собрать дневник путешествия и пост для соцсетей.",
    },
    country: {
      label: "Страна проживания",
    },
    timeline: {
      newest: "Новые сначала",
      oldest: "Старые сначала",
      empty: "Записей пока нет. Добавьте фото, чтобы сохранить первое воспоминание.",
      tripJournalBtn: "Из этой поездки",
      tripLimitNote: "Сначала выбираются первые {{max}} записей, от старых к новым.",
    },
    prefecture: {
      backLink: "← Вернуться к списку",
      countTemplate: "{{count}} зап.",
      all: "Все",
      noFiltered: "Нет подходящих записей.",
      noEntries: "Записей пока нет.",
    },
    backup: {
      exportBtn: "Сохранить резервную копию",
      importBtn: "Восстановить из копии",
      exportEmpty: "Нет записей для сохранения.",
      exportSuccess: "Резервная копия сохранена.",
      exportError: "Ошибка сохранения резервной копии.",
      importSuccess: "Восстановлено {{count}} записей.",
      importError: "Ошибка восстановления.",
      hint: "Сохраняйте все записи в один файл. Делайте это периодически на случай смены устройства или очистки данных браузера. Вы также можете передать этот файл детям или семье как памятный фотоальбом.",
    },
    photo: {
      selectBtn: "Выбрать фото",
      cameraBtn: "Сделать фото",
      bulkBtn: "Добавить несколько фото",
      bulkHint: "Рекомендуется одно фото на место и день. Если в фото нет GPS-данных, укажите место на карте.",
      loading: "Загрузка фото...",
      previewAlt: "Предпросмотр загруженного фото",
    },
    replay: {
      title: "Просмотр воспоминаний",
      closeAria: "Закрыть",
      choosePeriod: "Выберите период для просмотра",
      chooseCategory: "Фильтр по категории",
      allCategories: "Все",
      all: "Всё время",
      period1y: "Последний год",
      period2y: "Последние 2 года",
      period3y: "Последние 3 года",
      noEntries: "За этот период записей нет.",
      changePeriodBtn: "Выбрать период",
      changePeriod: "Изменить период",
      pauseAria: "Пауза",
      playAria: "Воспроизвести",
    },
    map: {
      loading: "Загрузка карты...",
      newPin: "Место новой записи",
      approxSuffix: "(прибл. место)",
      revisitLink: "Запланировать повторный визит",
      googleMapsLink: "Открыть в Google Maps",
    },
    errors: {
      loadFailed: "Ошибка загрузки записей",
      deleteFailed: "Ошибка удаления.",
      photoError: "Ошибка загрузки фото. Попробуйте другое фото.",
    },
    drive: {
      planBtn: "Запланировать поездку по воспоминаниям",
      hint: "Выбрано: {{count}}",
      clearBtn: "Снять выбор",
      selectHint: "Выберите записи Японии для планирования маршрута по воспоминаниям",
    },
    confirm: {
      delete: "Удалить эту запись?",
    },
    categories: {
      travel: "Путешествие",
      fishing: "Рыбалка",
      food: "Гастрономия",
      dog: "Прогулка с собакой",
      onsen: "Горячий источник",
      castle: "Замок",
      friends: "С друзьями",
      family: "Семья",
      other: "Другое",
      other1: "Другое 1",
      other2: "Другое 2",
      other3: "Другое 3",
    },
    disclaimer: "Данный сервис предоставляется в личных целях записи воспоминаний. Все данные хранятся исключительно на вашем устройстве и не отправляются на внешние серверы. Оператор не несёт ответственности за любой ущерб, возникший в результате использования сервиса. Содержание может быть изменено или прекращено без предварительного уведомления.",
    share: {
      buttonLabel: "Создать изображение",
      emptyHint: "Доступно после добавления записи",
      modalTitle: "Создать изображение для публикации",
      closeAria: "Закрыть",
      tabMap: "Карта префектур",
      tabStats: "Карточка статистики",
      rangeAll: "За всё время",
      rangeYear: "В этом году",
      saveBtn: "Сохранить изображение",
      shareImageBtn: "Поделиться изображением",
      xBtn: "Поделиться в X",
      savedMsg: "Изображение сохранено.",
      saveError: "Не удалось сохранить изображение. Попробуйте ещё раз.",
      longPressHint: "Если загрузка не началась, нажмите и удерживайте изображение выше (на компьютере — правой кнопкой мыши), чтобы сохранить его.",
      privacyNote: "На изображении только количество записей и закрашенные префектуры. Фотографии, заметки и названия мест никогда не включаются.",
      noJapanNote: "Записей в Японии пока нет, поэтому карта префектур недоступна. Используйте карточку статистики.",
      postText: "Записываю воспоминания на Карте жизненного опыта 📍 Уже сохранено записей: {{count}}",
      hashtags: "КартаЖизни,LifeLog",
      cardMapTitle: "Карта префектур Японии",
      cardStatsTitle: "Мои впечатления",
      cardPrefLabel: "Посещено префектур",
      cardTotalLabel: "Записей о впечатлениях",
      cardCountValue: "{{count}}",
      cardCountUnit: "записей",
      cardCategoryLabel: "По категориям",
      cardSinceLabel: "С",
      cardDurationYM: "{{years}} г. {{months}} мес.",
      cardDurationM: "{{months}} мес.",
      cardRangeYear: "В этом году",
      cardRangeAll: "За всё время",
      cardOthers: "и ещё {{count}}",
    },
    guide: {
      howtoTitle: "Как это работает",
      howtoLead:
        "Начать можно с одной фотографии. Регистрация и оплата не нужны, а все записи хранятся только на вашем устройстве.",
      steps: [
        {
          title: "Выберите фотографию",
          body: "Выберите снимок через «Выбрать фото» или «Сделать фото». Кнопка «Добавить несколько фото» позволяет загрузить сразу серию. Фотографии сжимаются прямо на устройстве в JPEG с длинной стороной 1600 px и никуда не отправляются.",
        },
        {
          title: "Проверьте место и дату",
          body: "Если в снимке есть геоданные (Exif), место и дата заполнятся автоматически. Если их нет, выберите «Указать место на карте», «Записать только префектуру» или «Сохранить без места». Чтобы не отмечать дом слишком точно, переключите точность на «Приблизительное место».",
        },
        {
          title: "Добавьте категорию и заметку",
          body: "Выберите одну из 12 категорий — путешествие, рыбалка, еда, прогулка с собакой, горячие источники, замки и другие — и добавьте дату, заметку и название места. «Своя 1–3» можно переименовать, создав собственные категории для кемпинга, походов и чего угодно ещё.",
        },
        {
          title: "Просматривайте на карте и в списке",
          body: "Каждая запись появляется и меткой на карте, и в списке. Список переключается между режимами «Хронология» и «По регионам», а «Посмотреть воспоминания» проигрывает фотографии как слайд-шоу.",
        },
        {
          title: "Создайте картинку для публикации",
          body: "Кнопка «Создать картинку» строит два вида изображений 1200×630: карту префектур Японии и карточку статистики. В них попадают только количество записей и закрашенные префектуры — никаких фотографий, заметок и названий мест. Сохраните и опубликуйте в X.",
        },
        {
          title: "Регулярно делайте резервные копии",
          body: "Данные существуют только на этом устройстве. «Сохранить копию» выгружает файл JSON, а «Восстановить копию» вернёт всё обратно при смене телефона или браузера.",
        },
      ],
      faqTitle: "Частые вопросы",
      faqLead: "То, о чём чаще всего спрашивают новые пользователи.",
      faqs: [
        {
          q: "Где хранятся мои данные?",
          a: "Только в браузере на вашем устройстве (IndexedDB). Фотографии, заметки и координаты не отправляются на наши серверы и никому не показываются.",
        },
        {
          q: "Нужна ли учётная запись? Есть ли плата?",
          a: "Ни то, ни другое. Регистрация не требуется, сервис бесплатный — просто начните пользоваться.",
        },
        {
          q: "Что будет с данными при смене телефона или браузера?",
          a: "Они не переносятся, а очистка данных браузера их удалит. Выгрузите файл через «Сохранить копию» и загрузите его через «Восстановить копию» на той же странице нового устройства.",
        },
        {
          q: "Что делать, если в фотографии нет геоданных?",
          a: "Укажите место касанием по карте или запишите только префектуру. Если место сохранять не хочется, выберите «Сохранить без места».",
        },
        {
          q: "Попадают ли в картинку мои фотографии и заметки?",
          a: "Нет. На изображении показаны только количество записей, число записей по категориям и закрашенные префектуры. Фотографии, заметки, названия мест и координаты не включаются никогда, а сама картинка целиком создаётся в браузере.",
        },
        {
          q: "Как опубликовать картинку в X?",
          a: "Скачайте PNG кнопкой «Сохранить картинку» и приложите его в окне публикации, которое открывает «Поделиться в X». На смартфоне «Поделиться с картинкой» передаёт изображение прямо в меню отправки.",
        },
        {
          q: "Я живу не в Японии — сервис мне подойдёт?",
          a: "Да. Карта охватывает весь мир, а интерфейс доступен на 7 языках. Карта префектур появляется только при наличии записей в Японии; в остальных случаях используйте карточку статистики.",
        },
        {
          q: "Сколько записей можно сохранить?",
          a: "Предел зависит от свободного места на устройстве. Фотографии сжимаются автоматически, поэтому каждая запись занимает немного, но при нехватке места сохранение перестанет работать — делайте копии почаще.",
        },
      ],
    },
    heritageLink: "Всемирное наследие",
    landing: {
      followX: "Подписывайтесь на нас в X (@AIDRIVEPLAN)",
      journalName: "AI Конструктор путевого дневника",
      recordCta: "Записать впечатление",
      heroEyebrow: "Приватный дневник жизни",
      heroHeadline1: "С фотографиями и местами",
      heroHeadline2: "сохраняйте впечатления от жизни.",
      since: "С июня 2026",
      demoLocation1: "Канагава",
      demoLocation2: "Токио",
      journalBannerTitle: "Превратите сохранённые фото и заметки в пост и обложку для соцсетей",
      journalBannerBody: "Загрузите записи с Карты жизненного опыта, чтобы собрать воспоминания о поездке.",
      journalBannerCta: "Открыть AI Дневник путешествий",
      journalWithSelectionCta: "Опубликовать выбранные записи в соцсетях",
      queueProgress: "Обработка {{current}} / {{total}}",
      noticeAccordionTitle: "Условия использования и хранение данных",
      noticeTitle: "Условия использования",
      noticeBody: "· Копирование, использование или распространение исходного кода, дизайна и содержимого этого сайта без разрешения запрещено.",
      dataStorageTitle: "О хранении данных",
      dataStorageBody1: "· Фотографии, места, заметки и другие данные, которые вы регистрируете, хранятся только в браузере вашего устройства (локальное хранилище). Ничего не отправляется на сервер и не резервируется в облаке.",
      dataStorageBody2: "· Данные могут быть утеряны при очистке данных браузера или кэша, сбросе или замене устройства, а также при смене браузера.",
      dataStorageBody3: "· Мы не несём ответственности за потерю или повреждение данных. Рекомендуем периодически сохранять файл с помощью кнопки «Сохранить резервную копию» для всего важного.",
      footerPrivacyLink: "Политика конфиденциальности",
      footerCookieLink: "О файлах cookie",
      footerBrandName: "AI Планировщик поездок",
    },
  },
};
