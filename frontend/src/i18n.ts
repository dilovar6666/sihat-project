export type Language = 'ru' | 'tj' | 'en';

export interface Translations {
  brand: string;
  slogan: string;
  tagline: string;
  themeLight: string;
  themeDark: string;
  nav: {
    home: string;
    catalog: string;
    exercises: string;
    history: string;
    faq: string;
    knowledge: string;
    support: string;
    admin: string;
    assistant: string;
    signIn: string;
    signUp: string;
    signOut: string;
    closeMenu?: string;
    menu?: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    searchPlaceholder: string;
    quickJump: string;
    browseCatalog: string;
    tryExercises: string;
    aiGuide: string;
    chipVision: string;
    chipHearing: string;
    chipMemory: string;
    chipAttention: string;
    chipStress: string;
    chipReaction?: string;
    chipCoordination?: string;
    chipProcessing?: string;
    calibrationTag?: string;
    calibrationText?: string;
  };
  bento: {
    protocolTitle: string;
    protocolVersion: string;
    statusActive: string;
    objectiveBadge: string;
    objectiveDesc: string;
    metric1Val: string;
    metric1Label: string;
    metric2Val: string;
    metric2Label: string;
    metric3Val: string;
    metric3Label: string;
  };
  disciplines: {
    badge: string;
    title: string;
    subtitle: string;
    startBtn: string;
    featuredTag?: string;
  };
  journey: {
    badge: string;
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step1Tag: string;
    step2Title: string;
    step2Desc: string;
    step2Tag: string;
    step3Title: string;
    step3Desc: string;
    step3Tag: string;
  };
  aiShowcase: {
    badge: string;
    title: string;
    subtitle: string;
    check1: string;
    check2: string;
    prohibitedNote: string;
    architectureTitle: string;
    architectureDesc: string;
    chatTitle: string;
    chatStatus: string;
    chatBadge: string;
    userQuery: string;
    aiReplyText: string;
    aiItem1: string;
    aiItem2: string;
    aiSafetyNotice: string;
    launchBtn: string;
    voiceActive?: string;
  };
  disclaimer: {
    badge: string;
    headline: string;
    text: string;
  };
  exercises: {
    title: string;
    subtitle: string;
    signInPrompt: string;
    guestNotice: string;
    leaveBtn: string;
    completeBtn: string;
    skipBtn: string;
    saveBtn: string;
    doNotSaveBtn: string;
    completedTitle: string;
  };
  admin: {
    title: string;
    subtitle: string;
    tabDashboard: string;
    tabUsers: string;
    tabTickets: string;
    tabTests: string;
    tabAuthoring: string;
    totalUsers: string;
    activeUsers: string;
    completedAttempts: string;
    savedResults: string;
    userEmailCol: string;
    userRoleCol: string;
    userStatusCol: string;
    userActionCol: string;
    deactivateBtn: string;
    activateBtn: string;
  };
  catalog: {
    title: string;
    subtitle: string;
    searchLabel: string;
    allCategories: string;
    ageFilterLabel: string;
    ageAll: string;
    age18: string;
    age1617: string;
    startBtn: string;
    passportBtn: string;
    questionsCount: string;
    evidenceLevel: string;
    guestAllowed: string;
    authRequired: string;
    noTests: string;
  };
  passportModal: {
    title: string;
    evidence: string;
    scientificSource: string;
    deviceRestrictions: string;
    methodLimitations: string;
    medicalWarnings: string;
    license: string;
    closeBtn: string;
    startCheckBtn?: string;
  };
  history: {
    title: string;
    subtitle: string;
    authRequiredMsg: string;
    clearAllBtn: string;
    emptyMsg: string;
    testCol: string;
    dateCol: string;
    scoreCol: string;
    actionsCol: string;
    viewBtn: string;
    compareBtn: string;
    pdfBtn: string;
    deleteBtn: string;
    includeAnswersPdf: string;
    includeWarningsPdf: string;
    confirmDeleteSingle: string;
    confirmDeleteAll: string;
    methodologyCol?: string;
    resultSummaryTitle?: string;
    exportPdfTitle?: string;
    exportPdfDesc?: string;
    downloadPdfBtn?: string;
  };
  comparison: {
    title: string;
    subtitle: string;
    compatibleNote: string;
    incompatibleNote: string;
    metricLabel: string;
    attemptA: string;
    attemptB: string;
    delta: string;
    ruleLabel?: string;
    attemptLabel?: string;
  };
  runner: {
    precheckTitle: string;
    precheckDesc: string;
    deviceNotice: string;
    acceptConditions: string;
    startAttemptBtn: string;
    cancelBtn: string;
    questionStep: string;
    nextBtn: string;
    finishBtn: string;
    completedTitle: string;
    completedSubtitle: string;
    saveBtn: string;
    doNotSaveBtn: string;
    consentExplain: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    forgotTitle: string;
    emailLabel: string;
    passwordLabel: string;
    ageGroupLabel: string;
    age18Plus: string;
    age1617: string;
    submitLogin: string;
    submitRegister: string;
    submitForgot: string;
    switchToRegister: string;
    switchToLogin: string;
    switchToForgot: string;
    googleSignIn: string;
    closeBtn?: string;
    fullNameLabel?: string;
    forgotExplain?: string;
    backToLogin?: string;
  };
  footer: {
    rights: string;
    strictNonDiagnostic: string;
    designedWithCare: string;
    protocols: string;
    science: string;
    languages: string;
  };
}

