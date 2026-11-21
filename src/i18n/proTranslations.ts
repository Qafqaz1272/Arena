import type { Language } from '../types/football';

export interface ProTranslations {
  navSections: {
    analytics: string;
    tools: string;
    transparency: string;
  };
  nav: {
    livePanel: string;
    valueBets: string;
    backtesting: string;
    teamCompare: string;
    bankroll: string;
    howItWorks: string;
    responsibleGambling: string;
  };
  pwa: {
    installApp: string;
    iosTitle: string;
    iosStep1: string;
    iosStep2: string;
    close: string;
    offlineBanner: string;
  };
  export: {
    csvButton: string;
    pdfButton: string;
    exportedCsvToast: string;
    exportedPdfToast: string;
  };
  watchlistAlerts: {
    title: string;
    subtitle: string;
    inAppLabel: string;
    browserLabel: string;
    enableBrowser: string;
    browserGranted: string;
    browserDenied: string;
    browserUnsupported: string;
    testAlert: string;
    clearHistory: string;
    recentAlerts: string;
    noAlertsYet: string;
    matchLiveTitle: string;
    goalTitle: string;
    probShiftTitle: string;
    nowLiveSuffix: string;
    probMovedPrefix: string;
    testTitle: string;
    testBody: string;
  };
  valueBets: {
    title: string;
    subtitle: string;
    estimateLabel: string;
    apiSyncButton: string;
    apiNotConfigured: string;
    apiLoadedPrefix: string;
    manualHint: string;
    onlyPositiveEv: string;
    matchCol: string;
    selectionCol: string;
    bookmakerOddsCol: string;
    impliedProbCol: string;
    modelProbCol: string;
    evCol: string;
    kellyCol: string;
    marginLabel: string;
    positiveBadge: string;
    negativeBadge: string;
    kpiScanned: string;
    kpiPositiveCount: string;
    kpiBestEv: string;
    kpiAvgEdge: string;
    enterOddsPlaceholder: string;
    resetOdds: string;
    prefillSampleOdds: string;
    noPositiveYet: string;
    disclaimer: string;
  };
  backtesting: {
    title: string;
    subtitle: string;
    kpiEvaluated: string;
    kpiBrier: string;
    kpiLogLoss: string;
    kpiHitRate: string;
    kpiEce: string;
    brierBenchmark: string;
    logLossBenchmark: string;
    calibrationTitle: string;
    calibrationSubtitle: string;
    predictedAxis: string;
    actualAxis: string;
    perfectLine: string;
    modelLine: string;
    leagueBreakdownTitle: string;
    recentEvaluatedTitle: string;
    leagueCol: string;
    samplesCol: string;
    hitRateCol: string;
    brierCol: string;
    logLossCol: string;
    noData: string;
  };
  livePanel: {
    title: string;
    subtitle: string;
    autoRefresh: string;
    intervalLabel: string;
    refreshNow: string;
    lastUpdated: string;
    nextRefreshIn: string;
    liveCountLabel: string;
    deltaLegend: string;
    noLiveMatchesTitle: string;
    noLiveMatchesDesc: string;
    upcomingSoonTitle: string;
    scoreCol: string;
    probShiftLabel: string;
    openAnalysis: string;
  };
  teamCompare: {
    title: string;
    subtitle: string;
    teamA: string;
    teamB: string;
    swapTeams: string;
    sameTeamWarning: string;
    formTitle: string;
    ratingsTitle: string;
    attackRating: string;
    defenseRating: string;
    goalsPerGame: string;
    concededPerGame: string;
    xgPerGame: string;
    xgaPerGame: string;
    pointsPerGame: string;
    winRate: string;
    homeAwayTitle: string;
    h2hTitle: string;
    noH2H: string;
    simulationTitle: string;
    simulationSubtitle: string;
    neutralVenueNote: string;
    estimateNote: string;
  };
  bankroll: {
    title: string;
    subtitle: string;
    settingsTitle: string;
    startingBankroll: string;
    dailyLossLimit: string;
    currency: string;
    limitWarningTitle: string;
    limitWarningBody: string;
    todayLossLabel: string;
    kpiBalance: string;
    kpiNetProfit: string;
    kpiRoi: string;
    kpiWinRate: string;
    logBetTitle: string;
    matchLabel: string;
    matchPlaceholder: string;
    selectionLabel: string;
    selectionPlaceholder: string;
    stakeLabel: string;
    oddsLabel: string;
    resultLabel: string;
    dateLabel: string;
    addBet: string;
    validationError: string;
    roiChartTitle: string;
    roiChartSubtitle: string;
    roiChartEmpty: string;
    profitSeries: string;
    roiSeries: string;
    historyTitle: string;
    clearAll: string;
    noBetsYet: string;
    deleteBet: string;
    statusPending: string;
    statusWin: string;
    statusLoss: string;
    statusVoid: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    pipelineTitle: string;
    factorsTitle: string;
    weightCol: string;
    factorCol: string;
    methodCol: string;
    calibrationTitle: string;
    calibrationBody: string;
    metricsTitle: string;
    brierExplain: string;
    logLossExplain: string;
    evExplain: string;
    limitationsTitle: string;
    limitations: string[];
  };
  responsibleGambling: {
    title: string;
    subtitle: string;
    ageNotice: string;
    principlesTitle: string;
    principles: Array<{ title: string; body: string }>;
    selfCheckTitle: string;
    selfCheckQuestions: string[];
    helpResourcesTitle: string;
    helpResourcesSubtitle: string;
    resources: Array<{ name: string; region: string; desc: string; url: string }>;
    closingNote: string;
  };
}

