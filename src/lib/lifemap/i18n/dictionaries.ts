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
    errSave: string;
  };
  card: {
    showOnMap: string;
    deleteAria: string;
    approxLocation: string;
    prefectureOnly: string;
    revisitLink: string;
  };
  list: {
    timeline: string;
    prefecture: string;
  };
  country: {
    label: string;
  };
  timeline: {
    newest: string;
    oldest: string;
    empty: string;
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
  };
  disclaimer: string;
  heritageLink: string;
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
      mapTapDone: "✅ 地図で場所を指定しました。",
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
      errSave: "保存に失敗しました。",
    },
    card: {
      showOnMap: "地図で見る",
      deleteAria: "削除",
      approxLocation: "おおまかな場所",
      prefectureOnly: "都道府県のみ",
      revisitLink: "この場所へ再訪プラン作成",
    },
    list: {
      timeline: "時系列",
      prefecture: "地域別",
    },
    country: {
      label: "居住国",
    },
    timeline: {
      newest: "新しい順",
      oldest: "古い順",
      empty: "まだ記録がありません。写真を追加して最初の思い出を記録しましょう。",
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
      hint: "全記録を1つのファイルに保存できます。機種変更や別端末への移行、ブラウザのデータ削除に備えてときどき保存してください。また、このファイルをお子様やご家族に渡すことで、思い出のアルバムとして引き継ぐこともできます。",
    },
    photo: {
      selectBtn: "写真を選ぶ",
      cameraBtn: "カメラで撮影",
      bulkBtn: "まとめて追加（複数枚）",
      bulkHint: "同じ場所・同じ日の写真は1枚を目安にしてください。",
      loading: "写真を読み込み中...",
      previewAlt: "アップロードした写真のプレビュー",
    },
    replay: {
      title: "思い出を振り返る",
      closeAria: "閉じる",
      choosePeriod: "振り返る期間を選んでください",
      chooseCategory: "カテゴリで絞り込む（任意）",
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
    },
    disclaimer: "本サービスは個人の記録目的で提供されます。記録データはすべてお使いの端末内にのみ保存され、外部サーバーへの送信は行いません。本サービスの利用により生じた損害について、運営者は一切の責任を負いません。コンテンツは予告なく変更・終了する場合があります。",
    heritageLink: "世界遺産パスポート",
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
      mapTapDone: "✅ Location set on map.",
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
      errSave: "Failed to save.",
    },
    card: {
      showOnMap: "View on map",
      deleteAria: "Delete",
      approxLocation: "Approx. location",
      prefectureOnly: "Prefecture only",
      revisitLink: "Plan a revisit here",
    },
    list: {
      timeline: "Timeline",
      prefecture: "By area",
    },
    country: {
      label: "Home country",
    },
    timeline: {
      newest: "Newest first",
      oldest: "Oldest first",
      empty: "No records yet. Add a photo to save your first memory.",
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
      bulkHint: "Aim for one photo per location per day.",
      loading: "Loading photo...",
      previewAlt: "Preview of uploaded photo",
    },
    replay: {
      title: "View Memories",
      closeAria: "Close",
      choosePeriod: "Select a time period",
      chooseCategory: "Filter by category (optional)",
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
    },
    disclaimer: "This service is provided for personal recording purposes. All data is stored solely on your device and is never sent to external servers. The operator accepts no responsibility for any damages arising from use of this service. Content may be changed or discontinued without notice.",
    heritageLink: "World Heritage Passport",
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
      mapTapDone: "✅ 지도에서 장소를 지정했습니다.",
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
      errSave: "저장에 실패했습니다.",
    },
    card: {
      showOnMap: "지도에서 보기",
      deleteAria: "삭제",
      approxLocation: "대략적인 위치",
      prefectureOnly: "광역단체만",
      revisitLink: "이 장소 재방문 계획 세우기",
    },
    list: {
      timeline: "시계열",
      prefecture: "지역별",
    },
    country: {
      label: "거주 국가",
    },
    timeline: {
      newest: "최신순",
      oldest: "오래된 순",
      empty: "아직 기록이 없습니다. 사진을 추가해 첫 번째 추억을 기록하세요.",
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
      bulkHint: "같은 장소·같은 날의 사진은 1장을 기준으로 해 주세요.",
      loading: "사진 불러오는 중...",
      previewAlt: "업로드한 사진 미리보기",
    },
    replay: {
      title: "추억 되돌아보기",
      closeAria: "닫기",
      choosePeriod: "되돌아볼 기간을 선택하세요",
      chooseCategory: "카테고리로 필터링（선택사항）",
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
    },
    disclaimer: "본 서비스는 개인 기록 목적으로 제공됩니다. 모든 데이터는 기기에만 저장되며 외부 서버로 전송되지 않습니다. 본 서비스 이용으로 인한 손해에 대해 운영자는 일체의 책임을 지지 않습니다. 서비스 내용은 예고 없이 변경·종료될 수 있습니다.",
    heritageLink: "세계유산 여권",
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
      mapTapDone: "✅ 已在地图上指定位置。",
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
      errSave: "保存失败。",
    },
    card: {
      showOnMap: "在地图上查看",
      deleteAria: "删除",
      approxLocation: "大致位置",
      prefectureOnly: "仅都道府县",
      revisitLink: "制定重访计划",
    },
    list: {
      timeline: "时间轴",
      prefecture: "按地区",
    },
    country: {
      label: "居住国家",
    },
    timeline: {
      newest: "从新到旧",
      oldest: "从旧到新",
      empty: "暂无记录，请添加照片记录您的第一个回忆。",
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
      bulkHint: "建议同一地点同一天只上传1张照片。",
      loading: "正在加载照片...",
      previewAlt: "已上传照片的预览",
    },
    replay: {
      title: "回顾回忆",
      closeAria: "关闭",
      choosePeriod: "请选择回顾的时间段",
      chooseCategory: "按类别筛选（可选）",
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
    },
    disclaimer: "本服务仅供个人记录使用。所有数据仅保存在您的设备上，不会发送至外部服务器。因使用本服务造成的任何损失，运营方概不负责。内容可能在不另行通知的情况下更改或终止。",
    heritageLink: "世界遗产护照",
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
      mapTapDone: "✅ 已在地圖上指定位置。",
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
      errSave: "儲存失敗。",
    },
    card: {
      showOnMap: "在地圖上查看",
      deleteAria: "刪除",
      approxLocation: "大致位置",
      prefectureOnly: "僅都道府縣",
      revisitLink: "制定重訪計劃",
    },
    list: {
      timeline: "時間軸",
      prefecture: "按地區",
    },
    country: {
      label: "居住國家",
    },
    timeline: {
      newest: "從新到舊",
      oldest: "從舊到新",
      empty: "尚無記錄，請新增照片記錄您的第一個回憶。",
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
      bulkHint: "建議同一地點同一天只上傳1張照片。",
      loading: "正在載入照片...",
      previewAlt: "已上傳照片的預覽",
    },
    replay: {
      title: "回顧回憶",
      closeAria: "關閉",
      choosePeriod: "請選擇回顧的時間段",
      chooseCategory: "依類別篩選（選填）",
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
    },
    disclaimer: "本服務僅供個人記錄使用。所有資料僅保存在您的裝置上，不會傳送至外部伺服器。因使用本服務造成的任何損失，營運方概不負責。內容可能在不另行通知的情況下更改或終止。",
    heritageLink: "世界遺產護照",
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
      mapTapDone: "✅ Ubicación fijada en el mapa.",
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
      errSave: "Error al guardar.",
    },
    card: {
      showOnMap: "Ver en mapa",
      deleteAria: "Eliminar",
      approxLocation: "Ubicación aprox.",
      prefectureOnly: "Solo prefectura",
      revisitLink: "Planificar una revisita",
    },
    list: {
      timeline: "Cronología",
      prefecture: "Por zona",
    },
    country: {
      label: "País de residencia",
    },
    timeline: {
      newest: "Más recientes",
      oldest: "Más antiguos",
      empty: "Sin registros aún. Añade una foto para guardar tu primer recuerdo.",
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
      bulkHint: "Se recomienda una foto por lugar y día.",
      loading: "Cargando foto...",
      previewAlt: "Vista previa de la foto cargada",
    },
    replay: {
      title: "Ver recuerdos",
      closeAria: "Cerrar",
      choosePeriod: "Selecciona un período de tiempo",
      chooseCategory: "Filtrar por categoría (opcional)",
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
    },
    disclaimer: "Este servicio se ofrece con fines de registro personal. Todos los datos se almacenan únicamente en tu dispositivo y no se envían a servidores externos. El operador no se responsabiliza de ningún daño derivado del uso de este servicio. El contenido puede modificarse o interrumpirse sin previo aviso.",
    heritageLink: "Patrimonio Mundial",
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
      mapTapDone: "✅ Место указано на карте.",
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
      errSave: "Ошибка сохранения.",
    },
    card: {
      showOnMap: "Показать на карте",
      deleteAria: "Удалить",
      approxLocation: "Прибл. место",
      prefectureOnly: "Только префектура",
      revisitLink: "Запланировать повторный визит",
    },
    list: {
      timeline: "Хронология",
      prefecture: "По области",
    },
    country: {
      label: "Страна проживания",
    },
    timeline: {
      newest: "Новые сначала",
      oldest: "Старые сначала",
      empty: "Записей пока нет. Добавьте фото, чтобы сохранить первое воспоминание.",
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
      bulkHint: "Рекомендуется одно фото на место и день.",
      loading: "Загрузка фото...",
      previewAlt: "Предпросмотр загруженного фото",
    },
    replay: {
      title: "Просмотр воспоминаний",
      closeAria: "Закрыть",
      choosePeriod: "Выберите период для просмотра",
      chooseCategory: "Фильтр по категории (необязательно)",
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
    },
    disclaimer: "Данный сервис предоставляется в личных целях записи воспоминаний. Все данные хранятся исключительно на вашем устройстве и не отправляются на внешние серверы. Оператор не несёт ответственности за любой ущерб, возникший в результате использования сервиса. Содержание может быть изменено или прекращено без предварительного уведомления.",
    heritageLink: "Всемирное наследие",
  },
};