export const translations: Record<Language, Translations> = {
  ru: {
    brand: 'SIHAT',
    slogan: 'UNDERSTAND YOUR HEALTH',
    tagline: 'Цифровая платформа объективных скринингов и здорового образа жизни',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    nav: {
      home: 'Главная',
      catalog: 'Каталог тестов',
      exercises: 'Упражнения',
      history: 'История результатов',
      faq: 'Частые вопросы',
      knowledge: 'База знаний',
      support: 'Поддержка',
      admin: 'Админ-панель',
      assistant: 'ИИ-помощник',
      signIn: 'Войти',
      signUp: 'Регистрация',
      signOut: 'Выйти',
      closeMenu: 'Закрыть меню',
      menu: 'Меню',
    },
    hero: {
      badge: 'НАУЧНО ОБОСНОВАННЫЕ СКРИНИНГИ',
      title: 'Понимайте состояние своего здоровья',
      titleHighlight: 'с объективной точностью',
      subtitle: 'Валидированные опросники, объективные интерактивные упражнения и защищенная аналитика без постановки диагнозов и вымышленных процентов здоровья.',
      searchPlaceholder: 'Поиск по тестам, симптомам или дисциплинам (например, Стенд Снеллена, Реакция)...',
      quickJump: 'Быстрый переход:',
      browseCatalog: 'Исследовать тесты',
      tryExercises: 'Интерактивные упражнения',
      aiGuide: 'Спросить ИИ-гида',
      chipVision: 'Зрение',
      chipHearing: 'Слух',
      chipMemory: 'Память',
      chipAttention: 'Внимание',
      chipStress: 'Стресс',
      chipReaction: 'Реакция',
      chipCoordination: 'Координация',
      chipProcessing: 'Обработка данных',
      calibrationTag: 'Локальная сессия',
      calibrationText: 'Калибровка среды на устройстве пользователя. Все ответы хранятся в защищенной памяти браузера.',
    },
    bento: {
      protocolTitle: 'SIHAT Clarity Architecture',
      protocolVersion: 'Scientific Framework 3.0',
      statusActive: 'Active Verification',
      objectiveBadge: 'Transparent Metrics',
      objectiveDesc: 'Все вычисления производятся открыто на базе валидированных шкал и стандартизированных нормативов.',
      metric1Val: 'Приватность',
      metric1Label: 'Локальная обработка',
      metric2Val: 'Валидировано',
      metric2Label: 'Открытые методы',
      metric3Val: '0%',
      metric3Label: 'Без фейковых процентов',
    },
    disciplines: {
      badge: 'Базовый каталог скринингов',
      title: '10 Объективных Дисциплин',
      subtitle: 'Комплексные научно обоснованные скрининги сенсорных, когнитивных и физиологических маркеров.',
      startBtn: 'Пройти скрининг',
      featuredTag: 'Ведущий сенсорный скрининг',
    },
    journey: {
      badge: 'Прозрачность каждого шага',
      title: 'Как работает SIHAT',
      subtitle: '3 ступени к кристальной ясности вашего текущего физиологического состояния.',
      step1Title: 'Выбери проверку',
      step1Desc: 'Открытые паспорта методологий. Прозрачные критерии, никакой черной магии. Перед стартом вы точно знаете, что и как измеряется.',
      step1Tag: 'Открытый протокол исследования',
      step2Title: 'Пройди тест',
      step2Desc: 'Локальная конфиденциальная сессия. Ваши сенсорные данные и микрореакции обрабатываются строго на устройстве в браузере.',
      step2Tag: 'On-device вычисления',
      step3Title: 'Получи объяснение',
      step3Desc: 'Объективные числовые маркеры и ясные объяснения. Право в один клик сохранить результат или стереть навсегда.',
      step3Tag: 'Полный контроль над своими данными',
    },
    aiShowcase: {
      badge: 'Встроенный ИИ-навигатор',
      title: 'ИИ-навигатор SIHAT: строгие границы и нулевое диагностирование',
      subtitle: 'Наш гид помогает ориентироваться в мире физиологических тестов, разъясняет научную терминологию и подбирает релевантную дисциплину.',
      check1: 'Помогает сопоставить симптомы усталости с объективными тестами.',
      check2: 'Разъясняет термины: «оптотипы», «латентность реакции», «спан Корси».',
      prohibitedNote: 'Категорически запрещено ставить клинические диагнозы и выписывать лечение.',
      architectureTitle: 'Принцип архитектуры',
      architectureDesc: 'Строгий системный промпт исключает медицинские спекуляции и перенаправляет к врачам при острых жалобах.',
      chatTitle: 'SIHAT Gemini Navigator',
      chatStatus: 'Безопасный режим активен',
      chatBadge: 'Bounded Guide v1.2',
      userQuery: '«Чувствую зрительное утомление к концу рабочего дня и рассеянность. С чего начать?»',
      aiReplyText: 'Для зрительного утомления и снижения концентрации рекомендуется пройти два неинвазивных скрининга:',
      aiItem1: '1) Тест контрастной чувствительности (Дисциплина «Зрение») — 3 мин',
      aiItem2: '2) Таблицы Шульте (Дисциплина «Внимание») — 2 мин',
      aiSafetyNotice: 'Напоминаем: это скрининг утомляемости, не заменяющий осмотр врача-офтальмолога.',
      launchBtn: 'Открыть чат с ИИ-гидом',
      voiceActive: 'Речевой ввод активен',
    },
    disclaimer: {
      badge: 'ЭТИЧЕСКИЙ СТАНДАРТ И БЕЗОПАСНОСТЬ',
      headline: 'SIHAT не является медицинским изделием и не заменяет врача.',
      text: 'Платформа SIHAT не является медицинским изделием, не ставит диагнозов и не назначает лечения. Все материалы носят исключительно информационно-просветительский характер. При наличии тревожных симптомов всегда обращайтесь к квалифицированному врачу или в службу неотложной помощи.',
    },
    exercises: {
      title: 'Интерактивные упражнения и тренажеры',
      subtitle: '15 образовательных модулей для оценки сенсорных и когнитивных реакций на вашем устройстве.',
      signInPrompt: 'Войдите в аккаунт для сохранения сессий',
      guestNotice: 'Вы можете просматривать каталог упражнений. Для запуска интерактивной сессии и фиксации данных войдите в систему.',
      leaveBtn: 'Покинуть упражнение',
      completeBtn: 'Завершить упражнение',
      skipBtn: 'Пропустить',
      saveBtn: 'Сохранить',
      doNotSaveBtn: 'Не сохранять',
      completedTitle: 'Упражнение завершено',
    },
    admin: {
      title: 'Панель управления',
      subtitle: 'Системная телеметрия, модерация методологических паспортов и поддержка пользователей.',
      tabDashboard: 'Телеметрия',
      tabUsers: 'Пользователи',
      tabTickets: 'Тикеты поддержки',
      tabTests: 'Каталог тестов',
      tabAuthoring: 'ИИ-генерация',
      totalUsers: 'Всего пользователей',
      activeUsers: 'Активные пользователи',
      completedAttempts: 'Завершенные чеки',
      savedResults: 'Сохраненные результаты',
      userEmailCol: 'Email',
      userRoleCol: 'Роль',
      userStatusCol: 'Статус',
      userActionCol: 'Действие',
      deactivateBtn: 'Отключить',
      activateBtn: 'Активировать',
    },
    catalog: {
      title: 'Каталог скринингов и упражнений',
      subtitle: '10 направлений здоровья с прозрачными методологическими паспортами',
      searchLabel: 'Поиск по названию или описанию...',
      allCategories: 'Все направления',
      ageFilterLabel: 'Возрастная категория:',
      ageAll: 'Все возраста',
      age18: '18+ лет',
      age1617: '16–17 лет',
      startBtn: 'Начать прохождение',
      passportBtn: 'Паспорт методики',
      questionsCount: 'вопросов',
      evidenceLevel: 'Доказательность',
      guestAllowed: 'Гостевой доступ',
      authRequired: 'Требуется аккаунт',
      noTests: 'Тесты по заданным критериям не найдены.',
    },
    passportModal: {
      title: 'Паспорт методики',
      evidence: 'Уровень научной доказательности',
      scientificSource: 'Научный первоисточник и публикации',
      deviceRestrictions: 'Требования к экрану и освещению',
      methodLimitations: 'Методологические ограничения',
      medicalWarnings: 'Предостережения и ограничения',
      license: 'Лицензионные условия',
      closeBtn: 'Закрыть',
      startCheckBtn: 'Запустить скрининг',
    },
    history: {
      title: 'Приватная история результатов',
      subtitle: 'Здесь отображаются только те записи, которые вы явно решили сохранить. Данные зашифрованы и доступны только вам.',
      authRequiredMsg: 'Для доступа к истории результатов необходимо войти в аккаунт.',
      clearAllBtn: 'Очистить всю историю',
      emptyMsg: 'У вас пока нет сохраненных результатов.',
      testCol: 'Тест',
      dateCol: 'Дата и время',
      scoreCol: 'Результат',
      actionsCol: 'Действия',
      viewBtn: 'Подробнее',
      compareBtn: 'Сравнить',
      pdfBtn: 'Экспорт в PDF',
      deleteBtn: 'Удалить',
      includeAnswersPdf: 'Включить подробные ответы в отчет',
      includeWarningsPdf: 'Включить клинические предостережения',
      confirmDeleteSingle: 'Вы уверены, что хотите удалить эту запись? Действие необратимо.',
      confirmDeleteAll: 'Вы уверены, что хотите удалить ВСЮ историю скринингов? Все результаты будут удалены навсегда.',
      methodologyCol: 'Методология',
      resultSummaryTitle: 'Сводные данные проверки',
      exportPdfTitle: 'Официальный PDF-отчет',
      exportPdfDesc: 'Сформируйте медицински корректный документ для обсуждения с лечащим врачом.',
      downloadPdfBtn: 'Сформировать и скачать PDF',
    },
    comparison: {
      title: 'Сравнение совместимых результатов',
      subtitle: 'Строгое сопоставление попыток с одинаковой версией методологии и условиями проведения.',
      compatibleNote: 'Попытки полностью совместимы: одинаковая версия методологии и требования к среде.',
      incompatibleNote: 'Попытки нельзя корректно сравнить: различаются версии протоколов или условия замера.',
      metricLabel: 'Показатель',
      attemptA: 'Основная запись',
      attemptB: 'Сравниваемая запись',
      delta: 'Дельта изменений',
      ruleLabel: 'Правило совместимости:',
      attemptLabel: 'Попытка',
    },
    runner: {
      precheckTitle: 'Подготовка к тестированию',
      precheckDesc: 'Для обеспечения точности проверки соблюдайте условия:',
      deviceNotice: 'Обеспечьте стабильное комнатное освещение, комфортную яркость экрана и отсутствие отвлекающих факторов.',
      acceptConditions: 'Я подтверждаю соблюдение условий среды и соответствие возрастной категории',
      startAttemptBtn: 'Начать скрининг',
      cancelBtn: 'Отмена',
      questionStep: 'Вопрос',
      nextBtn: 'Следующий вопрос',
      finishBtn: 'Завершить опрос',
      completedTitle: 'Скрининг завершен',
      completedSubtitle: 'Результат вычислен в рамках временной локальной сессии.',
      saveBtn: 'Сохранить в приватную историю',
      doNotSaveBtn: 'Не сохранять (Удалить навсегда)',
      consentExplain: 'При нажатии «Сохранить» результат будет записан в ваш личный профиль. При нажатии «Не сохранять» данные сотрутся из базы данных.',
    },
    auth: {
      loginTitle: 'Вход в аккаунт SIHAT',
      registerTitle: 'Регистрация нового аккаунта',
      forgotTitle: 'Восстановление доступа',
      emailLabel: 'Адрес эл. почты',
      passwordLabel: 'Пароль',
      ageGroupLabel: 'Возрастная категория',
      age18Plus: '18 лет и старше',
      age1617: '16–17 лет',
      submitLogin: 'Войти',
      submitRegister: 'Зарегистрироваться',
      submitForgot: 'Отправить ссылку для сброса',
      switchToRegister: 'Нет аккаунта? Зарегистрироваться',
      switchToLogin: 'Уже есть аккаунт? Войти',
      switchToForgot: 'Забыли пароль?',
      googleSignIn: 'Войти через Google',
      closeBtn: 'Закрыть',
      fullNameLabel: 'Ваше имя',
      forgotExplain: 'Введите адрес электронной почты, указанный при регистрации, и мы вышлем инструкцию по сбросу пароля.',
      backToLogin: 'Вернуться ко входу',
    },
    footer: {
      rights: 'Все права защищены.',
      strictNonDiagnostic: 'SIHAT — информационно-просветительская платформа скринингов. Не заменяет визит к врачу.',
      designedWithCare: 'Создано по стандарту Living Clarity с фокусом на приватность и доказательность.',
      protocols: 'Протоколы',
      science: 'Наука и система',
      languages: 'Поддерживаемые языки',
    },
  },

  tj: {
    brand: 'SIHAT',
    slogan: 'UNDERSTAND YOUR HEALTH',
    tagline: 'Платформаи рақамии муоинаҳои объективӣ ва тарзи ҳаёти солим',
    themeLight: 'Рӯшан',
    themeDark: 'Торик',
    nav: {
      home: 'Асосӣ',
      catalog: 'Феҳристи тестҳо',
      exercises: 'Машқҳо',
      history: 'Таърихи натиҷаҳо',
      faq: 'Саволҳои маъмул',
      knowledge: 'Пойгоҳи дониш',
      support: 'Дастгирӣ',
      admin: 'Панели мудир',
      assistant: 'Ёвари AI',
      signIn: 'Воридшавӣ',
      signUp: 'Бақайдгирӣ',
      signOut: 'Баромад',
      closeMenu: 'Пӯшидани меню',
      menu: 'Меню',
    },
    hero: {
      badge: 'СКРИНИНГҲОИ ИЛМАН АСОСНОК',
      title: 'Саломатии худро беҳтар фаҳмед',
      titleHighlight: 'бо ченакҳои дақиқ',
      subtitle: 'Пурсишномаҳои тасдиқшуда, машқҳои интерактивии воқеӣ ва махфияти комил. Бе ташхиси бардурӯғ ва фоизҳои сохтаи саломатӣ.',
      searchPlaceholder: 'Ҷустуҷӯи тестҳо, нишонаҳо ё фанҳо...',
      quickJump: 'Гузариши фаврӣ:',
      browseCatalog: 'Кашфи тестҳо',
      tryExercises: 'Машқҳои интерактивӣ',
      aiGuide: 'Аз ёвари AI пурсед',
      chipVision: 'Биноӣ',
      chipHearing: 'Шунавоӣ',
      chipMemory: 'Хотира',
      chipAttention: 'Диққат',
      chipStress: 'Стресс',
      chipReaction: 'Вокуниш',
      chipCoordination: 'Ҳамоҳангсозӣ',
      chipProcessing: 'Коркард',
      calibrationTag: 'Сессияи маҳаллӣ',
      calibrationText: 'Калибрсозии муҳит дар дастгоҳи корбар. Ҳамаи ҷавобҳо дар хотираи бехатари браузер маҳфузанд.',
    },
    bento: {
      protocolTitle: 'SIHAT Clarity Architecture',
      protocolVersion: 'Scientific Framework 3.0',
      statusActive: 'Active Verification',
      objectiveBadge: 'Transparent Metrics',
      objectiveDesc: 'Ҳамаи ҳисобҳо дар асоси ҷадвалҳои санҷидашуда ва меъёрҳои стандартии кушода анҷом меёбанд.',
      metric1Val: 'Махфият',
      metric1Label: 'Коркарди маҳаллӣ',
      metric2Val: 'Санҷидашуда',
      metric2Label: 'Усулҳои кушода',
      metric3Val: '0%',
      metric3Label: 'Бе фоизҳои сохта',
    },
    disciplines: {
      badge: 'Феҳристи асосии скринингҳо',
      title: '10 Самти Объективӣ',
      subtitle: 'Скринингҳои мукаммали илман асоснок барои нишондиҳандаҳои сенсорӣ, маърифатӣ ва физиологӣ.',
      startBtn: 'Оғози санҷиш',
      featuredTag: 'Скрининги пешбари сенсорӣ',
    },
    journey: {
      badge: 'Шаффофияти ҳар як марҳила',
      title: 'SIHAT чӣ тавр кор мекунад',
      subtitle: '3 қадам то фаҳмиши дақиқи вазъи физиологии кунунии шумо.',
      step1Title: 'Санҷишро интихоб кунед',
      step1Desc: 'Шиносномаҳои кушодаи методӣ. Меъёрҳои шаффоф. Пеш аз оғоз шумо дақиқ медонед, ки чӣ ва чӣ тавр чен карда мешавад.',
      step1Tag: 'Протоколи кушодаи таҳқиқот',
      step2Title: 'Тестро гузаред',
      step2Desc: 'Сессияи маҳаллӣ ва махфӣ. Маълумоти сенсорӣ ва вокунишҳои шумо қатъиян дар дохили дастгоҳ коркард мешаванд.',
      step2Tag: 'Ҳисоббарории On-device',
      step3Title: 'Шарҳ гиред',
      step3Desc: 'Нишондиҳандаҳои ададии мушаххас ва шарҳҳои возеҳ. Ҳуқуқи нигоҳ доштан ё фавран нест кардани натиҷаҳо бо як клик.',
      step3Tag: 'Назорати комил бар маълумоти худ',
    },
    aiShowcase: {
      badge: 'Ёвари дарунсохти AI',
      title: 'Ёвари AI-и SIHAT: маҳдудиятҳои қатъӣ ва бе ташхисгузорӣ',
      subtitle: 'Ёвари мо ба шумо дар ҷаҳони санҷишҳо роҳнамоӣ мекунад, истилоҳҳои илмиро мефаҳмонад ва самти мувофиқро тавсия медиҳад.',
      check1: 'Муқоисаи нишонаҳои хастагӣ бо санҷишҳои объективӣ.',
      check2: 'Шарҳи истилоҳҳо: «оптотипҳо», «латентнокии вокуниш», «спани Корси».',
      prohibitedNote: 'Гузоштани ташхиси тиббӣ ва таъини табобат қатъиян манъ аст.',
      architectureTitle: 'Принсипи сохтор',
      architectureDesc: 'Дастурҳои қатъии системавӣ гумонҳои тиббиро манъ мекунанд ва дар ҳолати нишонаҳои шадид ба духтур муроҷиат намуданро тавсия медиҳанд.',
      chatTitle: 'SIHAT Gemini Navigator',
      chatStatus: 'Ҳолати бехатар фаъол аст',
      chatBadge: 'Bounded Guide v1.2',
      userQuery: '«Дар охири рӯзи корӣ хастагии чашм ва парешонии диққатро ҳис мекунам. Аз чӣ оғоз кунам?»',
      aiReplyText: 'Барои хастагии чашм ва коҳиши тамаркуз гузаштани ду санҷиши ғайриинвазивиро тавсия медиҳем:',
      aiItem1: '1) Санҷиши ҳассосияти контрастӣ (Самти «Биноӣ») — 3 дақ',
      aiItem2: '2) Ҷадвалҳои Шулте (Самти «Диққат») — 2 дақ',
      aiSafetyNotice: 'Ёдовар мешавем: ин скрининги хастагӣ буда, муоинаи духтури чашмро иваз намекунад.',
      launchBtn: 'Кушодани сӯҳбат бо ёвари AI',
      voiceActive: 'Вуруди овозӣ фаъол аст',
    },
    disclaimer: {
      badge: 'МЕЪЁРИ АХЛОҚӢ ВА БЕХАТАРӢ',
      headline: 'SIHAT дастгоҳи тиббӣ нест ва духтурро иваз намекунад.',
      text: 'Платформаи SIHAT ташхис намегузорад ва табобат таъин намекунад. Ҳамаи маводҳо танҳо хусусияти иттилоотию омӯзишӣ доранд. Дар ҳолати пайдоиши нишонаҳои шадид фавран ба духтур муроҷиат намоед.',
    },
    exercises: {
      title: 'Машқҳои интерактивӣ ва тренажёрҳо',
      subtitle: '15 модули таълимӣ барои арзёбии вокунишҳои сенсорӣ ва маърифатӣ дар дастгоҳи шумо.',
      signInPrompt: 'Барои нигоҳ доштани сессияҳо ворид шавед',
      guestNotice: 'Шумо метавонед машқҳоро бубинед. Барои оғози машқҳои интерактивӣ ба система ворид шавед.',
      leaveBtn: 'Тарки машқ',
      completeBtn: 'Анҷоми машқ',
      skipBtn: 'Гузаронидан',
      saveBtn: 'Нигоҳ доштан',
      doNotSaveBtn: 'Нест кардан',
      completedTitle: 'Машқ анҷом ёфт',
    },
    admin: {
      title: 'Панели мудир',
      subtitle: 'Телеметрияи системавӣ, санҷиши шиносномаҳои методӣ ва дастгирии корбарон.',
      tabDashboard: 'Телеметрия',
      tabUsers: 'Корбарон',
      tabTickets: 'Дархостҳои дастгирӣ',
      tabTests: 'Феҳристи тестҳо',
      tabAuthoring: 'Эҷоди AI',
      totalUsers: 'Ҳамагӣ корбарон',
      activeUsers: 'Корбарони фаъол',
      completedAttempts: 'Санҷишҳои анҷомёфта',
      savedResults: 'Натиҷаҳои маҳфуз',
      userEmailCol: 'Email',
      userRoleCol: 'Нақш',
      userStatusCol: 'Ҳолат',
      userActionCol: 'Амал',
      deactivateBtn: 'Ғайрифаъол',
      activateBtn: 'Фаъол кардан',
    },
    catalog: {
      title: 'Феҳристи скринингҳо ва машқҳо',
      subtitle: '10 самти саломатӣ бо шиносномаҳои шаффофи методӣ',
      searchLabel: 'Ҷустуҷӯ аз рӯи ном ё тавсиф...',
      allCategories: 'Ҳамаи самтҳо',
      ageFilterLabel: 'Гурӯҳи синну сол:',
      ageAll: 'Ҳамаи синну сол',
      age18: '18+ сола',
      age1617: '16–17 сола',
      startBtn: 'Оғози санҷиш',
      passportBtn: 'Шиносномаи методӣ',
      questionsCount: 'саволҳо',
      evidenceLevel: 'Сатҳи асоснокӣ',
      guestAllowed: 'Дастрасии меҳмон',
      authRequired: 'Ҳисоб лозим аст',
      noTests: 'Аз рӯи меъёрҳои интихобшуда санҷиш ёфт нашуд.',
    },
    passportModal: {
      title: 'Шиносномаи методӣ',
      evidence: 'Сатҳи асоснокии илмӣ',
      scientificSource: 'Сарчашмаи илмӣ ва мақолаҳо',
      deviceRestrictions: 'Талабот ба экран ва рӯшноӣ',
      methodLimitations: 'Маҳдудиятҳои методӣ',
      medicalWarnings: 'Огоҳиҳо ва маҳдудиятҳо',
      license: 'Шартҳои иҷозатнома',
      closeBtn: 'Пӯшидан',
      startCheckBtn: 'Оғози скрининг',
    },
    history: {
      title: 'Таърихи шахсии натиҷаҳо',
      subtitle: 'Дар ин ҷо танҳо он сабтҳо намоиш дода мешаванд, ки шумо худатон қарори нигоҳ доштан гирифтед. Маълумот рамзгузорӣ шуда танҳо ба шумо дастрас аст.',
      authRequiredMsg: 'Барои дидани таърихи натиҷаҳо ба ҳисоби худ ворид шавед.',
      clearAllBtn: 'Тоза кардани тамоми таърих',
      emptyMsg: 'Шумо то ҳол ягон натиҷаи захирашуда надоред.',
      testCol: 'Санҷиш',
      dateCol: 'Сана ва вақт',
      scoreCol: 'Натиҷа',
      actionsCol: 'Амалҳо',
      viewBtn: 'Муфассал',
      compareBtn: 'Муқоиса',
      pdfBtn: 'Содирот ба PDF',
      deleteBtn: 'Нест кардан',
      includeAnswersPdf: 'Илова кардани ҷавобҳои муфассал ба ҳисобот',
      includeWarningsPdf: 'Илова кардани огоҳиҳои клиникӣ',
      confirmDeleteSingle: 'Оё шумо мутмаин ҳастед, ки мехоҳед ин сабтро нест кунед? Ин амал бебозгашт аст.',
      confirmDeleteAll: 'Оё шумо мутмаин ҳастед, ки мехоҳед ТАМОМИ таърихро нест кунед? Ҳамаи натиҷаҳо ҳамешагӣ нест мешаванд.',
      methodologyCol: 'Методология',
      resultSummaryTitle: 'Хулосаи санҷиш',
      exportPdfTitle: 'Ҳисоботи расмии PDF',
      exportPdfDesc: 'Ҳуҷҷати дақиқро барои машварат бо духтури худ омода намоед.',
      downloadPdfBtn: 'Таҳия ва зеркашии PDF',
    },
    comparison: {
      title: 'Муқоисаи натиҷаҳои мувофиқ',
      subtitle: 'Муқоисаи дақиқи санҷишҳо бо ҳамон як версияи методӣ ва шароити якхелаи гузаронидан.',
      compatibleNote: 'Санҷишҳо комилан мувофиқанд: версияи методология ва талаботи муҳит якхела мебошанд.',
      incompatibleNote: 'Санҷишҳоро дуруст муқоиса кардан мумкин нест: версияи протоколҳо ё шароити санҷиш фарқ доранд.',
      metricLabel: 'Нишондиҳанда',
      attemptA: 'Сабти асосӣ',
      attemptB: 'Сабти муқоисашаванда',
      delta: 'Тағйирёбӣ',
      ruleLabel: 'Қоидаи мувофиқат:',
      attemptLabel: 'Санҷиши',
    },
    runner: {
      precheckTitle: 'Омодагӣ ба санҷиш',
      precheckDesc: 'Барои таъмини дақиқии санҷиш шароитҳоро риоя намоед:',
      deviceNotice: 'Рӯшноии муътадили хона, равшании бароҳати экран ва набудани омилҳои парешонкунандаро таъмин кунед.',
      acceptConditions: 'Ман риояи шароити муҳит ва мувофиқати синну солро тасдиқ мекунам',
      startAttemptBtn: 'Оғози санҷиш',
      cancelBtn: 'Бекоркунӣ',
      questionStep: 'Савол',
      nextBtn: 'Саволи навбатӣ',
      finishBtn: 'Анҷоми пурсишнома',
      completedTitle: 'Санҷиш анҷом ёфт',
      completedSubtitle: 'Натиҷа дар доираи сессияи муваққатии маҳаллӣ ҳисоб карда шуд.',
      saveBtn: 'Нигоҳ доштан дар таърихи шахсӣ',
      doNotSaveBtn: 'Нигоҳ надоштан (Ҳамешагӣ нест кардан)',
      consentExplain: 'Ҳангоми пахши «Нигоҳ доштан» натиҷа ба профили шахсии шумо сабт мешавад. Ҳангоми пахши «Нигоҳ надоштан» маълумот фавран аз пойгоҳ нест мешавад.',
    },
    auth: {
      loginTitle: 'Воридшавӣ ба SIHAT',
      registerTitle: 'Бақайдгирии ҳисоби нав',
      forgotTitle: 'Барқароркунии дастрасӣ',
      emailLabel: 'Суроғаи почтаи электронӣ',
      passwordLabel: 'Парол',
      ageGroupLabel: 'Гурӯҳи синну сол',
      age18Plus: '18-сола ва калонтар',
      age1617: '16–17 сола',
      submitLogin: 'Ворид шудан',
      submitRegister: 'Бақайдгирӣ',
      submitForgot: 'Ирсоли пайванд барои барқароркунӣ',
      switchToRegister: 'Ҳисоб надоред? Бақайдгирӣ',
      switchToLogin: 'Ҳисоб доред? Ворид шудан',
      switchToForgot: 'Паролро фаромӯш кардед?',
      googleSignIn: 'Воридшавӣ тавассути Google',
      closeBtn: 'Пӯшидан',
      fullNameLabel: 'Номи шумо',
      forgotExplain: 'Почтаи электроние, ки ҳангоми бақайдгирӣ истифода бурдед, ворид намоед.',
      backToLogin: 'Бозгашт ба воридшавӣ',
    },
    footer: {
      rights: 'Ҳамаи ҳуқуқҳо маҳфузанд.',
      strictNonDiagnostic: 'SIHAT — платформаи иттилоотӣ ва маърифатии скринингҳост. Муроҷиат ба духтурро иваз намекунад.',
      designedWithCare: 'Аз рӯи стандарти Living Clarity бо тамаркуз ба махфият ва асоснокӣ сохта шудааст.',
      protocols: 'Протоколҳо',
      science: 'Илм ва сохтор',
      languages: 'Забонҳои дастгиришаванда',
    },
  },

  en: {
    brand: 'SIHAT',
    slogan: 'UNDERSTAND YOUR HEALTH',
    tagline: 'Digital platform for objective screenings and healthy living',
    themeLight: 'Light',
    themeDark: 'Dark',
    nav: {
      home: 'Home',
      catalog: 'Catalog & Passports',
      exercises: 'Educational Exercises',
      history: 'My History & PDF',
      faq: 'FAQ',
      knowledge: 'Knowledge Base',
      support: 'Support',
      admin: 'Admin Panel',
      assistant: 'Ask SIHAT',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      closeMenu: 'Close menu',
      menu: 'Menu',
    },
    hero: {
      badge: 'SCIENTIFICALLY GROUNDED SCREENINGS',
      title: 'Understand Your Health',
      titleHighlight: 'with objective clarity',
      subtitle: 'Validated self-reflection questionnaires, oriented digital checks, and strict privacy by design. No medical diagnoses or fictitious health percentages.',
      searchPlaceholder: 'Search tests, symptoms, or disciplines (e.g. Snellen chart, Reaction latency)...',
      quickJump: 'Quick filters:',
      browseCatalog: 'Explore Checks',
      tryExercises: 'Interactive Exercises',
      aiGuide: 'Ask AI Navigator',
      chipVision: 'Vision',
      chipHearing: 'Hearing',
      chipMemory: 'Memory',
      chipAttention: 'Attention',
      chipStress: 'Stress',
      chipReaction: 'Reaction',
      chipCoordination: 'Coordination',
      chipProcessing: 'Processing',
      calibrationTag: 'Local Session',
      calibrationText: 'Client-side environmental calibration. All responses remain strictly in your browser session until you choose to save.',
    },
    bento: {
      protocolTitle: 'SIHAT Clarity Architecture',
      protocolVersion: 'Scientific Framework 3.0',
      statusActive: 'Active Verification',
      objectiveBadge: 'Transparent Metrics',
      objectiveDesc: 'All calculations are computed transparently based on standardized norms and published scientific instruments.',
      metric1Val: 'Privacy',
      metric1Label: 'Local Processing',
      metric2Val: 'Validated',
      metric2Label: 'Open Methodologies',
      metric3Val: '0%',
      metric3Label: 'No Fictitious Percentages',
    },
    disciplines: {
      badge: 'Primary Screening Catalog',
      title: '10 Objective Disciplines',
      subtitle: 'Comprehensive evidence-grounded screenings across sensory, cognitive, and physiological markers.',
      startBtn: 'Begin Check',
      featuredTag: 'Flagship Sensory Screening',
    },
    journey: {
      badge: 'Step-by-step Transparency',
      title: 'How SIHAT Works',
      subtitle: 'Three stages toward crystal clarity regarding your current physiological state.',
      step1Title: 'Select an Activity',
      step1Desc: 'Open methodology passports. Transparent scoring criteria. Before you begin, you understand exactly what is being measured and why.',
      step1Tag: 'Open Research Protocol',
      step2Title: 'Complete the Session',
      step2Desc: 'Local, private execution. Sensory responses and latency markers are analyzed strictly inside your browser environment.',
      step2Tag: 'On-device Processing',
      step3Title: 'Gain Clarity',
      step3Desc: 'Objective metrics with plain explanations. Complete freedom to save the record to your account or delete it permanently in one click.',
      step3Tag: 'Total Data Sovereignty',
    },
    aiShowcase: {
      badge: 'Integrated AI Navigator',
      title: 'SIHAT Gemini Navigator: Strict Guardrails & Zero Diagnostic Assertion',
      subtitle: 'Our assistant guides you through physiological checks, explains scientific terminology, and helps select appropriate disciplines.',
      check1: 'Correlates fatigue patterns with objective checks.',
      check2: 'Explains scientific terms: "optotypes", "response latency", "Corsi spatial span".',
      prohibitedNote: 'Strictly prohibited from formulating clinical diagnoses or prescribing medical treatment.',
      architectureTitle: 'Architectural Guardrails',
      architectureDesc: 'Rigid system boundaries prevent medical speculation and immediately direct users to qualified physicians during acute symptoms.',
      chatTitle: 'SIHAT Gemini Navigator',
      chatStatus: 'Safe bounds active',
      chatBadge: 'Bounded Guide v1.2',
      userQuery: '"I experience visual fatigue toward the end of my workday and lose focus. Where should I begin?"',
      aiReplyText: 'For end-of-day visual fatigue and attentional lapses, consider starting with two non-invasive screenings:',
      aiItem1: '1) Contrast Sensitivity Check (Discipline: Vision) — 3 mins',
      aiItem2: '2) Schulte Attentional Grid (Discipline: Attention) — 2 mins',
      aiSafetyNotice: 'Reminder: This is a screening for fatigue and does not replace clinical evaluation by an ophthalmologist.',
      launchBtn: 'Open AI Navigator',
      voiceActive: 'Voice Input Active',
    },
    disclaimer: {
      badge: 'ETHICAL STANDARD & SAFETY',
      headline: 'SIHAT is not a medical device and does not substitute for a physician.',
      text: 'The SIHAT platform is not a medical device, does not diagnose conditions, and does not prescribe treatments. In case of acute or deteriorating symptoms, seek immediate professional medical attention.',
    },
    exercises: {
      title: 'Interactive Exercises and Trainers',
      subtitle: '15 educational modules designed to evaluate sensorimotor and cognitive responses on your device.',
      signInPrompt: 'Sign in to access exercises',
      guestNotice: 'You can explore all exercises freely. To start an interactive attempt and record metrics, sign in with your account.',
      leaveBtn: 'Leave exercise',
      completeBtn: 'Complete exercise',
      skipBtn: 'Skip exercise',
      saveBtn: 'Save',
      doNotSaveBtn: 'Do not save',
      completedTitle: 'Exercise complete',
    },
    admin: {
      title: 'Administrative Dashboard',
      subtitle: 'Telemetry overview, methodology passport moderation, and user support operations.',
      tabDashboard: 'Overview & Telemetry',
      tabUsers: 'Users Directory',
      tabTickets: 'Support Inquiries',
      tabTests: 'Tests Moderation',
      tabAuthoring: 'AI Drafting',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      completedAttempts: 'Completed Checks',
      savedResults: 'Consented Records',
      userEmailCol: 'Email',
      userRoleCol: 'Role',
      userStatusCol: 'Status',
      userActionCol: 'Action',
      deactivateBtn: 'Deactivate',
      activateBtn: 'Activate',
    },
    catalog: {
      title: 'Health Checks and Educational Catalog',
      subtitle: 'Browse validated self-reflection questionnaires, oriented digital checks, and educational exercises. SIHAT checks do not diagnose conditions or replace clinical evaluation.',
      searchLabel: 'Search checks by title...',
      allCategories: 'All Categories',
      ageFilterLabel: 'Age Group:',
      ageAll: 'All Age Groups',
      age18: 'Age 18+',
      age1617: 'Age 16+',
      startBtn: 'Start Check',
      passportBtn: 'Methodology Passport',
      questionsCount: 'questions',
      evidenceLevel: 'Evidence Level',
      guestAllowed: 'Guest OK',
      authRequired: 'Account required',
      noTests: 'No published checks found matching your criteria.',
    },
    passportModal: {
      title: 'Methodology Passport',
      evidence: 'Scientific Evidence Level',
      scientificSource: 'Scientific Source & Papers',
      deviceRestrictions: 'Device & Environmental Requirements',
      methodLimitations: 'Methodological Limitations',
      medicalWarnings: 'Clinical Warnings',
      license: 'Licensing Terms',
      closeBtn: 'Dismiss',
      startCheckBtn: 'Begin Testing',
    },
    history: {
      title: 'Your Private Results History',
      subtitle: 'These records exist only because you chose Save after completion. They are private to your account and never used to compute a composite health score.',
      authRequiredMsg: 'Sign in to access your saved history records.',
      clearAllBtn: 'Delete all history',
      emptyMsg: 'You have no saved results yet.',
      testCol: 'Test',
      dateCol: 'Date & Time',
      scoreCol: 'Summary',
      actionsCol: 'Actions',
      viewBtn: 'Details',
      compareBtn: 'Compare',
      pdfBtn: 'Export PDF',
      deleteBtn: 'Delete',
      includeAnswersPdf: 'Include answers in PDF',
      includeWarningsPdf: 'Include medical warnings',
      confirmDeleteSingle: 'Are you sure you want to delete this result? This action is permanent.',
      confirmDeleteAll: 'Are you sure you want to delete your ENTIRE result history? All records will be wiped.',
      methodologyCol: 'Methodology',
      resultSummaryTitle: 'Outcome Summary',
      exportPdfTitle: 'Official PDF Document',
      exportPdfDesc: 'Download an encrypted, scientifically formatted report to discuss with your primary care provider.',
      downloadPdfBtn: 'Download PDF Report',
    },
    comparison: {
      title: 'Compatible Result Comparison',
      subtitle: 'Strict comparison between compatible attempts of the same methodology version and conditions',
      compatibleNote: 'Attempts are fully compatible: same methodology version and environment requirements.',
      incompatibleNote: 'Attempts cannot be directly compared due to differing versions or conditions.',
      metricLabel: 'Metric',
      attemptA: 'Primary Record',
      attemptB: 'Comparison Record',
      delta: 'Delta',
      ruleLabel: 'Compatibility rule:',
      attemptLabel: 'Completion',
    },
    runner: {
      precheckTitle: 'Pre-Test Preparation',
      precheckDesc: 'To ensure validity, please verify the following conditions:',
      deviceNotice: 'Ensure stable ambient lighting, appropriate display brightness, and minimal external distractions.',
      acceptConditions: 'I confirm compliance with environmental conditions and age requirements',
      startAttemptBtn: 'Begin Testing',
      cancelBtn: 'Cancel',
      questionStep: 'Question',
      nextBtn: 'Next Question',
      finishBtn: 'Submit Questionnaire',
      completedTitle: 'Testing Completed',
      completedSubtitle: 'Your outcome has been computed in a temporary private session.',
      saveBtn: 'Save to Private History',
      doNotSaveBtn: 'Do not save (Delete immediately)',
      consentExplain: 'Selecting "Save" records this outcome in your private account. Selecting "Do not save" immediately and permanently removes all answers from the database.',
    },
    auth: {
      loginTitle: 'Sign In to SIHAT',
      registerTitle: 'Create Account',
      forgotTitle: 'Reset Password',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      ageGroupLabel: 'Age Group',
      age18Plus: '18 years or older',
      age1617: '16–17 years',
      submitLogin: 'Sign In',
      submitRegister: 'Create Account',
      submitForgot: 'Send Reset Link',
      switchToRegister: "Don't have an account? Sign up",
      switchToLogin: 'Already have an account? Sign in',
      switchToForgot: 'Forgot password?',
      googleSignIn: 'Sign in with Google',
      closeBtn: 'Dismiss',
      fullNameLabel: 'Full Name',
      forgotExplain: 'Enter your registered email address and we will generate an access recovery link.',
      backToLogin: 'Back to sign in',
    },
    footer: {
      rights: 'All rights reserved.',
      strictNonDiagnostic: 'SIHAT is an informational screening and educational platform. It does not replace professional medical advice.',
      designedWithCare: 'Crafted according to the SIHAT Living Clarity design standard with focus on privacy and security.',
      protocols: 'Protocols',
      science: 'Science & System',
      languages: 'Supported Languages',
    },
  },
};
