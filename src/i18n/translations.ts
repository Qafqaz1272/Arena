import type { Language } from '../types/football';

export interface TranslationDictionary {
  brandTagline: string;
  nav: {
    dashboard: string;
    matches: string;
    predictions: string;
    teamsLeagues: string;
    watchlist: string;
    performance: string;
    googleChat: string;
  };
  common: {
    demoMode: string;
    demoBannerTitle: string;
    demoBannerDesc: string;
    liveApiMode: string;
    refresh: string;
    retry: string;
    searchPlaceholder: string;
    allCountries: string;
    allLeagues: string;
    allDates: string;
    allStatuses: string;
    live: string;
    upcoming: string;
    finished: string;
    home: string;
    draw: string;
    away: string;
    over25: string;
    under25: string;
    bttsYes: string;
    bttsNo: string;
    confidence: string;
    low: string;
    medium: string;
    high: string;
    uncertainty: string;
    expectedGoals: string;
    eloRating: string;
    standingsPos: string;
    saveToWatchlist: string;
    removeFromWatchlist: string;
    saved: string;
    backToMatches: string;
    noResults: string;
    clearFilters: string;
    errorTitle: string;
    rateLimitTitle: string;
    rateLimitDesc: string;
    lightTheme: string;
    darkTheme: string;
    openMenu: string;
    closeMenu: string;
    disclaimer: string;
    viewDetails: string;
    vs: string;
    minConfidence: string;
    marketType: string;
    allMarkets: string;
    market1x2: string;
    marketOver25: string;
    marketBtts: string;
    probability: string;
    mostLikelyScore: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    topPicksTitle: string;
    topPicksSubtitle: string;
    todaysMatchesTitle: string;
    liveNow: string;
    kpiTotalToday: string;
    kpiLiveCount: string;
    kpiHighConf: string;
    kpiAvgModelEdge: string;
    viewAllPredictions: string;
  };
  matches: {
    title: string;
    subtitle: string;
    resultsCount: string;
    dateFilterToday: string;
    dateFilterTomorrow: string;
    dateFilterYesterday: string;
  };
  matchDetail: {
    predictionPanel: string;
    whyTitle: string;
    whySubtitle: string;
    factorWeight: string;
    scorelinesTitle: string;
    h2hTitle: string;
    noH2H: string;
    last10Form: string;
    homeAwaySplits: string;
    homeRecord: string;
    awayRecord: string;
    goalsAndXg: string;
    squadAvailability: string;
    noAbsences: string;
    injury: string;
    suspension: string;
    keyPlayer: string;
    rotationPlayer: string;
    minorPlayer: string;
    venue: string;
    xgAvailable: string;
    xgEstimated: string;
    liveAdjustedLabel: string;
    remainingXG: string;
    finalScorelinesTitle: string;
    liveStatsTitle: string;
    possession: string;
    shots: string;
    shotsOnTarget: string;
    corners: string;
    factors: {
      poisson_attack_defense: string;
      elo_rating: string;
      recent_form: string;
      home_advantage: string;
      head_to_head: string;
      squad_availability: string;
      fatigue_congestion: string;
    };
    factorDescriptions: {
      poisson_attack_defense: string;
      elo_rating: string;
      recent_form: string;
      home_advantage: string;
      head_to_head: string;
      squad_availability: string;
      fatigue_congestion: string;
    };
    favorsHome: string;
    favorsAway: string;
    balanced: string;
    factorTooltips: {
      hoverHint: string;
      confidenceImpact: string;
      signalImpactLabel: string;
      directModifierLabel: string;
      alignmentReinforces: string;
      alignmentOpposes: string;
      alignmentNeutral: string;
      finalConfidenceLabel: string;
      formulaPrefix: string;
      explanations: {
        poisson_attack_defense: string;
        elo_rating: string;
        recent_form: string;
        home_advantage: string;
        head_to_head: string;
        squad_availability: string;
        fatigue_congestion: string;
      };
      modifierReasons: {
        xg_bonus: string;
        xg_estimated: string;
        form_depth_bonus: string;
        form_depth_limited: string;
        h2h_sample_bonus: string;
        h2h_sample_limited: string;
        key_absences_penalty: string;
        no_key_absences: string;
        fatigue_congestion_penalty: string;
        fatigue_rested: string;
        signal_only: string;
      };
    };
  };
  predictions: {
    title: string;
    subtitle: string;
    rank: string;
    match: string;
    recommendedPick: string;
    calibratedProb: string;
    scoreline: string;
    confidenceCol: string;
  };
  teamsLeagues: {
    title: string;
    subtitle: string;
    selectLeague: string;
    standingsTitle: string;
    teamStatsTitle: string;
    pos: string;
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goals: string;
    gd: string;
    pts: string;
    xgDiff: string;
    form: string;
    trend: string;
    leagueAvgGoals: string;
    homeAdvMultiplier: string;
  };
  watchlist: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDesc: string;
    browseMatches: string;
    savedPick: string;
    remove: string;
    clearAll: string;
  };
  performance: {
    title: string;
    subtitle: string;
    kpiHitRate: string;
    kpiHighConfHit: string;
    kpiEvaluated: string;
    kpiBrier: string;
    hitRateByLeague: string;
    calibrationByBand: string;
    monthlyTrendTitle: string;
    recentResolvedTitle: string;
    actualHitRate: string;
    expectedProb: string;
    predicted: string;
    actual: string;
    outcome: string;
    hit: string;
    miss: string;
    brierNote: string;
  };
  matchChat: {
    title: string;
    subtitle: string;
    askButton: string;
    placeholder: string;
    send: string;
    thinking: string;
    clearChat: string;
    welcomePrefix: string;
    youLabel: string;
    analystLabel: string;
    footerNote: string;
    closeSidebar: string;
    contextActive: string;
    suggestedFollowups: string;
    livePrompts: string[];
    upcomingPrompts: string[];
    finishedPrompts: string[];
    couponConceptLabel: string;
    conceptAuto: string;
    conceptCustom: string;
    customOddsPlaceholder: string;
    attachScreenshot: string;
    removeScreenshot: string;
    screenshotHint: string;
    screenshotAttachedNote: string;
    dropScreenshotHere: string;
    unsupportedImageError: string;
    imageTooLargeError: string;
    maxImagesNote: string;
  };
  toast: {
    regionLabel: string;
    dismiss: string;
    chatErrorTitle: string;
    chatRateLimitTitle: string;
  };
  googleChat: {
    title: string;
    subtitle: string;
    shareMatchButton: string;
    connectTitle: string;
    connectDesc: string;
    sessionRefreshDesc: string;
    signInWithGoogle: string;
    reconnectWithGoogle: string;
    signOut: string;
    switchAccount: string;
    featureBrowseSpaces: string;
    featureShareReports: string;
    featureConfirmAlways: string;
    prerequisitesTitle: string;
    prereqWorkspaceTitle: string;
    prereqWorkspaceDesc: string;
    prereqChatAppTitle: string;
    prereqChatAppDesc: string;
    openChatConfigConsole: string;
    spacesTitle: string;
    spaceFallback: string;
    newSpace: string;
    spaceNameLabel: string;
    spaceNamePlaceholder: string;
    createButton: string;
    searchSpacesPlaceholder: string;
    loadingSpaces: string;
    noSpacesFound: string;
    selectSpacePrompt: string;
    loadingMessages: string;
    noMessagesYet: string;
    unknownSender: string;
    selectMatchToShare: string;
    insertMatchReport: string;
    composerPlaceholder: string;
    sendMessageButton: string;
    confirmationGuaranteeNote: string;
    reactButton: string;
    deleteMessageButton: string;
    readyToShareMatch: string;
    readyToShareHintSignedIn: string;
    readyToShareHintSignedOut: string;
    dismissDraft: string;
    draftPreviewTitle: string;
    confirmSendTitle: string;
    confirmSendDesc: string;
    confirmSendAction: string;
    targetSpaceLabel: string;
    confirmCreateSpaceTitle: string;
    confirmCreateSpaceDesc: string;
    confirmCreateSpaceAction: string;
    confirmDeleteTitle: string;
    confirmDeleteDesc: string;
    confirmDeleteAction: string;
    confirmReactTitle: string;
    confirmReactDesc: string;
    confirmReactAction: string;
    reactionLabel: string;
    cancelAction: string;
    messageSentSuccess: string;
    spaceCreatedSuccess: string;
    messageDeletedSuccess: string;
    reactionAddedSuccess: string;
    missingTokenError: string;
    authFailed: string;
    errorAppNotConfiguredTitle: string;
    errorAppNotConfiguredDesc: string;
    errorWorkspaceRequiredTitle: string;
    errorWorkspaceRequiredDesc: string;
    errorUnauthorizedTitle: string;
    errorGenericTitle: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  az: {
    brandTagline: 'Futbol Analitikası',
    nav: {
      dashboard: 'İdarə Paneli',
      matches: 'Matçlar',
      predictions: 'Proqnozlar',
      teamsLeagues: 'Komandalar və Liqalar',
      watchlist: 'İzləmə Siyahım',
      performance: 'Performans',
      googleChat: 'Google Chat',
    },
    common: {
      demoMode: 'DEMO REJİM',
      demoBannerTitle: 'DEMO REJİM — Nümunə məlumatlar göstərilir',
      demoBannerDesc:
        'Canlı futbol API açarı (API_FOOTBALL_KEY və ya FOOTBALL_DATA_API_KEY) təyin edilməyib. Bütün statistik hesablamalar real model ilə nümunə verilənlər üzərində işləyir.',
      liveApiMode: 'CANLI API',
      refresh: 'Yenilə',
      retry: 'Yenidən cəhd et',
      searchPlaceholder: 'Komanda, liqa və ya ölkə axtar...',
      allCountries: 'Bütün ölkələr',
      allLeagues: 'Bütün liqalar',
      allDates: 'Bütün tarixlər',
      allStatuses: 'Bütün statuslar',
      live: 'Canlı',
      upcoming: 'Gözlənilən',
      finished: 'Bitmiş',
      home: 'Ev sahibi (1)',
      draw: 'Heç-heçə (X)',
      away: 'Qonaq (2)',
      over25: 'Üst 2.5',
      under25: 'Alt 2.5',
      bttsYes: 'QQ Bəli',
      bttsNo: 'QQ Xeyr',
      confidence: 'Etibarlılıq',
      low: 'Aşağı',
      medium: 'Orta',
      high: 'Yüksək',
      uncertainty: 'Qeyri-müəyyənlik',
      expectedGoals: 'Gözlənilən Qol (λ)',
      eloRating: 'Elo Reytinq',
      standingsPos: 'Turnir sırası',
      saveToWatchlist: 'İzləmə siyahısına əlavə et',
      removeFromWatchlist: 'İzləmə siyahısından çıxar',
      saved: 'Saxlanılıb',
      backToMatches: 'Matçlara qayıt',
      noResults: 'Seçilmiş filtrlərə uyğun matç tapılmadı.',
      clearFilters: 'Filtrləri sıfırla',
      errorTitle: 'Məlumat yüklənərkən xəta baş verdi',
      rateLimitTitle: 'API sorğu limiti dolub',
      rateLimitDesc: 'Müvəqqəti olaraq keşilənmiş məlumatlar istifadə olunur. Bir qədər sonra yenidən yoxlayın.',
      lightTheme: 'Açıq tema',
      darkTheme: 'Tünd tema',
      openMenu: 'Menyunu aç',
      closeMenu: 'Menyunu bağla',
      disclaimer:
        'Proqnozlar statistik qiymətləndirmələrdir, zəmanət deyil. Yalnız məlumat məqsədi daşıyır. 18+. Məsuliyyətlə davranın.',
      viewDetails: 'Təhlilə bax',
      vs: 'vs',
      minConfidence: 'Min. etibarlılıq',
      marketType: 'Bazar növü',
      allMarkets: 'Bütün bazarlar',
      market1x2: '1X2 Nəticə',
      marketOver25: 'Üst / Alt 2.5',
      marketBtts: 'Hər İki Komanda Qol (QQ)',
      probability: 'Ehtimal',
      mostLikelyScore: 'Ən real hesab',
    },
    dashboard: {
      title: 'Günün Futbol Analitikası',
      subtitle: 'Liqalar üzrə qruplaşdırılmış matçlar, canlı nəticələr və kalibrlənmiş statistik seçimlər.',
      topPicksTitle: 'Ən Yüksək Ehtimallı Seçimlər',
      topPicksSubtitle: 'Poisson + Elo + forma modeli üzrə ən güclü statistik siqnallar',
      todaysMatchesTitle: 'Liqalar üzrə Matçlar',
      liveNow: 'Canlı',
      kpiTotalToday: 'İzlənən Matçlar',
      kpiLiveCount: 'Canlı Oyunlar',
      kpiHighConf: 'Yüksək Etibarlılıq',
      kpiAvgModelEdge: 'Orta Model Ehtimalı',
      viewAllPredictions: 'Bütün proqnozlar',
    },
    matches: {
      title: 'Dünya üzrə Matçlar',
      subtitle: 'Ölkə, liqa, tarix və status üzrə bütün oyunları axtarın və filtrləyin.',
      resultsCount: 'matç göstərilir',
      dateFilterToday: 'Bu gün',
      dateFilterTomorrow: 'Sabah',
      dateFilterYesterday: 'Dünən',
    },
    matchDetail: {
      predictionPanel: 'Statistik Proqnoz Paneli',
      whyTitle: 'Niyə bu proqnoz?',
      whySubtitle: 'Modelin 6 şəffaf statistik faktoru və hər birinin qərar çəkisi',
      factorWeight: 'Çəki',
      scorelinesTitle: 'Ən Ehtimallı Hesablar (Poisson)',
      h2hTitle: 'Şəxsi Görüşlər Tarixçəsi (H2H)',
      noH2H: 'Son mövsümlərdə qeydə alınmış şəxsi görüş yoxdur.',
      last10Form: 'Son 10 Oyun Forması',
      homeAwaySplits: 'Ev / Səfər Göstəriciləri',
      homeRecord: 'Evdə',
      awayRecord: 'Səfərdə',
      goalsAndXg: 'Qollar və xG Müqayisəsi',
      squadAvailability: 'Heyət Vəziyyəti (Zədə və Cəzalar)',
      noAbsences: 'Əsas heyətdə itki qeydə alınmayıb.',
      injury: 'Zədəli',
      suspension: 'Cəzalı',
      keyPlayer: 'Əsas oyunçu',
      rotationPlayer: 'Rotasiya',
      minorPlayer: 'Ehtiyat',
      venue: 'Stadion',
      xgAvailable: 'xG məlumatı mövcuddur',
      xgEstimated: 'Qol ortalamasından hesablanıb',
      liveAdjustedLabel: 'Canlı gedişat modeli',
      remainingXG: 'Qalan vaxt gözlənilən qol (λ)',
      finalScorelinesTitle: 'Yekun Hesab Ehtimalları (Canlı)',
      liveStatsTitle: 'Oyun Statistikası',
      possession: 'Topa sahib olma',
      shots: 'Ümumi zərbələr',
      shotsOnTarget: 'Çərçivəyə zərbə',
      corners: 'Künc zərbələri',
      factors: {
        poisson_attack_defense: 'Poisson Hücum / Müdafiə',
        elo_rating: 'Elo Reytinq Fərqi',
        recent_form: 'Son 10 Oyun Forması',
        home_advantage: 'Ev Sahibi Üstünlüyü',
        head_to_head: 'Şəxsi Görüşlər (H2H)',
        squad_availability: 'Heyət İtkiləri',
        fatigue_congestion: 'Yorğunluq və Təqvim Sıxlığı',
      },
      factorDescriptions: {
        poisson_attack_defense: 'Ev və səfər xG/qol güclərindən hesablanan ikili Poisson qol paylanması.',
        elo_rating: 'Komandaların uzunmüddətli güc reytinqi fərqi.',
        recent_form: 'Son 10 matçın eksponensial zaman çəkili nəticə və qol fərqi indeksi.',
        home_advantage: 'Liqa üzrə ev meydanı əmsalı və komandaların ev/səfər xal ortalaması.',
        head_to_head: 'Kiçik nümunə səhvinə qarşı Bayes düzəlişli şəxsi görüş balansı.',
        squad_availability: 'Zədəli və cəzalı əsas oyunçuların hücum/müdafiə gücünə təsiri.',
        fatigue_congestion: 'Son 7 gündə keçirilən oyun sayı və bərpa günlərinə görə fiziki yüklənmə təsiri.',
      },
      favorsHome: 'Ev üstünlüyü',
      favorsAway: 'Qonaq üstünlüyü',
      balanced: 'Balanslı',
      factorTooltips: {
        hoverHint: 'Yekun etibarlılıq faizinə dəqiq təsirini görmək üçün istənilən faktorun üzərinə gəlin',
        confidenceImpact: 'Etibarlılığa təsir',
        signalImpactLabel: 'Ehtimal fərqi siqnalı',
        directModifierLabel: 'Birbaşa bonus / cərimə',
        alignmentReinforces: 'Əsas proqnozu gücləndirir',
        alignmentOpposes: 'Əsas proqnozu zəiflədir',
        alignmentNeutral: 'Neytral siqnal',
        finalConfidenceLabel: 'Yekun etibarlılıq balı',
        formulaPrefix: 'Model düsturu',
        explanations: {
          poisson_attack_defense:
            '30% çəki ilə əsas qol gözləntilərini (λ) müəyyən edir. Komandalar arasında λ fərqi artdıqca 1X2 ehtimal ayrılması böyüyür və etibarlılıq yüksəlir; real xG mövcud olduqda əlavə +5% məlumat keyfiyyəti bonusu verilir.',
          elo_rating:
            '22% çəki ilə uzunmüddətli güc fərqini (±22%-ə qədər λ tənzimləməsi) modelə daxil edir. Böyük Elo fərqi favoritlə ikinci nəticə arasındakı məsafəni genişləndirərək etibarlılıq faizini artırır.',
          recent_form:
            '16% çəki ilə son 10 matçı eksponensial azalma (0.84) ilə ölçür. Formada açıq üstünlük 1X2 fərqini gücləndirir, hər iki komandanın ≥8 oyunluq forması olduqda isə +4% nümunə dərinliyi bonusu əlavə olunur.',
          home_advantage:
            '11% çəki ilə liqanın ev əmsalını və komandaların ev/səfər xal ortalamasını birləşdirir. Meydan üstünlüyü əsas proqnozla üst-üstə düşdükdə etibarlılığı artırır, əks halda balansı sıxır.',
          head_to_head:
            '7% çəki və Bayes sıxılması n/(n+5) ilə tarixi görüşləri nəzərə alır. Kiçik nümunələrdə şişirtmənin qarşısını alır, ≥3 şəxsi görüş olduqda isə etibarlılığa +2% bonus verir.',
          squad_availability:
            '7% çəki ilə zədəli/cəzalı oyunçuların hücum və müdafiə təsirini hesablayır. Hər itirilmiş əsas heyət oyunçusu qeyri-müəyyənlik yaradaraq yekun etibarlılıq faizindən birbaşa -3.5% çıxır.',
          fatigue_congestion:
            '7% çəki ilə son 7 gündə oynanan matçların sayını və istirahət günlərini ölçür. Həftəiçi sıx təqvimdə olan komandanın λ hücum/müdafiə ritmi aşağı salınır və sıx qrafikli hər komanda etibarlılıqdan -1.5% çıxır.',
        },
        modifierReasons: {
          xg_bonus: 'Real xG məlumatı aktivdir: etibarlılığa birbaşa +5.0% bonus.',
          xg_estimated: 'xG qol ortalamasından hesablanıb: əlavə məlumat bonusu yoxdur (0.0%).',
          form_depth_bonus: 'Hər iki komandada ≥8 oyunluq forma var: +4.0% nümunə bonusu.',
          form_depth_limited: 'Son oyun nümunəsi 8-dən azdır: forma bonusu tətbiq edilmir (0.0%).',
          h2h_sample_bonus: 'Ən azı 3 H2H görüşü mövcuddur: +2.0% tarixi məlumat bonusu.',
          h2h_sample_limited: '3-dən az H2H görüşü var: tarixi bonus tətbiq edilmir (0.0%).',
          key_absences_penalty: 'Əsas heyət itkiləri qeyri-müəyyənliyi artırır (hər oyunçu -3.5%).',
          no_key_absences: 'Əsas heyətdə kritik itki yoxdur: heyət cəriməsi 0.0%.',
          fatigue_congestion_penalty: 'Son 7 gündə ≥2 oyun: sıx təqvim və rotasiya riski (komanda başına -1.5%).',
          fatigue_rested: 'Təqvim sıxlığı normaldır: yorğunluq cəriməsi 0.0%.',
          signal_only: 'Yekun etibarlılığa yalnız 1X2 ehtimal ayrılması vasitəsilə təsir edir.',
        },
      },
    },
    predictions: {
      title: 'Sıralanmış Proqnozlar',
      subtitle: 'Qələbə və bazar ehtimalına görə kalibrlənmiş matç reytinqi.',
      rank: '#',
      match: 'Matç',
      recommendedPick: 'Əsas Seçim',
      calibratedProb: 'Ehtimal (±səhv)',
      scoreline: 'Top Hesab',
      confidenceCol: 'Etibarlılıq',
    },
    teamsLeagues: {
      title: 'Komandalar və Liqalar',
      subtitle: 'Turnir cədvəlləri, xG fərqləri, Elo reytinqləri və forma trendləri.',
      selectLeague: 'Liqa seçin',
      standingsTitle: 'Turnir Cədvəli',
      teamStatsTitle: 'Komanda Statistikası və Forma Trendi',
      pos: '#',
      team: 'Komanda',
      played: 'O',
      won: 'Q',
      drawn: 'H',
      lost: 'M',
      goals: 'Qollar',
      gd: 'QF',
      pts: 'Xal',
      xgDiff: 'xG Fərqi',
      form: 'Son 5',
      trend: 'Xal Trendi',
      leagueAvgGoals: 'Orta Qol (Ev / Səfər)',
      homeAdvMultiplier: 'Ev Üstünlüyü Əmsalı',
    },
    watchlist: {
      title: 'İzləmə Siyahım',
      subtitle: 'Brauzerdə saxlanılan seçilmiş matçlar və statistik proqnozlar.',
      emptyTitle: 'İzləmə siyahınız boşdur',
      emptyDesc: 'İstənilən matçın kartından və ya təhlil səhifəsindən oyunları bura əlavə edə bilərsiniz.',
      browseMatches: 'Matçlara bax',
      savedPick: 'Saxlanılan seçim',
      remove: 'Sil',
      clearAll: 'Hamısını təmizlə',
    },
    performance: {
      title: 'Model Performansı və Kalibrləmə',
      subtitle: 'Keçmiş proqnozların liqa və etibarlılıq səviyyəsi üzrə dəqiqlik hesabatı.',
      kpiHitRate: 'Ümumi Dəqiqlik',
      kpiHighConfHit: 'Yüksək Etibarlılıq Dəqiqliyi',
      kpiEvaluated: 'Qiymətləndirilmiş Matç',
      kpiBrier: 'Orta Brier Balı',
      hitRateByLeague: 'Liqalar üzrə Dəqiqlik (%)',
      calibrationByBand: 'Etibarlılıq Səviyyəsi üzrə Kalibrləmə',
      monthlyTrendTitle: 'Aylıq Dəqiqlik Trendi',
      recentResolvedTitle: 'Son Tamamlanmış Proqnozlar',
      actualHitRate: 'Faktiki dəqiqlik',
      expectedProb: 'Model gözləntisi',
      predicted: 'Proqnoz',
      actual: 'Faktiki',
      outcome: 'Status',
      hit: 'Düzgün',
      miss: 'Yanlış',
      brierNote: 'Brier balı aşağı olduqca ehtimal kalibrləməsi daha dəqiqdir (0.20 altı güclü sayılır).',
    },
    matchChat: {
      title: 'Matç Analitik Çatbotu',
      subtitle: 'Bu matçın real statistikası, canlı gedişatı və Poisson/Elo göstəriciləri əsasında sual verin.',
      askButton: 'Matç haqqında soruş',
      placeholder: 'Məs: Bu oyunda Üst 2.5 və ya geri dönüş şansı necədir?',
      send: 'Göndər',
      thinking: 'Matç analiz edilir...',
      clearChat: 'Söhbəti təmizlə',
      welcomePrefix: 'Bu oyun üzrə istənilən analitik sualı yaza və ya aşağıdakı hazır suallardan birini seçə bilərsiniz:',
      youLabel: 'Siz',
      analystLabel: 'MatchEdge Analitik',
      footerNote: 'Cavablar yalnız bu matçın real statistik göstəricilərinə əsaslanır və zəmanət deyil.',
      closeSidebar: 'Çat panelini bağla',
      contextActive: 'Matç statistikası, forma, H2H və 6 proqnoz faktoru yüklənib',
      suggestedFollowups: 'Əlavə suallar',
      livePrompts: [
        'Cari hesab və dəqiqəyə görə qalib və ya geri dönüş şansı necədir?',
        'Qalan vaxtda qol ehtimalı (Üst/Alt 2.5 və QQ) necə görünür?',
        'Ən real yekun hesab hansıdır və niyə?',
        'Komandaların forma, Elo və oyun gedişatı müqayisəsi',
      ],
      upcomingPrompts: [
        'Bu matçda əsas favorit kimdir və hansı faktorlar üstünlük verir?',
        'Üst/Alt 2.5 və Hər İki Komanda Qol (QQ) bazarı üzrə analiz',
        'Ev/səfər göstəriciləri, H2H və heyət itkilərinin təsiri',
        'Bu oyunda əsas risklər və sürpriz ehtimalı nədir?',
      ],
      finishedPrompts: [
        'Yekun hesab statistik modelin gözləntiləri ilə necə uzlaşdı?',
        'Oyun statistikaları nəticəni necə izah edir?',
        'Hər iki komandanın son forması və Elo mövqeyi barədə xülasə',
        'Növbəti turlar üçün bu komandalarda nəyə diqqət etməli?',
      ],
      couponConceptLabel: 'Kupon konsepti',
      conceptAuto: 'Avto',
      conceptCustom: 'Özel',
      customOddsPlaceholder: 'Məs: 15',
      attachScreenshot: 'Ekran görüntüsü əlavə et (Misli və s.)',
      removeScreenshot: 'Şəkli sil',
      screenshotHint: 'Misli və ya digər saytlardan kupon/əmsal ekran görüntüsü yükləyin (və ya Ctrl+V yapışdırın), hədəf əmsalı seçin.',
      screenshotAttachedNote: 'ekran görüntüsü hazırdır',
      dropScreenshotHere: 'Ekran görüntüsünü bura buraxın',
      unsupportedImageError: 'Yalnız PNG, JPG və ya WebP ekran görüntüləri dəstəklənir.',
      imageTooLargeError: 'Şəkil həcmi çox böyükdür (maks. 12 MB).',
      maxImagesNote: 'Maksimum 2 ekran görüntüsü əlavə edilə bilər.',
    },
    toast: {
      regionLabel: 'Bildirişlər',
      dismiss: 'Bildirişi bağla',
      chatErrorTitle: 'Çat xidməti xətası',
      chatRateLimitTitle: 'Çat sorğu limiti dolub',
    },
    googleChat: {
      title: 'Google Chat İnteqrasiyası',
      subtitle: 'Komanda otaqlarını izləyin, mesajları oxuyun və MatchEdge matç analizlərini təsdiqləyərək paylaşın.',
      shareMatchButton: 'Google Chat-da paylaş',
      connectTitle: 'Google Chat hesabınızı qoşun',
      connectDesc: 'Google Workspace hesabınızla daxil olaraq Google Chat otaqlarına baxa və matç proqnoz hesabatlarını komandanızla paylaşa bilərsiniz.',
      sessionRefreshDesc: 'Təhlükəsizlik üçün OAuth giriş açarı yalnız yaddaşda saxlanılır. Google Chat-a qoşulmaq üçün yenidən təsdiqləyin.',
      signInWithGoogle: 'Google ilə daxil olun',
      reconnectWithGoogle: 'Google Chat sessiyasını yenilə',
      signOut: 'Çıxış',
      switchAccount: 'Hesabı dəyiş',
      featureBrowseSpaces: 'Google Chat otaqlarınızı (Spaces) axtarın, yaradın və son mesajları oxuyun.',
      featureShareReports: 'İstənilən canlı və ya gözlənilən matçın Poisson/Elo xülasəsini bir kliklə mesaja əlavə edin.',
      featureConfirmAlways: 'Hər hansı mesaj göndərmədən, otaq yaratmadan və ya silmədən əvvəl təsdiq pəncərəsi göstərilir.',
      prerequisitesTitle: 'Tələb olunan şərtlər (Google Chat API)',
      prereqWorkspaceTitle: 'Google Workspace hesabı',
      prereqWorkspaceDesc: 'Google Chat API istifadəçi autentifikasiyası üçün Business və ya Enterprise Google Workspace hesabı tələb olunur. Şəxsi @gmail.com hesabları dəstəklənmir.',
      prereqChatAppTitle: 'Google Chat tətbiqinin birdəfəlik konfiqurasiyası',
      prereqChatAppDesc: 'Google Cloud Console-da Google Chat API > Configuration bölməsində tətbiq adını, avatar URL-ni və təsvirini daxil edib yadda saxlayın.',
      openChatConfigConsole: 'Cloud Console-da konfiqurasiya et',
      spacesTitle: 'Chat Otaqları',
      spaceFallback: 'Otaq',
      newSpace: 'Yeni otaq',
      spaceNameLabel: 'Otaq adı',
      spaceNamePlaceholder: 'Məs: MatchEdge Analitika',
      createButton: 'Yarat',
      searchSpacesPlaceholder: 'Otaq axtar...',
      loadingSpaces: 'Otaqlar yüklənir...',
      noSpacesFound: 'Uyğun Google Chat otağı tapılmadı.',
      selectSpacePrompt: 'Mesajları görmək üçün sol siyahıdan bir otaq seçin.',
      loadingMessages: 'Mesajlar yüklənir...',
      noMessagesYet: 'Bu otaqda hələ mesaj yoxdur.',
      unknownSender: 'İstifadəçi',
      selectMatchToShare: 'Paylaşılacaq matçı seçin',
      insertMatchReport: 'Matç analizini əlavə et',
      composerPlaceholder: 'Google Chat otağına mesaj yazın və ya yuxarıdan matç analizi əlavə edin...',
      sendMessageButton: 'Göndər',
      confirmationGuaranteeNote: 'Mesaj göndərilməzdən əvvəl təsdiq pəncərəsi açılacaq.',
      reactButton: 'Reaksiya əlavə et',
      deleteMessageButton: 'Mesajı sil',
      readyToShareMatch: 'Paylaşılmağa hazır matç analizi',
      readyToShareHintSignedIn: 'Sol siyahıdan otaq seçin və aşağıdakı Göndər düyməsinə klikləyin.',
      readyToShareHintSignedOut: 'Aşağıdakı Google ilə daxil olun düyməsi ilə qoşulun — hesabatınız hazırdır.',
      dismissDraft: 'Qaralamanı bağla',
      draftPreviewTitle: 'Hazırlanmış matç hesabatı',
      confirmSendTitle: 'Google Chat mesajını göndərməyi təsdiqləyin',
      confirmSendDesc: 'Bu mesaj seçilmiş Google Chat otağındakı bütün üzvlərə göndəriləcək.',
      confirmSendAction: 'Təsdiqlə və göndər',
      targetSpaceLabel: 'Hədəf otaq',
      confirmCreateSpaceTitle: 'Yeni Google Chat otağı yaradılsın?',
      confirmCreateSpaceDesc: 'Google Workspace hesabınızda yeni Chat otağı yaradılacaq.',
      confirmCreateSpaceAction: 'Otağı yarat',
      confirmDeleteTitle: 'Mesajı silməyi təsdiqləyin',
      confirmDeleteDesc: 'Bu əməliyyat mesajı Google Chat otağından həmişəlik siləcək.',
      confirmDeleteAction: 'Sil',
      confirmReactTitle: 'Reaksiya əlavə edilsin?',
      confirmReactDesc: 'Seçilmiş mesaja emoji reaksiyası əlavə olunacaq.',
      confirmReactAction: 'Əlavə et',
      reactionLabel: 'Reaksiya',
      cancelAction: 'Ləğv et',
      messageSentSuccess: 'Mesaj Google Chat otağına göndərildi.',
      spaceCreatedSuccess: 'Yeni Google Chat otağı yaradıldı.',
      messageDeletedSuccess: 'Mesaj silindi.',
      reactionAddedSuccess: 'Reaksiya əlavə edildi.',
      missingTokenError: 'Google OAuth giriş açarı alınmadı. Yenidən cəhd edin.',
      authFailed: 'Google ilə giriş uğursuz oldu.',
      errorAppNotConfiguredTitle: 'Google Chat tətbiqi hələ konfiqurasiya edilməyib (HTTP 404)',
      errorAppNotConfiguredDesc: 'Google Cloud Console-da Google Chat API > Configuration səhifəsini açıb tətbiq adı, avatar URL və təsviri yadda saxlayın, sonra yenidən yoxlayın.',
      errorWorkspaceRequiredTitle: 'Google Workspace hesabı tələb olunur',
      errorWorkspaceRequiredDesc: 'Google Chat API yalnız Business və ya Enterprise Google Workspace hesabları ilə işləyir. Şəxsi @gmail.com hesabı dəstəklənmir.',
      errorUnauthorizedTitle: 'Google Chat sessiyasının vaxtı bitib',
      errorGenericTitle: 'Google Chat API xətası',
    },
  },
  en: {
    brandTagline: 'Football Analytics',
    nav: {
      dashboard: 'Dashboard',
      matches: 'Matches',
      predictions: 'Predictions',
      teamsLeagues: 'Teams & Leagues',
      watchlist: 'My Watchlist',
      performance: 'Performance',
      googleChat: 'Google Chat',
    },
    common: {
      demoMode: 'DEMO MODE',
      demoBannerTitle: 'DEMO MODE — Displaying sample dataset',
      demoBannerDesc:
        'No live football API key (API_FOOTBALL_KEY or FOOTBALL_DATA_API_KEY) is configured. All statistical outputs run our live model on realistic sample data.',
      liveApiMode: 'LIVE API',
      refresh: 'Refresh',
      retry: 'Try again',
      searchPlaceholder: 'Search team, league, or country...',
      allCountries: 'All countries',
      allLeagues: 'All leagues',
      allDates: 'All dates',
      allStatuses: 'All statuses',
      live: 'Live',
      upcoming: 'Upcoming',
      finished: 'Finished',
      home: 'Home (1)',
      draw: 'Draw (X)',
      away: 'Away (2)',
      over25: 'Over 2.5',
      under25: 'Under 2.5',
      bttsYes: 'BTTS Yes',
      bttsNo: 'BTTS No',
      confidence: 'Confidence',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      uncertainty: 'Uncertainty',
      expectedGoals: 'Expected Goals (λ)',
      eloRating: 'Elo Rating',
      standingsPos: 'Table Pos.',
      saveToWatchlist: 'Save to watchlist',
      removeFromWatchlist: 'Remove from watchlist',
      saved: 'Saved',
      backToMatches: 'Back to matches',
      noResults: 'No matches match your current filters.',
      clearFilters: 'Reset filters',
      errorTitle: 'Failed to load match data',
      rateLimitTitle: 'API rate limit reached',
      rateLimitDesc: 'Serving cached data temporarily. Please retry in a moment.',
      lightTheme: 'Light theme',
      darkTheme: 'Dark theme',
      openMenu: 'Open navigation menu',
      closeMenu: 'Close navigation menu',
      disclaimer:
        'Predictions are statistical estimates, not guarantees. For information only. 18+. Please act responsibly.',
      viewDetails: 'View analysis',
      vs: 'vs',
      minConfidence: 'Min. confidence',
      marketType: 'Market type',
      allMarkets: 'All markets',
      market1x2: '1X2 Result',
      marketOver25: 'Over / Under 2.5',
      marketBtts: 'Both Teams to Score',
      probability: 'Probability',
      mostLikelyScore: 'Top Score',
    },
    dashboard: {
      title: "Today's Match Analytics",
      subtitle: 'Matches grouped by league, live scores, and calibrated statistical projections.',
      topPicksTitle: 'Top Picks',
      topPicksSubtitle: 'Highest-probability statistical signals from the Poisson + Elo + form model',
      todaysMatchesTitle: 'Matches by League',
      liveNow: 'Live',
      kpiTotalToday: 'Tracked Matches',
      kpiLiveCount: 'Live Now',
      kpiHighConf: 'High Confidence',
      kpiAvgModelEdge: 'Avg. Top Probability',
      viewAllPredictions: 'All predictions',
    },
    matches: {
      title: 'Worldwide Matches',
      subtitle: 'Search and filter competitions across countries, leagues, dates, and statuses.',
      resultsCount: 'matches shown',
      dateFilterToday: 'Today',
      dateFilterTomorrow: 'Tomorrow',
      dateFilterYesterday: 'Yesterday',
    },
    matchDetail: {
      predictionPanel: 'Statistical Prediction Panel',
      whyTitle: 'Why this prediction?',
      whySubtitle: 'Transparent breakdown of all 6 weighted model factors',
      factorWeight: 'Weight',
      scorelinesTitle: 'Most Likely Scorelines (Poisson)',
      h2hTitle: 'Head-to-Head History',
      noH2H: 'No recent head-to-head meetings recorded.',
      last10Form: 'Last 10 Matches Form',
      homeAwaySplits: 'Home / Away Splits',
      homeRecord: 'Home',
      awayRecord: 'Away',
      goalsAndXg: 'Goals & xG Comparison',
      squadAvailability: 'Squad Availability (Injuries & Suspensions)',
      noAbsences: 'No major absences reported.',
      injury: 'Injured',
      suspension: 'Suspended',
      keyPlayer: 'Key starter',
      rotationPlayer: 'Rotation',
      minorPlayer: 'Depth',
      venue: 'Venue',
      xgAvailable: 'xG data available',
      xgEstimated: 'Estimated from goals',
      liveAdjustedLabel: 'Live In-Play Model',
      remainingXG: 'Remaining Expected Goals (λ)',
      finalScorelinesTitle: 'Projected Final Scorelines (Live)',
      liveStatsTitle: 'Match Statistics',
      possession: 'Possession',
      shots: 'Total Shots',
      shotsOnTarget: 'Shots on Target',
      corners: 'Corners',
      factors: {
        poisson_attack_defense: 'Poisson Attack / Defense',
        elo_rating: 'Elo Rating Differential',
        recent_form: 'Recent 10-Match Form',
        home_advantage: 'Home Advantage',
        head_to_head: 'Head-to-Head (H2H)',
        squad_availability: 'Squad Availability',
        fatigue_congestion: 'Fatigue & Schedule Congestion',
      },
      factorDescriptions: {
        poisson_attack_defense: 'Bivariate Dixon-Coles Poisson scoring rates derived from venue attack & defense xG/goals.',
        elo_rating: 'Long-term relative team strength differential via Elo ratings.',
        recent_form: 'Exponentially time-decayed results and goal difference over the last 10 games.',
        home_advantage: 'League-calibrated home multiplier combined with venue points-per-game splits.',
        head_to_head: 'Empirical-Bayes shrunk H2H historical record preventing small-sample overfitting.',
        squad_availability: 'Weighted offensive and defensive impact from injured or suspended squad members.',
        fatigue_congestion: 'Physical fatigue and fixture load measured by matches played in the last 7 days and rest days.',
      },
      favorsHome: 'Favors Home',
      favorsAway: 'Favors Away',
      balanced: 'Balanced',
      factorTooltips: {
        hoverHint: 'Hover or focus any factor to inspect its exact confidence impact',
        confidenceImpact: 'Confidence impact',
        signalImpactLabel: 'Separation signal',
        directModifierLabel: 'Direct bonus / penalty',
        alignmentReinforces: 'Reinforces top pick',
        alignmentOpposes: 'Dampens top pick',
        alignmentNeutral: 'Neutral signal',
        finalConfidenceLabel: 'Final confidence score',
        formulaPrefix: 'Model equation',
        explanations: {
          poisson_attack_defense:
            'Carries 30% model weight by setting baseline expected goals (λ). Wider λ gaps increase 1X2 probability separation and lift confidence; verified xG adds a direct +5% data-quality bonus.',
          elo_rating:
            'Carries 22% weight by shifting team scoring rates (up to ±22%) from long-term Elo gaps. Larger rating differentials widen the gap between the top two outcomes, raising confidence.',
          recent_form:
            'Carries 16% weight using exponential time decay (0.84) across the last 10 fixtures. Clear momentum widens 1X2 separation, and ≥8 matches for both teams adds a direct +4% sample-depth bonus.',
          home_advantage:
            'Carries 11% weight from league venue calibration and home/away PPG splits. When venue edge aligns with the favorite it widens separation; when it contradicts an away favorite it trims confidence.',
          head_to_head:
            'Carries 7% weight with empirical-Bayes shrinkage n/(n+5) to prevent small-sample overfitting. Having ≥3 historical H2H meetings adds a direct +2% confidence bonus.',
          squad_availability:
            'Carries 7% weight by penalizing attack/defense rates for injured or suspended players. Each missing key starter also deducts a direct -3.5% uncertainty penalty from final confidence.',
          fatigue_congestion:
            'Carries 7% weight by tracking matches played in the last 7 days and turnaround rest days. Heavy midweek fixture load trims expected output and applies a -1.5% rotation uncertainty modifier per congested team.',
        },
        modifierReasons: {
          xg_bonus: 'Verified xG data active: direct +5.0% data-quality bonus.',
          xg_estimated: 'xG estimated from goals: no direct xG bonus (0.0%).',
          form_depth_bonus: 'Both teams have ≥8 recent games: direct +4.0% form-depth bonus.',
          form_depth_limited: 'Fewer than 8 recent form games available: 0.0% bonus.',
          h2h_sample_bonus: 'At least 3 H2H meetings available: direct +2.0% sample bonus.',
          h2h_sample_limited: 'Fewer than 3 H2H meetings recorded: 0.0% bonus.',
          key_absences_penalty: 'Missing key starters add lineup uncertainty (-3.5% each).',
          no_key_absences: 'No key starters missing: 0.0% squad uncertainty penalty.',
          fatigue_congestion_penalty: 'Fixture congestion (≥2 matches in 7 days) adds rotation uncertainty (-1.5% per team).',
          fatigue_rested: 'Normal fixture spacing: 0.0% fatigue uncertainty penalty.',
          signal_only: 'Influences confidence purely via 1X2 probability separation.',
        },
      },
    },
    predictions: {
      title: 'Ranked Predictions',
      subtitle: 'Matches ranked by calibrated win and market probability with uncertainty margins.',
      rank: '#',
      match: 'Match',
      recommendedPick: 'Top Selection',
      calibratedProb: 'Probability (±SE)',
      scoreline: 'Likely Score',
      confidenceCol: 'Confidence',
    },
    teamsLeagues: {
      title: 'Teams & Leagues',
      subtitle: 'Competition tables, xG differentials, Elo ratings, and rolling form trends.',
      selectLeague: 'Select league',
      standingsTitle: 'League Standings',
      teamStatsTitle: 'Team Metrics & Form Trends',
      pos: '#',
      team: 'Team',
      played: 'P',
      won: 'W',
      drawn: 'D',
      lost: 'L',
      goals: 'Goals',
      gd: 'GD',
      pts: 'Pts',
      xgDiff: 'xG Diff',
      form: 'Last 5',
      trend: 'PPG Trend',
      leagueAvgGoals: 'Avg Goals (Home / Away)',
      homeAdvMultiplier: 'Home Advantage Factor',
    },
    watchlist: {
      title: 'My Watchlist',
      subtitle: 'Saved matches and statistical picks persisted locally in your browser.',
      emptyTitle: 'Your watchlist is empty',
      emptyDesc: 'Save any match from the dashboard, matches list, or match detail view to track it here.',
      browseMatches: 'Browse matches',
      savedPick: 'Saved pick',
      remove: 'Remove',
      clearAll: 'Clear all',
    },
    performance: {
      title: 'Model Performance & Calibration',
      subtitle: 'Historical verification of past predictions across leagues and confidence bands.',
      kpiHitRate: 'Overall Hit Rate',
      kpiHighConfHit: 'High-Confidence Hit Rate',
      kpiEvaluated: 'Matches Evaluated',
      kpiBrier: 'Mean Brier Score',
      hitRateByLeague: 'Hit Rate by League (%)',
      calibrationByBand: 'Calibration by Confidence Band',
      monthlyTrendTitle: 'Monthly Hit Rate Trend',
      recentResolvedTitle: 'Recent Settled Predictions',
      actualHitRate: 'Actual hit rate',
      expectedProb: 'Model expected',
      predicted: 'Predicted',
      actual: 'Actual',
      outcome: 'Outcome',
      hit: 'Hit',
      miss: 'Miss',
      brierNote: 'Lower Brier score indicates sharper probability calibration (< 0.20 is strong in football).',
    },
    matchChat: {
      title: 'Match Analyst Chatbot',
      subtitle: 'Ask anything about this fixture — answers are grounded in live stats, form, H2H, and Poisson/Elo numbers.',
      askButton: 'Ask about match',
      placeholder: 'e.g. How likely is Over 2.5 or a comeback from this score?',
      send: 'Send',
      thinking: 'Analyzing match data...',
      clearChat: 'Clear chat',
      welcomePrefix: 'Ask any analytical question about this match, or pick a quick prompt below:',
      youLabel: 'You',
      analystLabel: 'MatchEdge Analyst',
      footerNote: 'Answers are grounded strictly in this match’s statistical metrics and are not guarantees.',
      closeSidebar: 'Close chat sidebar',
      contextActive: 'Match stats, form, H2H & all 6 model factors loaded',
      suggestedFollowups: 'Follow-up prompts',
      livePrompts: [
        'Given the live score and minute, how likely is a comeback or hold?',
        'What are the remaining-time chances for Over/Under 2.5 and BTTS?',
        'Which final scoreline is most realistic and why?',
        'Compare both teams’ live trajectory, form, and Elo edge',
      ],
      upcomingPrompts: [
        'Who has the analytical edge here and which factors drive it?',
        'Break down Over/Under 2.5 and Both Teams to Score (BTTS)',
        'How do home/away splits, H2H, and absences impact this match?',
        'What are the key upset risks and uncertainty factors?',
      ],
      finishedPrompts: [
        'How did the final score compare with the statistical model?',
        'What do the match stats tell us about the result?',
        'Summarize both teams’ current form and Elo trajectory',
        'What should analysts watch in these teams’ upcoming fixtures?',
      ],
      couponConceptLabel: 'Coupon concept',
      conceptAuto: 'Auto',
      conceptCustom: 'Custom',
      customOddsPlaceholder: 'e.g. 15',
      attachScreenshot: 'Attach screenshot (Misli or other sites)',
      removeScreenshot: 'Remove screenshot',
      screenshotHint: 'Upload or paste (Ctrl+V) a betting/odds screenshot from Misli or any sports site and pick your target odds.',
      screenshotAttachedNote: 'screenshot ready',
      dropScreenshotHere: 'Drop screenshot here',
      unsupportedImageError: 'Only PNG, JPG, or WebP screenshots are supported.',
      imageTooLargeError: 'Image file is too large (max 12 MB).',
      maxImagesNote: 'Up to 2 screenshots can be attached per message.',
    },
    toast: {
      regionLabel: 'Notifications',
      dismiss: 'Dismiss notification',
      chatErrorTitle: 'Chat service error',
      chatRateLimitTitle: 'Chat rate limit reached',
    },
    googleChat: {
      title: 'Google Chat Integration',
      subtitle: 'Browse team spaces, read discussions, and share MatchEdge statistical match reports with explicit confirmation.',
      shareMatchButton: 'Share to Google Chat',
      connectTitle: 'Connect your Google Chat workspace',
      connectDesc: 'Sign in with your Google Workspace account to browse Google Chat spaces, read recent messages, and share calibrated match analysis reports.',
      sessionRefreshDesc: 'For security, OAuth access tokens stay in memory only. Re-authenticate to reconnect your Google Chat session.',
      signInWithGoogle: 'Sign in with Google',
      reconnectWithGoogle: 'Reconnect Google Chat',
      signOut: 'Sign out',
      switchAccount: 'Switch account',
      featureBrowseSpaces: 'Browse, search, and create Google Chat spaces and view live space messages.',
      featureShareReports: 'Insert formatted Poisson/Elo match reports for any live or upcoming fixture in one click.',
      featureConfirmAlways: 'Every send, create, reaction, or delete action requires explicit confirmation first.',
      prerequisitesTitle: 'Google Chat API Prerequisites',
      prereqWorkspaceTitle: 'Google Workspace account',
      prereqWorkspaceDesc: 'Calling the Google Chat API requires a Business or Enterprise Google Workspace account with Google Chat enabled. Consumer @gmail.com accounts are not supported.',
      prereqChatAppTitle: 'One-time Chat App configuration',
      prereqChatAppDesc: 'Configure Application info (App name, Avatar URL, Description) on the Google Chat API > Configuration page in Google Cloud Console before making API requests.',
      openChatConfigConsole: 'Open Google Chat Configuration',
      spacesTitle: 'Spaces',
      spaceFallback: 'Space',
      newSpace: 'New space',
      spaceNameLabel: 'Space name',
      spaceNamePlaceholder: 'e.g. MatchEdge Analysts',
      createButton: 'Create',
      searchSpacesPlaceholder: 'Filter spaces...',
      loadingSpaces: 'Loading spaces...',
      noSpacesFound: 'No Google Chat spaces found.',
      selectSpacePrompt: 'Select a space on the left to view messages.',
      loadingMessages: 'Loading messages...',
      noMessagesYet: 'No messages in this space yet.',
      unknownSender: 'Member',
      selectMatchToShare: 'Select match to format',
      insertMatchReport: 'Insert Match Report',
      composerPlaceholder: 'Write a message to Google Chat or insert a match analysis above...',
      sendMessageButton: 'Send to Google Chat',
      confirmationGuaranteeNote: 'You will review and confirm before anything is posted.',
      reactButton: 'Add reaction',
      deleteMessageButton: 'Delete message',
      readyToShareMatch: 'Match report ready to share',
      readyToShareHintSignedIn: 'Choose a destination space on the left and click Send to review & post.',
      readyToShareHintSignedOut: 'Sign in with Google below — your formatted match report is ready.',
      dismissDraft: 'Dismiss draft',
      draftPreviewTitle: 'Prepared match report',
      confirmSendTitle: 'Confirm sending Google Chat message',
      confirmSendDesc: 'This message will be posted to the selected Google Chat space and visible to its members.',
      confirmSendAction: 'Confirm & Send',
      targetSpaceLabel: 'Destination space',
      confirmCreateSpaceTitle: 'Confirm creating new space',
      confirmCreateSpaceDesc: 'A new Google Chat space will be created in your Google Workspace organization.',
      confirmCreateSpaceAction: 'Create space',
      confirmDeleteTitle: 'Confirm deleting message',
      confirmDeleteDesc: 'This will permanently delete the message from Google Chat.',
      confirmDeleteAction: 'Delete message',
      confirmReactTitle: 'Confirm adding reaction',
      confirmReactDesc: 'This emoji reaction will be added to the selected message.',
      confirmReactAction: 'Add reaction',
      reactionLabel: 'Reaction',
      cancelAction: 'Cancel',
      messageSentSuccess: 'Message sent to Google Chat.',
      spaceCreatedSuccess: 'Google Chat space created.',
      messageDeletedSuccess: 'Message deleted.',
      reactionAddedSuccess: 'Reaction added.',
      missingTokenError: 'Could not retrieve Google OAuth access token. Please try again.',
      authFailed: 'Google Sign-In failed.',
      errorAppNotConfiguredTitle: 'Google Chat app is not configured yet (HTTP 404)',
      errorAppNotConfiguredDesc: 'Open Google Chat API > Configuration in Google Cloud Console, save Application info (App name, Avatar URL, Description), then retry.',
      errorWorkspaceRequiredTitle: 'Google Workspace account required',
      errorWorkspaceRequiredDesc: 'The Google Chat API requires a Business or Enterprise Google Workspace account. Consumer @gmail.com accounts are not supported.',
      errorUnauthorizedTitle: 'Google Chat session expired',
      errorGenericTitle: 'Google Chat API error',
    },
  },
  ru: {
    brandTagline: 'Футбольная аналитика',
    nav: {
      dashboard: 'Обзор',
      matches: 'Матчи',
      predictions: 'Прогнозы',
      teamsLeagues: 'Команды и лиги',
      watchlist: 'Избранное',
      performance: 'Эффективность',
      googleChat: 'Google Chat',
    },
    common: {
      demoMode: 'ДЕМО-РЕЖИМ',
      demoBannerTitle: 'ДЕМО-РЕЖИМ — Показаны демонстрационные данные',
      demoBannerDesc:
        'API-ключ футбольных данных (API_FOOTBALL_KEY или FOOTBALL_DATA_API_KEY) не задан. Статистическая модель работает в реальном времени на тестовой выборке.',
      liveApiMode: 'LIVE API',
      refresh: 'Обновить',
      retry: 'Повторить',
      searchPlaceholder: 'Поиск команды, лиги или страны...',
      allCountries: 'Все страны',
      allLeagues: 'Все лиги',
      allDates: 'Все даты',
      allStatuses: 'Все статусы',
      live: 'В эфире',
      upcoming: 'Предстоящие',
      finished: 'Завершённые',
      home: 'Хозяева (1)',
      draw: 'Ничья (X)',
      away: 'Гости (2)',
      over25: 'ТБ 2.5',
      under25: 'ТМ 2.5',
      bttsYes: 'ОЗ Да',
      bttsNo: 'ОЗ Нет',
      confidence: 'Уверенность',
      low: 'Низкая',
      medium: 'Средняя',
      high: 'Высокая',
      uncertainty: 'Погрешность',
      expectedGoals: 'Ожидаемые голы (λ)',
      eloRating: 'Рейтинг Эло',
      standingsPos: 'Место в таблице',
      saveToWatchlist: 'Добавить в избранное',
      removeFromWatchlist: 'Удалить из избранного',
      saved: 'В избранном',
      backToMatches: 'К списку матчей',
      noResults: 'Матчи по выбранным фильтрам не найдены.',
      clearFilters: 'Сбросить фильтры',
      errorTitle: 'Ошибка загрузки данных',
      rateLimitTitle: 'Превышен лимит запросов API',
      rateLimitDesc: 'Временно отображаются кэшированные данные. Попробуйте позже.',
      lightTheme: 'Светлая тема',
      darkTheme: 'Тёмная тема',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
      disclaimer:
        'Прогнозы являются статистическими оценками, а не гарантиями. Только для информации. 18+. Действуйте ответственно.',
      viewDetails: 'Анализ матча',
      vs: 'против',
      minConfidence: 'Мин. уверенность',
      marketType: 'Тип рынка',
      allMarkets: 'Все рынки',
      market1x2: 'Исход 1X2',
      marketOver25: 'Тотал 2.5',
      marketBtts: 'Обе забьют',
      probability: 'Вероятность',
      mostLikelyScore: 'Вероятный счёт',
    },
    dashboard: {
      title: 'Футбольная аналитика дня',
      subtitle: 'Матчи по лигам, текущий счёт в реальном времени и калиброванные прогнозы.',
      topPicksTitle: 'Лучшие прогнозы',
      topPicksSubtitle: 'Наиболее вероятные статистические исходы по модели Пуассона + Эло + форма',
      todaysMatchesTitle: 'Матчи по лигам',
      liveNow: 'Live',
      kpiTotalToday: 'Матчей в обзоре',
      kpiLiveCount: 'Сейчас в игре',
      kpiHighConf: 'Высокая уверенность',
      kpiAvgModelEdge: 'Средняя вероятность',
      viewAllPredictions: 'Все прогнозы',
    },
    matches: {
      title: 'Матчи по всему миру',
      subtitle: 'Поиск и фильтрация по странам, лигам, датам и статусу матча.',
      resultsCount: 'матчей показано',
      dateFilterToday: 'Сегодня',
      dateFilterTomorrow: 'Завтра',
      dateFilterYesterday: 'Вчера',
    },
    matchDetail: {
      predictionPanel: 'Панель статистического прогноза',
      whyTitle: 'Почему такой прогноз?',
      whySubtitle: 'Прозрачная разбивка 6 факторов модели и их весов',
      factorWeight: 'Вес',
      scorelinesTitle: 'Наиболее вероятные счета (Пуассон)',
      h2hTitle: 'История личных встреч (H2H)',
      noH2H: 'Нет недавних очных встреч.',
      last10Form: 'Форма за последние 10 матчей',
      homeAwaySplits: 'Показатели дома / в гостях',
      homeRecord: 'Дома',
      awayRecord: 'В гостях',
      goalsAndXg: 'Голы и сравнение xG',
      squadAvailability: 'Состав (Травмы и дисквалификации)',
      noAbsences: 'Значимых потерь в составе нет.',
      injury: 'Травма',
      suspension: 'Дисквалификация',
      keyPlayer: 'Основа',
      rotationPlayer: 'Ротация',
      minorPlayer: 'Резерв',
      venue: 'Стадион',
      xgAvailable: 'Данные xG доступны',
      xgEstimated: 'Оценка по голам',
      liveAdjustedLabel: 'Модель по ходу матча',
      remainingXG: 'Ожидаемые голы (остаток λ)',
      finalScorelinesTitle: 'Прогноз итогового счёта (Live)',
      liveStatsTitle: 'Статистика матча',
      possession: 'Владение мячом',
      shots: 'Всего ударов',
      shotsOnTarget: 'Удары в створ',
      corners: 'Угловые',
      factors: {
        poisson_attack_defense: 'Пуассон Атака / Оборона',
        elo_rating: 'Разница рейтингов Эло',
        recent_form: 'Форма за 10 матчей',
        home_advantage: 'Фактор домашнего поля',
        head_to_head: 'Личные встречи (H2H)',
        squad_availability: 'Потери состава',
        fatigue_congestion: 'Усталость и плотность календаря',
      },
      factorDescriptions: {
        poisson_attack_defense: 'Двумерное распределение Пуассона с поправкой Диксона-Коулза по xG и голам.',
        elo_rating: 'Разница долгосрочного рейтинга силы команд Эло.',
        recent_form: 'Экспоненциально взвешенная форма результатов и разницы мячей за 10 игр.',
        home_advantage: 'Коэффициент домашнего поля лиги и статистика очков дома/в гостях.',
        head_to_head: 'История очных встреч с байесовским сглаживанием для малых выборок.',
        squad_availability: 'Влияние травмированных и дисквалифицированных игроков на атаку и оборону.',
        fatigue_congestion: 'Физическая усталость и нагрузка по числу матчей за последние 7 дней и дням отдыха.',
      },
      favorsHome: 'Преимущество хозяев',
      favorsAway: 'Преимущество гостей',
      balanced: 'Равновесие',
      factorTooltips: {
        hoverHint: 'Наведите на любой фактор, чтобы увидеть точное влияние на процент уверенности',
        confidenceImpact: 'Влияние на уверенность',
        signalImpactLabel: 'Сигнал разделения 1X2',
        directModifierLabel: 'Прямой бонус / штраф',
        alignmentReinforces: 'Усиливает прогноз',
        alignmentOpposes: 'Снижает уверенность',
        alignmentNeutral: 'Нейтральный сигнал',
        finalConfidenceLabel: 'Итоговая уверенность',
        formulaPrefix: 'Формула модели',
        explanations: {
          poisson_attack_defense:
            'Вес 30%: формирует базовые ожидаемые голы (λ). Чем сильнее разрыв по λ, тем выше отрыв фаворита по 1X2 и итоговая уверенность; наличие реальных xG добавляет прямой бонус +5%.',
          elo_rating:
            'Вес 22%: корректирует интенсивность голов (до ±22%) по разнице долгосрочного рейтинга Эло. Большой разрыв Эло увеличивает отрыв лидирующего исхода и повышает уверенность.',
          recent_form:
            'Вес 16%: учитывает последние 10 матчей с экспоненциальным весом (0.84). Явное превосходство в форме усиливает разделение 1X2, а глубина ≥8 матчей у обеих команд даёт прямой бонус +4%.',
          home_advantage:
            'Вес 11%: сочетает домашний коэффициент лиги и очки дома/в гостях. Совпадение с фаворитом усиливает уверенность, а домашний перевес аутсайдера сглаживает отрыв.',
          head_to_head:
            'Вес 7% с байесовским сглаживанием n/(n+5) против переобучения на малых выборках. Наличие ≥3 очных встреч добавляет прямой бонус +2% к уверенности.',
          squad_availability:
            'Вес 7%: корректирует атаку и оборону при травмах и дисквалификациях. Каждый отсутствующий игрок основы напрямую снижает итоговую уверенность на -3.5% из-за неопределённости.',
          fatigue_congestion:
            'Вес 7%: оценивает количество матчей за последние 7 дней и интервал восстановления. Плотный график снижает ожидаемую интенсивность голов и даёт штраф -1.5% за риск ротации.',
        },
        modifierReasons: {
          xg_bonus: 'Доступны данные xG: прямой бонус качества данных +5.0%.',
          xg_estimated: 'xG оценены по голам: прямой бонус xG не начисляется (0.0%).',
          form_depth_bonus: 'У обеих команд ≥8 недавних игр: прямой бонус +4.0%.',
          form_depth_limited: 'Менее 8 игр в выборке формы: бонус глубины 0.0%.',
          h2h_sample_bonus: 'Доступно ≥3 очных встреч: прямой бонус выборки +2.0%.',
          h2h_sample_limited: 'Менее 3 очных встреч H2H: прямой бонус 0.0%.',
          key_absences_penalty: 'Потери игроков основы повышают неопределённость (-3.5% за игрока).',
          no_key_absences: 'Потерь ключевых игроков нет: штраф неопределённости 0.0%.',
          fatigue_congestion_penalty: 'Плотный график (≥2 игр за 7 дней): риск ротации (-1.5% за команду).',
          fatigue_rested: 'Нормальный ритм календаря: штраф усталости 0.0%.',
          signal_only: 'Влияет на уверенность исключительно через разделение вероятностей 1X2.',
        },
      },
    },
    predictions: {
      title: 'Рейтинг прогнозов',
      subtitle: 'Матчи, отсортированные по калиброванной вероятности исхода.',
      rank: '#',
      match: 'Матч',
      recommendedPick: 'Выбор модели',
      calibratedProb: 'Вероятность (±ош.)',
      scoreline: 'Топ счёт',
      confidenceCol: 'Уверенность',
    },
    teamsLeagues: {
      title: 'Команды и лиги',
      subtitle: 'Турнирные таблицы, разница xG, рейтинг Эло и тренды формы.',
      selectLeague: 'Выберите лигу',
      standingsTitle: 'Турнирная таблица',
      teamStatsTitle: 'Статистика команд и тренд формы',
      pos: '#',
      team: 'Команда',
      played: 'И',
      won: 'В',
      drawn: 'Н',
      lost: 'П',
      goals: 'Голы',
      gd: 'РМ',
      pts: 'Очки',
      xgDiff: 'Разн. xG',
      form: 'Посл. 5',
      trend: 'Тренд очков',
      leagueAvgGoals: 'Ср. голов (Дома / В гостях)',
      homeAdvMultiplier: 'Коэфф. домашнего поля',
    },
    watchlist: {
      title: 'Избранное',
      subtitle: 'Сохранённые матчи и прогнозы в локальном хранилище браузера.',
      emptyTitle: 'Список избранного пуст',
      emptyDesc: 'Добавляйте интересные матчи и прогнозы с главной страницы или из карточки матча.',
      browseMatches: 'Перейти к матчам',
      savedPick: 'Сохранённый выбор',
      remove: 'Удалить',
      clearAll: 'Очистить всё',
    },
    performance: {
      title: 'Эффективность и калибровка модели',
      subtitle: 'Историческая проверка прогнозов по лигам и уровням уверенности.',
      kpiHitRate: 'Общая точность',
      kpiHighConfHit: 'Точность (высокая увер.)',
      kpiEvaluated: 'Проверено матчей',
      kpiBrier: 'Средний Brier Score',
      hitRateByLeague: 'Точность по лигам (%)',
      calibrationByBand: 'Калибровка по уверенности',
      monthlyTrendTitle: 'Динамика точности по месяцам',
      recentResolvedTitle: 'Недавние рассчитанные прогнозы',
      actualHitRate: 'Факт. точность',
      expectedProb: 'Ожидание модели',
      predicted: 'Прогноз',
      actual: 'Факт',
      outcome: 'Итог',
      hit: 'Точно',
      miss: 'Мимо',
      brierNote: 'Чем ниже Brier Score, тем лучше калибровка вероятностей (< 0.20 — высокий уровень).',
    },
    matchChat: {
      title: 'Чат-бот аналитика матча',
      subtitle: 'Задайте вопрос по этому матчу — ответы строятся на реальной статистике, текущем счёте и модели Пуассона/Эло.',
      askButton: 'Спросить о матче',
      placeholder: 'Напр.: Каковы шансы на ТБ 2.5 или камбэк при текущем счёте?',
      send: 'Отправить',
      thinking: 'Анализирую данные матча...',
      clearChat: 'Очистить чат',
      welcomePrefix: 'Задайте любой аналитический вопрос по матчу или выберите быстрый запрос ниже:',
      youLabel: 'Вы',
      analystLabel: 'MatchEdge Аналитик',
      footerNote: 'Ответы основаны на статистике этого матча и не являются гарантией исхода.',
      closeSidebar: 'Закрыть панель чата',
      contextActive: 'Статистика матча, форма, H2H и 6 факторов модели загружены',
      suggestedFollowups: 'Похожие вопросы',
      livePrompts: [
        'Каковы шансы на победу или камбэк с учётом текущего счёта и минуты?',
        'Оцени шансы на Тотал 2.5 и «Обе забьют» за оставшееся время',
        'Какой итоговый счёт наиболее вероятен и почему?',
        'Сравни форму, рейтинг Эло и ход игры обеих команд',
      ],
      upcomingPrompts: [
        'Кто фаворит этого матча и какие факторы дают преимущество?',
        'Разбери рынки Тотал 2.5 и «Обе забьют» (ОЗ)',
        'Как влияют показатели дома/в гостях, H2H и потери состава?',
        'Какие главные риски и вероятность сенсации в этом матче?',
      ],
      finishedPrompts: [
        'Насколько итоговый счёт совпал с ожиданиями модели?',
        'Как статистика матча объясняет итоговый результат?',
        'Краткий разбор формы и рейтинга Эло обеих команд',
        'На что обратить внимание в следующих матчах этих команд?',
      ],
      couponConceptLabel: 'Концепт купона',
      conceptAuto: 'Авто',
      conceptCustom: 'Свой',
      customOddsPlaceholder: 'Напр: 15',
      attachScreenshot: 'Прикрепить скриншот (Misli и др.)',
      removeScreenshot: 'Удалить скриншот',
      screenshotHint: 'Загрузите или вставьте (Ctrl+V) скриншот с коэффициентами (Misli и др.) и выберите целевой коэффициент.',
      screenshotAttachedNote: 'скриншот готов',
      dropScreenshotHere: 'Перетащите скриншот сюда',
      unsupportedImageError: 'Поддерживаются только скриншоты PNG, JPG или WebP.',
      imageTooLargeError: 'Файл слишком большой (макс. 12 МБ).',
      maxImagesNote: 'Можно прикрепить до 2 скриншотов на сообщение.',
    },
    toast: {
      regionLabel: 'Уведомления',
      dismiss: 'Закрыть уведомление',
      chatErrorTitle: 'Ошибка чат-сервиса',
      chatRateLimitTitle: 'Превышен лимит запросов чата',
    },
    googleChat: {
      title: 'Интеграция с Google Chat',
      subtitle: 'Просматривайте рабочие пространства, читайте сообщения и отправляйте аналитику MatchEdge с подтверждением.',
      shareMatchButton: 'В Google Chat',
      connectTitle: 'Подключите Google Chat',
      connectDesc: 'Войдите через корпоративный аккаунт Google Workspace, чтобы просматривать чаты и делиться статистическими отчётами по матчам.',
      sessionRefreshDesc: 'Для безопасности OAuth-токен хранится только в оперативной памяти. Подтвердите вход повторно для подключения.',
      signInWithGoogle: 'Войти через Google',
      reconnectWithGoogle: 'Обновить сессию Google Chat',
      signOut: 'Выйти',
      switchAccount: 'Сменить аккаунт',
      featureBrowseSpaces: 'Просматривайте, ищите и создавайте пространства (Spaces) Google Chat.',
      featureShareReports: 'Вставляйте готовый отчёт Пуассона/Эло для любого матча в один клик.',
      featureConfirmAlways: 'Любая отправка, создание пространства, реакция или удаление требуют явного подтверждения.',
      prerequisitesTitle: 'Требования Google Chat API',
      prereqWorkspaceTitle: 'Аккаунт Google Workspace',
      prereqWorkspaceDesc: 'Для работы Google Chat API требуется аккаунт Google Workspace (Business/Enterprise). Личные аккаунты @gmail.com не поддерживаются.',
      prereqChatAppTitle: 'Разовая настройка Chat App в Cloud Console',
      prereqChatAppDesc: 'Заполните Application info (название, URL аватара, описание) на странице Google Chat API > Configuration в Google Cloud Console.',
      openChatConfigConsole: 'Открыть настройки в Cloud Console',
      spacesTitle: 'Пространства',
      spaceFallback: 'Чат',
      newSpace: 'Новый чат',
      spaceNameLabel: 'Название пространства',
      spaceNamePlaceholder: 'Напр.: MatchEdge Аналитика',
      createButton: 'Создать',
      searchSpacesPlaceholder: 'Поиск пространств...',
      loadingSpaces: 'Загрузка пространств...',
      noSpacesFound: 'Пространства Google Chat не найдены.',
      selectSpacePrompt: 'Выберите пространство слева для просмотра сообщений.',
      loadingMessages: 'Загрузка сообщений...',
      noMessagesYet: 'В этом пространстве пока нет сообщений.',
      unknownSender: 'Участник',
      selectMatchToShare: 'Выберите матч для отчёта',
      insertMatchReport: 'Вставить отчёт по матчу',
      composerPlaceholder: 'Введите сообщение для Google Chat или вставьте отчёт по матчу выше...',
      sendMessageButton: 'Отправить в Google Chat',
      confirmationGuaranteeNote: 'Перед отправкой откроется окно подтверждения.',
      reactButton: 'Добавить реакцию',
      deleteMessageButton: 'Удалить сообщение',
      readyToShareMatch: 'Отчёт по матчу готов к отправке',
      readyToShareHintSignedIn: 'Выберите пространство слева и нажмите Отправить для подтверждения.',
      readyToShareHintSignedOut: 'Войдите через Google ниже — отчёт уже подготовлен.',
      dismissDraft: 'Убрать черновик',
      draftPreviewTitle: 'Подготовленный отчёт',
      confirmSendTitle: 'Подтвердите отправку сообщения в Google Chat',
      confirmSendDesc: 'Сообщение будет опубликовано в выбранном пространстве Google Chat.',
      confirmSendAction: 'Подтвердить и отправить',
      targetSpaceLabel: 'Пространство',
      confirmCreateSpaceTitle: 'Создать новое пространство Google Chat?',
      confirmCreateSpaceDesc: 'В вашей организации Google Workspace будет создано новое пространство.',
      confirmCreateSpaceAction: 'Создать',
      confirmDeleteTitle: 'Подтвердите удаление сообщения',
      confirmDeleteDesc: 'Сообщение будет безвозвратно удалено из Google Chat.',
      confirmDeleteAction: 'Удалить',
      confirmReactTitle: 'Добавить реакцию к сообщению?',
      confirmReactDesc: 'Выбранная эмодзи-реакция будет добавлена к сообщению.',
      confirmReactAction: 'Добавить',
      reactionLabel: 'Реакция',
      cancelAction: 'Отмена',
      messageSentSuccess: 'Сообщение отправлено в Google Chat.',
      spaceCreatedSuccess: 'Пространство Google Chat создано.',
      messageDeletedSuccess: 'Сообщение удалено.',
      reactionAddedSuccess: 'Реакция добавлена.',
      missingTokenError: 'Не удалось получить OAuth-токен Google. Повторите вход.',
      authFailed: 'Не удалось выполнить вход через Google.',
      errorAppNotConfiguredTitle: 'Приложение Google Chat не настроено (HTTP 404)',
      errorAppNotConfiguredDesc: 'Откройте Google Chat API > Configuration в Google Cloud Console, сохраните название, аватар и описание приложения, затем повторите.',
      errorWorkspaceRequiredTitle: 'Требуется аккаунт Google Workspace',
      errorWorkspaceRequiredDesc: 'Google Chat API работает только с корпоративными аккаунтами Google Workspace (не с личными @gmail.com).',
      errorUnauthorizedTitle: 'Сессия Google Chat истекла',
      errorGenericTitle: 'Ошибка Google Chat API',
    },
  },
};

export function formatSelectionLabel(
  selection: string,
  t: TranslationDictionary
): string {
  switch (selection) {
    case 'home':
      return t.common.home;
    case 'draw':
      return t.common.draw;
    case 'away':
      return t.common.away;
    case 'over25':
      return t.common.over25;
    case 'under25':
      return t.common.under25;
    case 'btts_yes':
      return t.common.bttsYes;
    case 'btts_no':
      return t.common.bttsNo;
    default:
      return selection;
  }
}

export function formatConfidenceLabel(
  band: 'low' | 'medium' | 'high',
  t: TranslationDictionary
): string {
  if (band === 'high') return t.common.high;
  if (band === 'medium') return t.common.medium;
  return t.common.low;
}