export const proTranslations: Record<Language, ProTranslations> = {
  az: {
    navSections: {
      analytics: 'Analitika',
      tools: 'Peşəkar Alətlər',
      transparency: 'Şəffaflıq və Məsuliyyət',
    },
    nav: {
      livePanel: 'Canlı Panel',
      valueBets: 'Dəyər Mərcləri (EV)',
      backtesting: 'Geri Test (Backtest)',
      teamCompare: 'Komanda Müqayisəsi',
      bankroll: 'Bankroll İzləyici',
      howItWorks: 'Model Necə İşləyir',
      responsibleGambling: 'Məsuliyyətli Oyun',
    },
    pwa: {
      installApp: 'Tətbiqi Quraşdır',
      iosTitle: 'iPhone / iPad-də quraşdırma',
      iosStep1: 'Safari panelində Paylaş (Share) düyməsinə toxunun.',
      iosStep2: 'Aşağı sürüşdürüb "Ana Ekrana Əlavə Et" seçin.',
      close: 'Bağla',
      offlineBanner: 'Oflayn rejim — son yüklənmiş keş məlumatları göstərilir.',
    },
    export: {
      csvButton: 'CSV ixrac',
      pdfButton: 'PDF hesabat',
      exportedCsvToast: 'Proqnozlar CSV faylı olaraq yükləndi.',
      exportedPdfToast: 'Proqnozlar PDF hesabatı olaraq yükləndi.',
    },
    watchlistAlerts: {
      title: 'İzləmə Bildirişləri',
      subtitle: 'İzlədiyiniz komandalar canlıya keçdikdə, qol vurulduqda və ya ehtimal 5%+ dəyişdikdə xəbərdarlıq alın.',
      inAppLabel: 'Tətbiqdaxili xəbərdarlıqlar',
      browserLabel: 'Brauzer bildirişləri',
      enableBrowser: 'Brauzer bildirişlərini aktiv et',
      browserGranted: 'Brauzer bildirişləri aktivdir',
      browserDenied: 'Brauzer bildirişləri bloklanıb (brauzer ayarlarından icazə verin)',
      browserUnsupported: 'Bu brauzer masaüstü bildirişləri dəstəkləmir',
      testAlert: 'Test bildirişi göndər',
      clearHistory: 'Tarixçəni təmizlə',
      recentAlerts: 'Son bildirişlər',
      noAlertsYet: 'Hələ bildiriş qeydə alınmayıb. Matç əlavə edib canlı yeniləmələri izləyin.',
      matchLiveTitle: 'Matç başladı',
      goalTitle: 'Qol yeniləməsi',
      probShiftTitle: 'Ehtimal dəyişimi',
      nowLiveSuffix: 'hazırda canlı oynanılır',
      probMovedPrefix: 'Ev qələbə ehtimalı dəyişdi:',
      testTitle: 'MatchEdge Bildiriş Testi',
      testBody: 'İzləmə siyahısı bildirişləri aktivdir və qol/ehtimal yeniləmələrinə hazırdır.',
    },
    valueBets: {
      title: 'Dəyər Mərcləri (Value Bet / EV)',
      subtitle: 'Bukmeyker əmsallarını daxil edin (və ya pulsuz Odds API ilə sinxronlaşdırın), gizli ehtimalı model ehtimalı ilə müqayisə edin.',
      estimateLabel: 'Qiymətləndirmədir, zəmanət deyil',
      apiSyncButton: 'Odds API-dən yenilə',
      apiNotConfigured: 'Serverdə THE_ODDS_API_KEY təyin edilməyib — əmsalları aşağıdakı cədvəldə əl ilə daxil edə bilərsiniz.',
      apiLoadedPrefix: 'Bukmeyker əmsalları sinxronlaşdırıldı:',
      manualHint: 'İstənilən matç üçün 1 / X / 2 əmsalını yazın — gizli ehtimal və Gözlənilən Dəyər (EV) dərhal hesablanır.',
      onlyPositiveEv: 'Yalnız müsbət EV (+1%+)',
      matchCol: 'Matç',
      selectionCol: 'Seçim',
      bookmakerOddsCol: 'Bukmeyker Əmsalı',
      impliedProbCol: 'Gizli Ehtimal',
      modelProbCol: 'Model Ehtimalı',
      evCol: 'Gözlənilən Dəyər (EV)',
      kellyCol: '¼ Kelly',
      marginLabel: 'Marja (Vig)',
      positiveBadge: 'Müsbət EV · Qiymətləndirmə',
      negativeBadge: 'Dəyər yoxdur',
      kpiScanned: 'Əmsallı Matç',
      kpiPositiveCount: 'Müsbət EV Seçim',
      kpiBestEv: 'Ən Yüksək EV',
      kpiAvgEdge: 'Orta Üstünlük',
      enterOddsPlaceholder: 'məs. 2.15',
      resetOdds: 'Əmsalları sıfırla',
      prefillSampleOdds: 'Bazar nümunə əmsallarını doldur',
      noPositiveYet: 'Əmsal daxil edildikdə müsbət EV namizədləri burada vurğulanacaq.',
      disclaimer: 'EV hesablamaları statistik qiymətləndirmədir, zəmanət deyil. Model xətası və matçdaxili hadisələr nəticəni dəyişə bilər. 18+.',
    },
    backtesting: {
      title: 'Model Geri Testi (Backtesting)',
      subtitle: 'Bitmiş matçlar üzərində Brier balı, Loqarifmik İtki (Log Loss) və kalibrləmə dəqiqliyinin qiymətləndirilməsi.',
      kpiEvaluated: 'Test Edilən Matç',
      kpiBrier: 'Brier Balı (1X2)',
      kpiLogLoss: 'Log Loss',
      kpiHitRate: 'Dəqiqlik (Hit Rate)',
      kpiEce: 'Kalibrləmə Xətası (ECE)',
      brierBenchmark: 'Təsadüfi 1/3 baza: 0.667 (aşağı daha yaxşı)',
      logLossBenchmark: 'Təsadüfi 1/3 baza: 1.099 (aşağı daha yaxşı)',
      calibrationTitle: 'Kalibrləmə Qrafiki (Reliability Curve)',
      calibrationSubtitle: 'Proqnozlaşdırılan ehtimal qrupları vs faktiki reallaşma faizi — diaqonala yaxınlıq dürüst kalibrləməni göstərir.',
      predictedAxis: 'Model Proqnozu (%)',
      actualAxis: 'Faktiki Nəticə (%)',
      perfectLine: 'İdeal Kalibrləmə',
      modelLine: 'MatchEdge Modeli',
      leagueBreakdownTitle: 'Liqalar üzrə Geri Test',
      recentEvaluatedTitle: 'Qiymətləndirilmiş Matçlar',
      leagueCol: 'Liqa',
      samplesCol: 'Matç',
      hitRateCol: 'Dəqiqlik',
      brierCol: 'Brier',
      logLossCol: 'Log Loss',
      noData: 'Seçilən filtr üzrə bitmiş geri test matçı tapılmadı.',
    },
    livePanel: {
      title: 'Canlı Analitika Paneli',
      subtitle: 'Avtomatik yeniləmə və əvvəlki anlıq görüntüyə nəzərən ehtimal dəyişim göstəriciləri (↑ / ↓).',
      autoRefresh: 'Avto-yeniləmə',
      intervalLabel: 'İnterval',
      refreshNow: 'İndi yenilə',
      lastUpdated: 'Son yeniləmə',
      nextRefreshIn: 'Növbəti yeniləmə',
      liveCountLabel: 'Canlı Matç',
      deltaLegend: '↑ / ↓ göstəriciləri əvvəlki yeniləmədən bəri ehtimal dəyişimini (faiz bəndi) əks etdirir.',
      noLiveMatchesTitle: 'Hazırda canlı matç yoxdur',
      noLiveMatchesDesc: 'İzlənən liqalarda matç başladıqda burada avtomatik canlı hesab və ehtimal dəyişimləri görünəcək.',
      upcomingSoonTitle: 'Yaxınlaşan Matçlar',
      scoreCol: 'Hesab',
      probShiftLabel: 'Dəyişim',
      openAnalysis: 'Tam analiz',
    },
    teamCompare: {
      title: 'Komanda Müqayisəsi',
      subtitle: 'İstənilən iki komandanı yan-yana müqayisə edin: forma, xG, H2H, hücum/müdafiə reytinqləri və Poisson simulyasiyası.',
      teamA: 'Komanda A (Ev sahibi kimi)',
      teamB: 'Komanda B (Qonaq kimi)',
      swapTeams: 'Yerini dəyiş',
      sameTeamWarning: 'Müqayisə üçün iki fərqli komanda seçin.',
      formTitle: 'Son Forma və Reytinq',
      ratingsTitle: 'Hücum / Müdafiə və Qol Göstəriciləri',
      attackRating: 'Hücum Gücü',
      defenseRating: 'Müdafiə Möhkəmliyi',
      goalsPerGame: 'Qol / Oyun',
      concededPerGame: 'Buraxılan / Oyun',
      xgPerGame: 'xG / Oyun',
      xgaPerGame: 'xGA / Oyun',
      pointsPerGame: 'Xal / Oyun',
      winRate: 'Qələbə Faizi',
      homeAwayTitle: 'Ev / Səfər Performansı',
      h2hTitle: 'Üzbəüz (H2H) Tarixçə',
      noH2H: 'Seçilən iki komanda arasında cari verilənlərdə birbaşa H2H qeydi tapılmadı.',
      simulationTitle: 'Statistik Üzbəüz Simulyasiya',
      simulationSubtitle: 'Seçilən iki komanda qarşılaşsa, MatchEdge Poisson + Elo modeli nə qiymətləndirər?',
      neutralVenueNote: 'Komanda A ev sahibi üstünlüyü ilə hesablanır',
      estimateNote: 'Statistik simulyasiyadır, zəmanət deyil.',
    },
    bankroll: {
      title: 'Bankroll İzləyici',
      subtitle: 'Mərclərinizi yerli yaddaşda (localStorage) qeyd edin, ROI qrafikini izləyin və gündəlik itki limitini qoruyun.',
      settingsTitle: 'Bankroll və Limit Parametrləri',
      startingBankroll: 'Başlanğıc Bankroll',
      dailyLossLimit: 'Gündəlik İtki Limiti',
      currency: 'Valyuta',
      limitWarningTitle: 'Gündəlik itki limitinə çatdınız!',
      limitWarningBody: 'Bugünkü xalis itkiniz təyin etdiyiniz gündəlik limiti keçib və ya çatıb. Fasilə verin və itkilərin dalınca düşməyin.',
      todayLossLabel: 'Bugünkü xalis itki',
      kpiBalance: 'Cari Bankroll',
      kpiNetProfit: 'Xalis Mənfəət / İtki',
      kpiRoi: 'Ümumi ROI',
      kpiWinRate: 'Uduş Faizi',
      logBetTitle: 'Yeni Mərc Qeyd Et',
      matchLabel: 'Matç / Təsvir',
      matchPlaceholder: 'məs. Qarabağ vs Neftçi',
      selectionLabel: 'Seçim / Bazar',
      selectionPlaceholder: 'məs. 1, Üst 2.5, Q/Q',
      stakeLabel: 'Məbləğ',
      oddsLabel: 'Əmsal',
      resultLabel: 'Nəticə',
      dateLabel: 'Tarix',
      addBet: 'Qeyd et',
      validationError: 'Zəhmət olmasa matç adı, düzgün məbləğ (> 0) və əmsal (> 1.00) daxil edin.',
      roiChartTitle: 'Kumulyativ Mənfəət və ROI Qrafiki',
      roiChartSubtitle: 'Nəticələnmiş mərclər üzrə bankroll və ROI dinamikası.',
      roiChartEmpty: 'Qrafiki görmək üçün ən azı bir nəticələnmiş (Uduş/Uduzma) mərc əlavə edin.',
      profitSeries: 'Kumulyativ Mənfəət',
      roiSeries: 'ROI (%)',
      historyTitle: 'Mərc Tarixçəsi',
      clearAll: 'Hamısını sil',
      noBetsYet: 'Hələ heç bir mərc qeyd olunmayıb.',
      deleteBet: 'Sil',
      statusPending: 'Gözləyir',
      statusWin: 'Uduş',
      statusLoss: 'Uduzma',
      statusVoid: 'Ləğv',
    },
    howItWorks: {
      title: 'Model Necə İşləyir — Şəffaflıq',
      subtitle: 'MatchEdge qara qutu deyil: bütün 7 faktor, çəkilər, Poisson + Dixon-Coles tənlikləri və məhdudiyyətlər açıq izah olunur.',
      pipelineTitle: 'Hesablama Ardıcıllığı',
      factorsTitle: '7 Faktorun Çəki Paylanması (Cəmi = 100%)',
      weightCol: 'Çəki',
      factorCol: 'Faktor',
      methodCol: 'Riyazi Metod',
      calibrationTitle: 'Kalibrləmə və Həddindən Artıq Əminlikdən Qorunma',
      calibrationBody: 'Futbol yüksək təsadüfilik (variance) daşıyan idmandır. Raw Poisson ehtimalları 8% empirik priora doğru sıxılır və oyunöncəsi heç bir nəticə 85%-dən yuxarı göstərilmir. Canlı oyunlarda qalan dəqiqəyə əsasən (92 dəqiqəlik üfüq) dinamik yenidən hesablanır.',
      metricsTitle: 'Qiymətləndirmə Metrikaları',
      brierExplain: 'Brier Balı — proqnoz ehtimalı ilə faktiki nəticə (0/1) arasındakı kvadratik fərqdir. 0 mükəmməl, 0.667 isə təsadüfi 1X2 təxminidir.',
      logLossExplain: 'Log Loss — əmin olduğu halda səhv edən proqnozları sərt cəzalandıran kross-entropiya metrikasıdır. Aşağı rəqəm daha yaxşıdır.',
      evExplain: 'Gözlənilən Dəyər (EV = Model Ehtimalı × Əmsal − 1) — uzunmüddətli nəzəri üstünlük qiymətləndirməsidir, tək matçda qazanc zəmanəti deyil.',
      limitationsTitle: 'Modelin Məhdudiyyətləri',
      limitations: [
        'Matçöncəsi gözlənilməz taktiki dəyişikliklər, qırmızı vərəqələr, penaltilər və hava şəraiti əvvəlcədən bilinə bilməz.',
        'Bəzi liqalarda rəsmi xG məlumatı mövcud olmadıqda model real qol göstəricilərindən istifadə edir.',
        'Müsbət EV yalnız modelin həqiqi ehtimalı bukmeyker bazarından daha dəqiq qiymətləndirdiyi halda uzunmüddətli fayda verir.',
        'Bütün çıxışlar statistik qiymətləndirmədir — heç bir halda maliyyə və ya mərc zəmanəti deyil.',
      ],
    },
    responsibleGambling: {
      title: 'Məsuliyyətli Oyun (18+)',
      subtitle: 'İdman analitikası əyləncə və statistika üçündür — heç vaxt gəlir mənbəyi və ya maliyyə çıxış yolu kimi qəbul edilməməlidir.',
      ageNotice: 'MatchEdge yalnız 18 yaşdan yuxarı istifadəçilər üçün statistik informasiya platformasıdır.',
      principlesTitle: 'Əsas Məsuliyyətli Davranış Qaydaları',
      principles: [
        {
          title: 'İtirməyə hazır olduğunuz məbləğdən artıq risk etməyin',
          body: 'Kirayə, kommunal, təhsil və ya borc vəsaitlərini heç vaxt mərclərə yönəltməyin. Sərt gündəlik və aylıq limitlər təyin edin.',
        },
        {
          title: 'İtkilərin dalınca düşməyin (No Chasing)',
          body: 'Uduzduqdan sonra məbləği artıraraq itkini geri qaytarmağa çalışmaq ən təhlükəli davranışdır. Limitə çatdıqda dayanın.',
        },
        {
          title: 'Ehtimal ≠ Zəmanət',
          body: '75% ehtimallı bir seçim belə statistik olaraq hər 4 oyundan 1-də uduzur. Qısamüddətli dalğalanmalar qaçılmazdır.',
        },
        {
          title: 'Vaxt və emosional tarazlığı qoruyun',
          body: 'Yorğun, stresli və ya emosional vəziyyətdə qərar verməyin. Müntəzəm fasilələr verin.',
        },
      ],
      selfCheckTitle: 'Özünüqiymətləndirmə Sualları',
      selfCheckQuestions: [
        'Planlaşdırdığınızdan daha çox pul və ya vaxt xərcləyirsinizmi?',
        'İtirdiyiniz pulu geri qazanmaq üçün təkrar mərc edirsinizmi?',
        'Mərclər işinizə, ailə münasibətlərinizə və ya yuxunuza mənfi təsir edirmi?',
        'Mərc vərdişlərinizi yaxınlarınızdan gizlətmək ehtiyacı hiss edirsinizmi?',
      ],
      helpResourcesTitle: 'Dəstək və Peşəkar Yardım Resursları',
      helpResourcesSubtitle: 'Əgər özünüzdə və ya yaxınlarınızda nəzarət çətinliyi hiss edirsinizsə, pulsuz və məxfi yardım mövcuddur:',
      resources: [
        {
          name: 'Gambling Therapy (Beynəlxalq)',
          region: 'Qlobal · Çoxdilli',
          desc: 'Pulsuz onlayn dəstək qrupları, özünəkömək alətləri və məsləhət xidməti.',
          url: 'https://www.gamblingtherapy.org/',
        },
        {
          name: 'BeGambleAware',
          region: 'Beynəlxalq / Böyük Britaniya',
          desc: 'Məsuliyyətli oyun bələdçiləri, büdcə kalkulyatoru və peşəkar dəstək məlumatları.',
          url: 'https://www.gambleaware.org/',
        },
        {
          name: 'Gamblers Anonymous',
          region: 'Qlobal icma',
          desc: 'Qarşılıqlı dəstək proqramı və beynəlxalq görüş cədvəli.',
          url: 'https://www.gamblersanonymous.org/',
        },
      ],
      closingNote: 'MatchEdge mərc qəbul etmir və bukmeyker deyil. Bütün proqnozlar yalnız statistik qiymətləndirmə xarakteri daşıyır.',
    },
  },
  en: {
    navSections: {
      analytics: 'Analytics',
      tools: 'Pro Tools',
      transparency: 'Transparency & Safety',
    },
    nav: {
      livePanel: 'Live Panel',
      valueBets: 'Value Bets (EV)',
      backtesting: 'Backtesting',
      teamCompare: 'Team Comparison',
      bankroll: 'Bankroll Tracker',
      howItWorks: 'How Model Works',
      responsibleGambling: 'Responsible Gambling',
    },
    pwa: {
      installApp: 'Install App',
      iosTitle: 'Install on iPhone / iPad',
      iosStep1: 'Tap the Share button in Safari toolbar.',
      iosStep2: 'Scroll down and tap "Add to Home Screen".',
      close: 'Close',
      offlineBanner: 'Offline mode — showing last cached match data.',
    },
    export: {
      csvButton: 'Export CSV',
      pdfButton: 'Export PDF',
      exportedCsvToast: 'Predictions downloaded as CSV.',
      exportedPdfToast: 'Predictions downloaded as PDF report.',
    },
    watchlistAlerts: {
      title: 'Watchlist Notifications',
      subtitle: 'Receive in-app and browser alerts when watched matches kick off, goals are scored, or win probability shifts by 5%+.',
      inAppLabel: 'In-app toast alerts',
      browserLabel: 'Browser notifications',
      enableBrowser: 'Enable browser notifications',
      browserGranted: 'Browser notifications active',
      browserDenied: 'Browser notifications blocked (enable in browser settings)',
      browserUnsupported: 'Desktop notifications are not supported in this browser',
      testAlert: 'Send test alert',
      clearHistory: 'Clear history',
      recentAlerts: 'Recent alerts',
      noAlertsYet: 'No alerts yet. Save matches to your watchlist and live updates will appear here.',
      matchLiveTitle: 'Match kicked off',
      goalTitle: 'Goal update',
      probShiftTitle: 'Probability shift',
      nowLiveSuffix: 'is now live',
      probMovedPrefix: 'Home win probability shifted:',
      testTitle: 'MatchEdge Notification Test',
      testBody: 'Watchlist alerts are active and ready for live goals and probability shifts.',
    },
    valueBets: {
      title: 'Value Bets (Expected Value)',
      subtitle: 'Enter bookmaker decimal odds manually (or sync from a free Odds API if configured) to compare implied probability against model probability.',
      estimateLabel: 'Estimate, not guarantee',
      apiSyncButton: 'Sync Odds API',
      apiNotConfigured: 'THE_ODDS_API_KEY is not set on the server — enter bookmaker odds manually in the table below.',
      apiLoadedPrefix: 'Bookmaker odds synced:',
      manualHint: 'Enter 1 / X / 2 decimal odds for any match to calculate implied probability, edge, and Expected Value (EV) instantly.',
      onlyPositiveEv: 'Positive EV only (+1%+)',
      matchCol: 'Match',
      selectionCol: 'Selection',
      bookmakerOddsCol: 'Bookmaker Odds',
      impliedProbCol: 'Implied Prob',
      modelProbCol: 'Model Prob',
      evCol: 'Expected Value (EV)',
      kellyCol: '¼ Kelly',
      marginLabel: 'Margin (Vig)',
      positiveBadge: '+EV · Estimate',
      negativeBadge: 'No edge',
      kpiScanned: 'Quoted Matches',
      kpiPositiveCount: 'Positive EV Picks',
      kpiBestEv: 'Highest EV',
      kpiAvgEdge: 'Avg Edge',
      enterOddsPlaceholder: 'e.g. 2.15',
      resetOdds: 'Reset odds',
      prefillSampleOdds: 'Prefill sample market odds',
      noPositiveYet: 'Enter bookmaker odds to evaluate Expected Value estimates.',
      disclaimer: 'All EV calculations are statistical estimates, not guarantees. Model error and in-game variance can produce losses. 18+.',
    },
    backtesting: {
      title: 'Model Backtesting',
      subtitle: 'Evaluate model predictions on past settled matches using Brier score, Log Loss, and reliability calibration.',
      kpiEvaluated: 'Evaluated Matches',
      kpiBrier: 'Brier Score (1X2)',
      kpiLogLoss: 'Log Loss',
      kpiHitRate: 'Hit Rate',
      kpiEce: 'Calibration Error (ECE)',
      brierBenchmark: 'Random 1/3 baseline: 0.667 (lower is better)',
      logLossBenchmark: 'Random 1/3 baseline: 1.099 (lower is better)',
      calibrationTitle: 'Calibration Chart (Reliability Curve)',
      calibrationSubtitle: 'Predicted probability bins vs observed frequency — closer to the diagonal means honest calibration.',
      predictedAxis: 'Model Predicted (%)',
      actualAxis: 'Observed Outcome (%)',
      perfectLine: 'Perfect Calibration',
      modelLine: 'MatchEdge Model',
      leagueBreakdownTitle: 'Backtest by League',
      recentEvaluatedTitle: 'Evaluated Past Matches',
      leagueCol: 'League',
      samplesCol: 'Matches',
      hitRateCol: 'Hit Rate',
      brierCol: 'Brier',
      logLossCol: 'Log Loss',
      noData: 'No settled matches available for the selected filter.',
    },
    livePanel: {
      title: 'Live Analytics Panel',
      subtitle: 'Auto-refreshing in-play matches with real-time probability change indicators (↑ / ↓) since the previous snapshot.',
      autoRefresh: 'Auto-refresh',
      intervalLabel: 'Interval',
      refreshNow: 'Refresh now',
      lastUpdated: 'Last updated',
      nextRefreshIn: 'Next refresh in',
      liveCountLabel: 'Live Matches',
      deltaLegend: '↑ / ↓ indicators show percentage-point probability changes since the previous refresh.',
      noLiveMatchesTitle: 'No live matches right now',
      noLiveMatchesDesc: 'When tracked leagues kick off, live scores and probability movement indicators will stream here automatically.',
      upcomingSoonTitle: 'Upcoming Fixtures',
      scoreCol: 'Score',
      probShiftLabel: 'Delta',
      openAnalysis: 'Full analysis',
    },
    teamCompare: {
      title: 'Team Comparison',
      subtitle: 'Compare any two teams side by side: form, xG, H2H, attack/defense ratings, and head-to-head Poisson projection.',
      teamA: 'Team A (Home side)',
      teamB: 'Team B (Away side)',
      swapTeams: 'Swap teams',
      sameTeamWarning: 'Select two different teams to compare.',
      formTitle: 'Form & Rating Profile',
      ratingsTitle: 'Attack / Defense & Scoring Metrics',
      attackRating: 'Attack Strength',
      defenseRating: 'Defense Rating',
      goalsPerGame: 'Goals / Game',
      concededPerGame: 'Conceded / Game',
      xgPerGame: 'xG / Game',
      xgaPerGame: 'xGA / Game',
      pointsPerGame: 'Points / Game',
      winRate: 'Win Rate',
      homeAwayTitle: 'Home / Away Splits',
      h2hTitle: 'Head-to-Head History',
      noH2H: 'No direct H2H meetings recorded in the current dataset for these two teams.',
      simulationTitle: 'Head-to-Head Model Simulation',
      simulationSubtitle: 'Estimated outcome if Team A hosted Team B using the full 7-factor MatchEdge engine.',
      neutralVenueNote: 'Computed with Team A as home side',
      estimateNote: 'Statistical estimate, not a guarantee.',
    },
    bankroll: {
      title: 'Bankroll Tracker',
      subtitle: 'Log bets locally in your browser (localStorage), monitor cumulative ROI, and enforce a daily loss limit.',
      settingsTitle: 'Bankroll & Limit Settings',
      startingBankroll: 'Starting Bankroll',
      dailyLossLimit: 'Daily Loss Limit',
      currency: 'Currency',
      limitWarningTitle: 'Daily loss limit reached!',
      limitWarningBody: 'Your net losses today have reached or exceeded your configured daily limit. Take a break and never chase losses.',
      todayLossLabel: 'Today net loss',
      kpiBalance: 'Current Bankroll',
      kpiNetProfit: 'Net Profit / Loss',
      kpiRoi: 'Overall ROI',
      kpiWinRate: 'Win Rate',
      logBetTitle: 'Log New Bet',
      matchLabel: 'Match / Description',
      matchPlaceholder: 'e.g. Arsenal vs Chelsea',
      selectionLabel: 'Selection / Market',
      selectionPlaceholder: 'e.g. Home Win, Over 2.5',
      stakeLabel: 'Stake',
      oddsLabel: 'Decimal Odds',
      resultLabel: 'Result',
      dateLabel: 'Date',
      addBet: 'Log bet',
      validationError: 'Please enter a match label, stake > 0, and decimal odds > 1.00.',
      roiChartTitle: 'Cumulative Profit & ROI Curve',
      roiChartSubtitle: 'Settled bet progression showing cumulative P&L and ROI%.',
      roiChartEmpty: 'Add at least one settled (Win/Loss) bet to visualize your ROI curve.',
      profitSeries: 'Cumulative Profit',
      roiSeries: 'ROI (%)',
      historyTitle: 'Bet Log',
      clearAll: 'Clear all',
      noBetsYet: 'No bets logged yet.',
      deleteBet: 'Delete',
      statusPending: 'Pending',
      statusWin: 'Win',
      statusLoss: 'Loss',
      statusVoid: 'Void',
    },
    howItWorks: {
      title: 'How the Model Works',
      subtitle: 'Full statistical transparency: all 7 weighted factors, Poisson + Dixon-Coles goal modeling, Elo ratings, fatigue congestion, and honest limitations.',
      pipelineTitle: 'Prediction Pipeline',
      factorsTitle: '7 Model Factors & Weights (Sum = 100%)',
      weightCol: 'Weight',
      factorCol: 'Factor',
      methodCol: 'Mathematical Method',
      calibrationTitle: 'Probability Calibration & Variance Control',
      calibrationBody: 'Football outcomes carry high inherent variance. Raw bivariate Poisson probabilities are shrunk 8% toward an empirical football prior and pre-match outcomes are capped at 85% so the model never implies false certainty. During live matches, remaining expected goals scale continuously over a 92-minute horizon.',
      metricsTitle: 'Evaluation Metrics Explained',
      brierExplain: 'Brier Score measures mean squared error between predicted probabilities and actual outcomes (0 is perfect; 0.667 is uniform random 1X2 guessing).',
      logLossExplain: 'Log Loss (categorical cross-entropy) heavily penalizes confident wrong predictions. Lower values indicate stronger probabilistic discipline.',
      evExplain: 'Expected Value (EV = Model Prob × Decimal Odds − 1) estimates theoretical long-run edge only if the model is better calibrated than the market. Never a guarantee.',
      limitationsTitle: 'Known Model Limitations',
      limitations: [
        'Unexpected red cards, penalties, late tactical shifts, and weather cannot be predicted pre-match.',
        'When official xG is unavailable for a league, the attack/defense module falls back to actual goals.',
        'Positive EV picks still lose frequently due to normal football variance.',
        'All numbers are statistical estimates for informational analytics only — never guaranteed outcomes.',
      ],
    },
    responsibleGambling: {
      title: 'Responsible Gambling (18+)',
      subtitle: 'Football analytics should remain informative and entertaining — never a source of guaranteed income or financial recovery.',
      ageNotice: 'MatchEdge is an informational analytics platform intended strictly for adults aged 18+.',
      principlesTitle: 'Core Principles of Safe Play',
      principles: [
        {
          title: 'Only risk what you can afford to lose',
          body: 'Never use money needed for rent, bills, food, or debt repayment. Set strict daily and monthly budgets before placing any wager.',
        },
        {
          title: 'Never chase losses',
          body: 'Increasing stakes to recover prior losses compounds risk quickly. When your daily loss limit is hit, stop immediately.',
        },
        {
          title: 'Probability is not certainty',
          body: 'Even a 75% statistical favorite fails 1 in 4 times on average. Losing streaks happen even with disciplined analysis.',
        },
        {
          title: 'Protect your time and wellbeing',
          body: 'Avoid making decisions when tired, stressed, or emotional. Take regular breaks from betting markets.',
        },
      ],
      selfCheckTitle: 'Self-Check Questions',
      selfCheckQuestions: [
        'Are you spending more money or time than you originally planned?',
        'Do you feel compelled to bet again immediately after a loss?',
        'Has betting affected your work, sleep, or relationships?',
        'Do you hide your betting activity or bankroll losses from people close to you?',
      ],
      helpResourcesTitle: 'Confidential Support Resources',
      helpResourcesSubtitle: 'If you or someone you know is struggling to stay in control, free confidential help is available worldwide:',
      resources: [
        {
          name: 'Gambling Therapy',
          region: 'Global · Multilingual',
          desc: 'Free online support groups, self-help tools, and live multilingual helpline.',
          url: 'https://www.gamblingtherapy.org/',
        },
        {
          name: 'BeGambleAware',
          region: 'International / UK',
          desc: 'Free advice, self-assessment tools, and confidential treatment referrals.',
          url: 'https://www.gambleaware.org/',
        },
        {
          name: 'Gamblers Anonymous',
          region: 'Worldwide Fellowship',
          desc: 'Peer support meetings and recovery resources across countries.',
          url: 'https://www.gamblersanonymous.org/',
        },
      ],
      closingNote: 'MatchEdge is not a bookmaker and does not accept wagers. All projections are statistical estimates only.',
    },
  },
  ru: {
    navSections: {
      analytics: 'Аналитика',
      tools: 'Проф. инструменты',
      transparency: 'Прозрачность и 18+',
    },
    nav: {
      livePanel: 'Лайв-панель',
      valueBets: 'Валуйные ставки (EV)',
      backtesting: 'Бэктестинг',
      teamCompare: 'Сравнение команд',
      bankroll: 'Банкролл-трекер',
      howItWorks: 'Как работает модель',
      responsibleGambling: 'Ответственная игра',
    },
    pwa: {
      installApp: 'Установить PWA',
      iosTitle: 'Установка на iPhone / iPad',
      iosStep1: 'Нажмите кнопку «Поделиться» в панели Safari.',
      iosStep2: 'Прокрутите вниз и выберите «На экран „Домой“».',
      close: 'Закрыть',
      offlineBanner: 'Офлайн-режим — отображаются последние сохранённые данные.',
    },
    export: {
      csvButton: 'Экспорт CSV',
      pdfButton: 'Экспорт PDF',
      exportedCsvToast: 'Прогнозы экспортированы в CSV.',
      exportedPdfToast: 'Отчёт прогнозов сохранён в PDF.',
    },
    watchlistAlerts: {
      title: 'Уведомления избранного',
      subtitle: 'Получайте уведомления в приложении и браузере о начале матча, голах и сдвиге вероятности на 5%+.',
      inAppLabel: 'Уведомления в приложении',
      browserLabel: 'Уведомления браузера',
      enableBrowser: 'Включить уведомления браузера',
      browserGranted: 'Уведомления браузера активны',
      browserDenied: 'Уведомления заблокированы в настройках браузера',
      browserUnsupported: 'Браузер не поддерживает системные уведомления',
      testAlert: 'Тест уведомления',
      clearHistory: 'Очистить историю',
      recentAlerts: 'Последние события',
      noAlertsYet: 'Уведомлений пока нет. Добавьте матчи в избранное.',
      matchLiveTitle: 'Матч начался',
      goalTitle: 'Обновление счёта',
      probShiftTitle: 'Сдвиг вероятности',
      nowLiveSuffix: 'сейчас идёт в прямом эфире',
      probMovedPrefix: 'Вероятность победы хозяев изменилась:',
      testTitle: 'Тест уведомлений MatchEdge',
      testBody: 'Уведомления избранного активны и готовы отслеживать голы и сдвиги вероятностей.',
    },
    valueBets: {
      title: 'Валуйные ставки (Value Bet / EV)',
      subtitle: 'Введите коэффициенты букмекера вручную (или синхронизируйте через бесплатный Odds API) и сравните скрытую вероятность с моделью.',
      estimateLabel: 'Оценка, не гарантия',
      apiSyncButton: 'Обновить Odds API',
      apiNotConfigured: 'Ключ THE_ODDS_API_KEY не задан на сервере — введите коэффициенты вручную ниже.',
      apiLoadedPrefix: 'Коэффициенты загружены:',
      manualHint: 'Введите десятичные коэффициенты 1 / X / 2 — скрытая вероятность и EV пересчитаются мгновенно.',
      onlyPositiveEv: 'Только положит. EV (+1%+)',
      matchCol: 'Матч',
      selectionCol: 'Исход',
      bookmakerOddsCol: 'Коэф. букмекера',
      impliedProbCol: 'Скрытая вер.',
      modelProbCol: 'Модель',
      evCol: 'Ожид. ценность (EV)',
      kellyCol: '¼ Келли',
      marginLabel: 'Маржа',
      positiveBadge: '+EV · Оценка',
      negativeBadge: 'Нет перевеса',
      kpiScanned: 'Матчей с коэф.',
      kpiPositiveCount: 'Положит. EV',
      kpiBestEv: 'Макс. EV',
      kpiAvgEdge: 'Средний перевес',
      enterOddsPlaceholder: 'напр. 2.15',
      resetOdds: 'Сбросить коэф.',
      prefillSampleOdds: 'Заполнить примерные рыночные коэф.',
      noPositiveYet: 'Введите коэффициенты для расчёта EV.',
      disclaimer: 'Расчёты EV являются статистической оценкой, а не гарантией выигрыша. 18+.',
    },
    backtesting: {
      title: 'Бэктестинг модели',
      subtitle: 'Оценка точности модели на прошедших матчах: индекс Бриера (Brier), Log Loss и график калибровки.',
      kpiEvaluated: 'Проверено матчей',
      kpiBrier: 'Brier Score (1X2)',
      kpiLogLoss: 'Log Loss',
      kpiHitRate: 'Точность',
      kpiEce: 'Ошибка калибровки (ECE)',
      brierBenchmark: 'Случайный прогноз 1/3: 0.667 (ниже лучше)',
      logLossBenchmark: 'Случайный прогноз 1/3: 1.099 (ниже лучше)',
      calibrationTitle: 'График калибровки (Reliability Curve)',
      calibrationSubtitle: 'Предсказанные вероятности против фактической частоты исходов.',
      predictedAxis: 'Прогноз модели (%)',
      actualAxis: 'Фактический исход (%)',
      perfectLine: 'Идеальная калибровка',
      modelLine: 'Модель MatchEdge',
      leagueBreakdownTitle: 'Бэктест по лигам',
      recentEvaluatedTitle: 'Проверенные матчи',
      leagueCol: 'Лига',
      samplesCol: 'Матчи',
      hitRateCol: 'Точность',
      brierCol: 'Brier',
      logLossCol: 'Log Loss',
      noData: 'Нет завершённых матчей для выбранного фильтра.',
    },
    livePanel: {
      title: 'Лайв-панель',
      subtitle: 'Автообновление и индикаторы изменения вероятности (↑ / ↓) относительно прошлого снимка.',
      autoRefresh: 'Автообновление',
      intervalLabel: 'Интервал',
      refreshNow: 'Обновить сейчас',
      lastUpdated: 'Обновлено',
      nextRefreshIn: 'Следующее через',
      liveCountLabel: 'Матчей в лайве',
      deltaLegend: 'Стрелки ↑ / ↓ показывают изменение вероятности в процентных пунктах с прошлого обновления.',
      noLiveMatchesTitle: 'Сейчас нет активных лайв-матчей',
      noLiveMatchesDesc: 'Как только начнутся матчи отслеживаемых лиг, здесь появятся счёт и динамика вероятностей.',
      upcomingSoonTitle: 'Ближайшие матчи',
      scoreCol: 'Счёт',
      probShiftLabel: 'Сдвиг',
      openAnalysis: 'Полный анализ',
    },
    teamCompare: {
      title: 'Сравнение команд',
      subtitle: 'Сравните любые две команды рядом: форма, xG, H2H, рейтинги атаки/обороны и симуляция матча.',
      teamA: 'Команда A (Хозяева)',
      teamB: 'Команда B (Гости)',
      swapTeams: 'Поменять местами',
      sameTeamWarning: 'Выберите две разные команды для сравнения.',
      formTitle: 'Форма и рейтинг',
      ratingsTitle: 'Атака / Оборона и голы',
      attackRating: 'Сила атаки',
      defenseRating: 'Надёжность обороны',
      goalsPerGame: 'Голы / Игра',
      concededPerGame: 'Пропущ. / Игра',
      xgPerGame: 'xG / Игра',
      xgaPerGame: 'xGA / Игра',
      pointsPerGame: 'Очки / Игра',
      winRate: 'Процент побед',
      homeAwayTitle: 'Дома / В гостях',
      h2hTitle: 'Личные встречи (H2H)',
      noH2H: 'В текущем наборе данных нет очных встреч для этих двух команд.',
      simulationTitle: 'Статистическая симуляция встречи',
      simulationSubtitle: 'Оценка 7-факторной модели MatchEdge при встрече выбранных команд.',
      neutralVenueNote: 'Расчёт при домашнем поле команды A',
      estimateNote: 'Статистическая оценка, не гарантия.',
    },
    bankroll: {
      title: 'Банкролл-трекер',
      subtitle: 'Локальный учёт ставок (localStorage), график ROI и предупреждение о дневном лимите потерь.',
      settingsTitle: 'Настройки банкролла и лимитов',
      startingBankroll: 'Стартовый банк',
      dailyLossLimit: 'Дневной лимит потерь',
      currency: 'Валюта',
      limitWarningTitle: 'Достигнут дневной лимит потерь!',
      limitWarningBody: 'Ваши чистые потери за сегодня достигли или превысили установленный лимит. Сделайте паузу и не пытайтесь отыграться.',
      todayLossLabel: 'Потери за сегодня',
      kpiBalance: 'Текущий банк',
      kpiNetProfit: 'Чистая прибыль / убыток',
      kpiRoi: 'Общий ROI',
      kpiWinRate: 'Проходимость',
      logBetTitle: 'Добавить ставку',
      matchLabel: 'Матч / Описание',
      matchPlaceholder: 'напр. Арсенал — Челси',
      selectionLabel: 'Выбор / Рынок',
      selectionPlaceholder: 'напр. П1, ТБ 2.5',
      stakeLabel: 'Сумма',
      oddsLabel: 'Коэффициент',
      resultLabel: 'Статус',
      dateLabel: 'Дата',
      addBet: 'Сохранить',
      validationError: 'Укажите матч, сумму > 0 и коэффициент > 1.00.',
      roiChartTitle: 'График прибыли и ROI',
      roiChartSubtitle: 'Динамика накопленной прибыли и ROI% по рассчитанным ставкам.',
      roiChartEmpty: 'Добавьте хотя бы одну рассчитанную ставку (Выигрыш/Проигрыш), чтобы увидеть график.',
      profitSeries: 'Накопленная прибыль',
      roiSeries: 'ROI (%)',
      historyTitle: 'История ставок',
      clearAll: 'Очистить всё',
      noBetsYet: 'Ставок пока нет.',
      deleteBet: 'Удалить',
      statusPending: 'Ожидает',
      statusWin: 'Выигрыш',
      statusLoss: 'Проигрыш',
      statusVoid: 'Возврат',
    },
    howItWorks: {
      title: 'Как работает модель',
      subtitle: 'Полная прозрачность: 7 взвешенных факторов, Пуассон + Диксон-Коулз, Elo, фактор усталости и ограничения.',
      pipelineTitle: 'Этапы расчёта',
      factorsTitle: '7 факторов модели (сумма = 100%)',
      weightCol: 'Вес',
      factorCol: 'Фактор',
      methodCol: 'Математический метод',
      calibrationTitle: 'Калибровка вероятностей',
      calibrationBody: 'Футбол обладает высокой дисперсией. Сырые вероятности Пуассона сглаживаются на 8% к эмпирическому распределению, а предматчевый максимум ограничен 85%, чтобы исключить ложную уверенность.',
      metricsTitle: 'Метрики качества',
      brierExplain: 'Brier Score — среднеквадратическая ошибка вероятностей (0 идеально, 0.667 — случайное угадывание 1X2).',
      logLossExplain: 'Log Loss — кросс-энтропия, строго штрафующая уверенные ошибки. Чем ниже, тем лучше.',
      evExplain: 'EV (Вероятность × Коэффициент − 1) — оценка долгосрочного математического перевеса, не гарантия.',
      limitationsTitle: 'Ограничения модели',
      limitations: [
        'Красные карточки, пенальти, погодные условия и внезапные травмы невозможно предсказать заранее.',
        'При отсутствии официального xG модель опирается на фактические голы.',
        'Даже ставки с положительным EV часто проигрывают на короткой дистанции из-за дисперсии.',
        'Все цифры — статистические оценки для аналитики, а не гарантия результата.',
      ],
    },
    responsibleGambling: {
      title: 'Ответственная игра (18+)',
      subtitle: 'Футбольная аналитика — инструмент анализа и развлечения, а не источник гарантированного дохода.',
      ageNotice: 'MatchEdge предназначен строго для совершеннолетних пользователей (18+).',
      principlesTitle: 'Принципы ответственного подхода',
      principles: [
        {
          title: 'Рискуйте только свободными средствами',
          body: 'Никогда не используйте деньги на жильё, счета или кредиты. Устанавливайте жёсткие дневные и месячные лимиты.',
        },
        {
          title: 'Не пытайтесь отыграться',
          body: 'Увеличение ставок после проигрыша резко повышает риски. При достижении дневного лимита остановитесь.',
        },
        {
          title: 'Вероятность — не гарантия',
          body: 'Даже исход с вероятностью 75% не проходит в среднем в 1 случае из 4.',
        },
        {
          title: 'Берегите время и спокойствие',
          body: 'Не принимайте решений в состоянии усталости или стресса. Делайте регулярные перерывы.',
        },
      ],
      selfCheckTitle: 'Вопросы для самопроверки',
      selfCheckQuestions: [
        'Тратите ли вы больше денег или времени, чем планировали?',
        'Возникает ли желание немедленно отыграться после проигрыша?',
        'Влияют ли ставки на работу, сон или отношения с близкими?',
        'Приходилось ли скрывать размер ставок или проигрышей?',
      ],
      helpResourcesTitle: 'Бесплатная и конфиденциальная помощь',
      helpResourcesSubtitle: 'Если контроль даётся трудно, обратитесь к профессиональным службам поддержки:',
      resources: [
        {
          name: 'Gambling Therapy',
          region: 'Международная · Мультиязычная',
          desc: 'Бесплатные онлайн-группы поддержки и консультации.',
          url: 'https://www.gamblingtherapy.org/',
        },
        {
          name: 'BeGambleAware',
          region: 'Международная / UK',
          desc: 'Инструменты самоконтроля и профессиональные рекомендации.',
          url: 'https://www.gambleaware.org/',
        },
        {
          name: 'Gamblers Anonymous',
          region: 'Глобальное сообщество',
          desc: 'Группы взаимопомощи по всему миру.',
          url: 'https://www.gamblersanonymous.org/',
        },
      ],
      closingNote: 'MatchEdge не является букмекером и не принимает ставки. Все данные носят информационно-статистический характер.',
    },
  },
};
