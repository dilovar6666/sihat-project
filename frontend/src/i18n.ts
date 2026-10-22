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
  };
  disclaimer: {
    badge: string;
    headline: string;
    text: string;
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
    },
    hero: {
      badge: 'НАУЧНО ОБОСНОВАННЫЕ СКРИНИНГИ',
      title: 'Понимай своё здоровье. Начни с простого.',
      titleHighlight: 'своё здоровье',
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
    },
    bento: {
      protocolTitle: 'SIHAT Clarity Protocol',
      protocolVersion: 'Verified Bio-Telemetry v2.4',
      statusActive: 'Active Engine',
      objectiveBadge: 'Zero Black Box',
      objectiveDesc: 'Все расчеты производятся без мистификаций на базе открытых научных шкал и нормативов.',
      metric1Val: '100%',
      metric1Label: 'Client-side Privacy',
      metric2Val: 'ISO/WHO',
      metric2Label: 'Open Methodology',
      metric3Val: '0%',
      metric3Label: 'Fake Health Scores',
    },
    disciplines: {
      badge: 'Базовый каталог скринингов',
      title: '10 Объективных Дисциплин',
      subtitle: 'Комплексные научно обоснованные скрининги сенсорных, когнитивных и физиологических маркеров.',
      startBtn: 'Пройти скрининг',
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
    },
    disclaimer: {
      badge: 'ЭТИЧЕСКИЙ СТАНДАРТ И БЕЗОПАСНОСТЬ',
      headline: 'SIHAT не является медицинским изделием и не заменяет врача.',
      text: 'Все материалы, скрининги и интерактивные упражнения платформы носят исключительно информационно-просветительский характер. Мы не ставим диагнозов, не выписываем лечебных назначений и не рассчитываем псевдонаучные «проценты общего здоровья». При наличии тревожных симптомов всегда обращайтесь к квалифицированному врачу или в службу неотложной помощи.',
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
      guestAllowed: 'Доступно гостям',
      authRequired: 'Требуется вход',
      noTests: 'Тесты по заданным критериям не найдены.',
    },
    passportModal: {
      title: 'Паспорт методики',
      evidence: 'Уровень доказательности',
      scientificSource: 'Научный источник и публикации',
      deviceRestrictions: 'Требования к устройству и условиям',
      methodLimitations: 'Методологические ограничения',
      medicalWarnings: 'Клинические предупреждения',
      license: 'Условия лицензирования',
      closeBtn: 'Закрыть паспорт',
    },
    history: {
      title: 'Приватная история результатов',
      subtitle: 'Доступна только вам. Сохраняется исключительно с вашего явного согласия.',
      authRequiredMsg: 'Войдите в учетную запись для просмотра сохраненных результатов.',
      clearAllBtn: 'Очистить всю историю',
      emptyMsg: 'У вас пока нет сохраненных результатов. Пройдите любой тест в каталоге и выберите «Сохранить».',
      testCol: 'Тест',
      dateCol: 'Дата и время',
      scoreCol: 'Итог',
      actionsCol: 'Действия',
      viewBtn: 'Подробнее',
      compareBtn: 'Сравнить',
      pdfBtn: 'Экспорт PDF',
      deleteBtn: 'Удалить',
      includeAnswersPdf: 'Включить ответы в PDF',
      includeWarningsPdf: 'Включить предупреждения',
      confirmDeleteSingle: 'Вы уверены, что хотите удалить этот результат? Это действие необратимо.',
      confirmDeleteAll: 'Вы действительно хотите удалить ВСЮ историю результатов? Все записи будут стёрты.',
    },
    comparison: {
      title: 'Сравнение динамики прохождений',
      subtitle: 'Строгое сопоставление совместимых попыток одной методики и версии',
      compatibleNote: 'Попытки сопоставимы: одинаковая версия методики и условия прохождения.',
      incompatibleNote: 'Попытки не могут быть сопоставлены напрямую из-за различия версий или условий.',
      metricLabel: 'Показатель',
      attemptA: 'Текущая запись',
      attemptB: 'Сравниваемая запись',
      delta: 'Изменение',
    },
    runner: {
      precheckTitle: 'Подготовка к прохождению',
      precheckDesc: 'Для корректности выполнения ознакомьтесь с условиями:',
      deviceNotice: 'Убедитесь в стабильном освещении, нормальной яркости экрана и отсутствии отвлекающих факторов.',
      acceptConditions: 'Я подтверждаю соблюдение условий и возрастных требований',
      startAttemptBtn: 'Приступить к тестированию',
      cancelBtn: 'Отмена',
      questionStep: 'Вопрос',
      nextBtn: 'Следующий вопрос',
      finishBtn: 'Завершить опросник',
      completedTitle: 'Тестирование завершено',
      completedSubtitle: 'Ваш результат рассчитан в локальной временной сессии.',
      saveBtn: 'Сохранить в личную историю',
      doNotSaveBtn: 'Не сохранять (удалить немедленно)',
      consentExplain: 'При выборе «Сохранить» запись будет привязана к вашему аккаунту. При выборе «Не сохранять» все ответы будут немедленно стёрты из базы данных.',
    },
    auth: {
      loginTitle: 'Вход в аккаунт SIHAT',
      registerTitle: 'Создание аккаунта',
      forgotTitle: 'Восстановление пароля',
      emailLabel: 'Адрес электронной почты',
      passwordLabel: 'Пароль',
      ageGroupLabel: 'Ваша возрастная группа',
      age18Plus: '18 лет и старше',
      age1617: '16–17 лет',
      submitLogin: 'Войти',
      submitRegister: 'Зарегистрироваться',
      submitForgot: 'Отправить ссылку сброса',
      switchToRegister: 'Нет аккаунта? Зарегистрироваться',
      switchToLogin: 'Уже есть аккаунт? Войти',
      switchToForgot: 'Забыли пароль?',
      googleSignIn: 'Войти через Google',
    },
    footer: {
      rights: 'Все права защищены.',
      strictNonDiagnostic: 'SIHAT — платформа информационной самопомощи и образовательных скринингов. Не заменяет консультацию врача.',
      designedWithCare: 'Разработано по стандарту SIHAT Signature с акцентом на приватность и безопасность.',
      protocols: 'Протоколы',
      science: 'Наука и система',
      languages: 'Языки платформы',
    },
  },
  tj: {
    brand: 'SIHAT',
    slogan: 'UNDERSTAND YOUR HEALTH',
    tagline: 'Платформаи рақамии таҳлили саломатӣ ва тарзи ҳаёти солим',
    themeLight: 'Рӯшан',
    themeDark: 'Торик',
    nav: {
      home: 'Асосӣ',
      catalog: 'Феҳристи тестҳо',
      exercises: 'Машқҳо',
      history: 'Таърихи натиҷаҳо',
      faq: 'Саволу ҷавоб',
      knowledge: 'Донишнома',
      support: 'Дастгирӣ',
      admin: 'Панели идора',
      assistant: 'Ёрдамчии AI',
      signIn: 'Воридшавӣ',
      signUp: 'Қайдгирӣ',
      signOut: 'Баромад',
    },
    hero: {
      badge: 'СКРИНИНГҲОИ ИЛМАН АСОСНОК',
      title: 'Саломатии худро фаҳмед. Аз чизи оддӣ оғоз намоед.',
      titleHighlight: 'саломатии худро',
      subtitle: 'Пурсишномаҳои тасдиқшуда, машқҳои интерактивии воқеӣ ва махфияти комил. Бе ташхиси бардурӯғ ва фоизҳои сохтаи саломатӣ.',
      searchPlaceholder: 'Ҷустуҷӯи тестҳо, нишонаҳо ё фанҳо...',
      quickJump: 'Гузариши фаврӣ:',
      browseCatalog: 'Омӯхтани тестҳо',
      tryExercises: 'Машқҳои интерактивӣ',
      aiGuide: 'Аз роҳнамои AI пурсед',
      chipVision: 'Биноӣ',
      chipHearing: 'Шунавоӣ',
      chipMemory: 'Хотира',
      chipAttention: 'Диққат',
      chipStress: 'Стресс',
    },
    bento: {
      protocolTitle: 'SIHAT Clarity Protocol',
      protocolVersion: 'Verified Bio-Telemetry v2.4',
      statusActive: 'Active Engine',
      objectiveBadge: 'Zero Black Box',
      objectiveDesc: 'Ҳамаи ҳисобҳо дар асоси шкалаҳо ва меъёрҳои кушоди илмӣ сурат мегиранд.',
      metric1Val: '100%',
      metric1Label: 'Client-side Privacy',
      metric2Val: 'ISO/WHO',
      metric2Label: 'Open Methodology',
      metric3Val: '0%',
      metric3Label: 'Fake Health Scores',
    },
    disciplines: {
      badge: 'Феҳристи асосии скринингҳо',
      title: '10 Самти Воқеӣ',
      subtitle: 'Скринингҳои илман асосноки нишондиҳандаҳои сенсорӣ, когнитивӣ ва физиологӣ.',
      startBtn: 'Гузаштани скрининг',
    },
    journey: {
      badge: 'Шаффофияти ҳар як қадам',
      title: 'SIHAT чӣ гуна кор мекунад',
      subtitle: '3 қадам ба сӯи рӯшании комили ҳолати физиологии шумо.',
      step1Title: 'Санҷишро интихоб кунед',
      step1Desc: 'Шиносномаҳои кушодаи методологӣ. Меъёрҳои шаффоф бе ягон сеҳру ҷоду.',
      step1Tag: 'Протоколи кушодаи таҳқиқот',
      step2Title: 'Тестро гузаред',
      step2Desc: 'Ҷаласаи маҳаллии махфӣ. Маълумоти шумо танҳо дар дастгоҳи худатон ҳисоб карда мешавад.',
      step2Tag: 'Ҳисобкунии On-device',
      step3Title: 'Шарҳро гиред',
      step3Desc: 'Нишондиҳандаҳои воқеии ададӣ ва ихтиёри комил барои захира кардан ё пок намудан.',
      step3Tag: 'Назорати пурраи маълумоти худ',
    },
    aiShowcase: {
      badge: 'Роҳнамои дарунсохти AI',
      title: 'Роҳнамои AI-и SIHAT: ҳудуди қатъӣ ва сифри ташхис',
      subtitle: 'Роҳнамои мо барои ёфтани самти мувофиқ кӯмак мекунад, вале ҳаргиз ташхиси тиббӣ намегузорад.',
      check1: 'Ба сохтани мувофиқати нишонаҳо бо тестҳои объективӣ кумак мекунад.',
      check2: 'Мафҳумҳои илмиро ба забони содда мефаҳмонад.',
      prohibitedNote: 'Гузоштани ташхиси клиникӣ ва таъини дору қатъиян манъ аст.',
      architectureTitle: 'Принсипи сохтор',
      architectureDesc: 'Маҳдудиятҳои системавӣ пешгирии хулосаҳои бардурӯғро таъмин мекунанд.',
      chatTitle: 'SIHAT Gemini Navigator',
      chatStatus: 'Ҳолати бехатар фаъол аст',
      chatBadge: 'Bounded Guide v1.2',
      userQuery: '«Охири рӯзи корӣ чашмонам хаста мешаванд. Аз чӣ бояд сар кунам?»',
      aiReplyText: 'Барои хастагии чашм ва паст шудани диққат ду санҷиш тавсия дода мешавад:',
      aiItem1: '1) Санҷиши ҳассосияти контрастӣ (Самти «Биноӣ») — 3 дақиқа',
      aiItem2: '2) Ҷадвалҳои Шулте (Самти «Диққат») — 2 дақиқа',
      aiSafetyNotice: 'Ёдрас мекунем: ин скрининги хастагӣ буда, муоинаи духтури чашмро иваз намекунад.',
      launchBtn: 'Кушодани роҳнамои AI',
    },
    disclaimer: {
      badge: 'ОГОҲИИ ТИББӢ ВА БЕХАТАРӢ',
      headline: 'SIHAT ташхис намегузорад ва табобат таъин намекунад.',
      text: 'Платформаи SIHAT ташхис намегузорад ва табобат таъин намекунад. Ҳангоми эҳсоси бад шудани вазъи саломатӣ фавран ба духтури мутахассис муроҷиат намоед.',
    },
    catalog: {
      title: 'Феҳристи скринингҳо ва машқҳо',
      subtitle: '10 самти саломатӣ бо шиносномаҳои методии шаффоф',
      searchLabel: 'Ҷустуҷӯ аз рӯи ном...',
      allCategories: 'Ҳамаи самтҳо',
      ageFilterLabel: 'Гурӯҳи синну сол:',
      ageAll: 'Ҳама синну сол',
      age18: '18+ сола',
      age1617: '16–17 сола',
      startBtn: 'Оғози тест',
      passportBtn: 'Шиносномаи метод',
      questionsCount: 'савол',
      evidenceLevel: 'Сатҳи далелҳо',
      guestAllowed: 'Барои меҳмонон кушода',
      authRequired: 'Воридшавӣ лозим',
      noTests: 'Ягон тест ёфт нашуд.',
    },
    passportModal: {
      title: 'Шиносномаи методология',
      evidence: 'Сатҳи асоснокии илмӣ',
      scientificSource: 'Сарчашмаи илмӣ ва нашрҳо',
      deviceRestrictions: 'Талабот ба таҷҳизот ва шароит',
      methodLimitations: 'Маҳдудиятҳои методологӣ',
      medicalWarnings: 'Огоҳиҳои клиникӣ',
      license: 'Шартҳои иҷозатнома',
      closeBtn: 'Пӯшидани шиноснома',
    },
    history: {
      title: 'Таърихи махфии натиҷаҳо',
      subtitle: 'Танҳо барои шумо дастрас аст. Танҳо бо ризоияти сареҳи шумо нигоҳ дошта мешавад.',
      authRequiredMsg: 'Барои дидани таърих ба ҳисоби худ ворид шавед.',
      clearAllBtn: 'Пок кардани ҳамаи таърих',
      emptyMsg: 'Шумо ҳанӯз натиҷаи захирашуда надоред.',
      testCol: 'Тест',
      dateCol: 'Сана ва вақт',
      scoreCol: 'Хулоса',
      actionsCol: 'Амалҳо',
      viewBtn: 'Муфассал',
      compareBtn: 'Муқоиса',
      pdfBtn: 'PDF содир кардан',
      deleteBtn: 'Нест кардан',
      includeAnswersPdf: 'Ҷавобҳо дар PDF бошанд',
      includeWarningsPdf: 'Огоҳиҳо дар PDF бошанд',
      confirmDeleteSingle: 'Оё мутмаин ҳастед, ки ин натиҷаро нест кунед?',
      confirmDeleteAll: 'Оё мутмаин ҳастед, ки ҲАМАИ натиҷаҳоро пок кунед?',
    },
    comparison: {
      title: 'Муқоисаи натиҷаҳо',
      subtitle: 'Муқоисаи дақиқи кӯшишҳои якхелаи ҳамон як метод ва шароит',
      compatibleNote: 'Кӯшишҳо комилан мувофиқанд: як хел версия ва шароити гузариш.',
      incompatibleNote: 'Кӯшишҳоро мустақиман муқоиса кардан мумкин нест.',
      metricLabel: 'Нишондиҳанда',
      attemptA: 'Натиҷаи аввал',
      attemptB: 'Натиҷаи дуюм',
      delta: 'Тағйирот',
    },
    runner: {
      precheckTitle: 'Омодагӣ ба гузаштани тест',
      precheckDesc: 'Барои дурустии натиҷа бо шароитҳо шинос шавед:',
      deviceNotice: 'Боварӣ ҳосил кунед, ки рӯшноӣ мувофиқ аст ва чизе диққати шуморо ҷалб намекунад.',
      acceptConditions: 'Ман шароитҳо ва синну соли заруриро тасдиқ мекунам',
      startAttemptBtn: 'Сар кардани санҷиш',
      cancelBtn: 'Бекор кардан',
      questionStep: 'Савол',
      nextBtn: 'Саволи навбатӣ',
      finishBtn: 'Анҷом додани пурсишнома',
      completedTitle: 'Санҷиш анҷом ёфт',
      completedSubtitle: 'Натиҷаи шумо дар ҷаласаи муваққатӣ ҳисоб карда шуд.',
      saveBtn: 'Дар таърихи шахсӣ захира кардан',
      doNotSaveBtn: 'Захира накардан (фавран нест шавад)',
      consentExplain: 'Агар «Захира кардан»-ро интихоб кунед, натиҷа сабт мешавад. Агар «Захира накардан»-ро интихоб кунед, фавран аз пойгоҳ нест мешавад.',
    },
    auth: {
      loginTitle: 'Воридшавӣ ба SIHAT',
      registerTitle: 'Эҷоди ҳисоб',
      forgotTitle: 'Барқароркунии рамз',
      emailLabel: 'Почтаи электронӣ',
      passwordLabel: 'Рамз',
      ageGroupLabel: 'Гурӯҳи синну сол',
      age18Plus: '18 сола ва калонтар',
      age1617: '16–17 сола',
      submitLogin: 'Ворид шудан',
      submitRegister: 'Қайд кардан',
      submitForgot: 'Фиристодани пайванд',
      switchToRegister: 'Ҳисоб надоред? Қайд шавед',
      switchToLogin: 'Ҳисоб доред? Ворид шавед',
      switchToForgot: 'Рамзро фаромӯш кардед?',
      googleSignIn: 'Воридшавӣ бо Google',
    },
    footer: {
      rights: 'Ҳамаи ҳуқуқҳо ҳифз шудаанд.',
      strictNonDiagnostic: 'SIHAT — платформаи иттилоотии машқҳо ва скринингҳо. Машварати духтурро иваз намекунад.',
      designedWithCare: 'Бо тарҳи SIHAT Signature ва таваҷҷӯҳ ба махфият сохта шудааст.',
      protocols: 'Протоколҳо',
      science: 'Илм ва сохтор',
      languages: 'Забонҳои платформа',
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
      catalog: 'Test Catalog',
      exercises: 'Exercises',
      history: 'Private History',
      faq: 'FAQ',
      knowledge: 'Knowledge Base',
      support: 'Support',
      admin: 'Admin Panel',
      assistant: 'Ask SIHAT',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
    },
    hero: {
      badge: 'SCIENTIFICALLY GROUNDED SCREENINGS',
      title: 'Understand your health. Start with what is simple.',
      titleHighlight: 'your health',
      subtitle: 'Validated questionnaires, objective interactive exercises, and rigorous privacy. No medical diagnoses or fictitious health percentages.',
      searchPlaceholder: 'Search tests, symptoms, or disciplines (e.g. Snellen chart, Reaction latency)...',
      quickJump: 'Quick jump:',
      browseCatalog: 'Explore tests',
      tryExercises: 'Interactive Exercises',
      aiGuide: 'Ask AI Guide',
      chipVision: 'Vision',
      chipHearing: 'Hearing',
      chipMemory: 'Memory',
      chipAttention: 'Attention',
      chipStress: 'Stress',
    },
    bento: {
      protocolTitle: 'SIHAT Clarity Protocol',
      protocolVersion: 'Verified Bio-Telemetry v2.4',
      statusActive: 'Active Engine',
      objectiveBadge: 'Zero Black Box',
      objectiveDesc: 'All calculations are computed transparently based on open scientific scales and physiological standards.',
      metric1Val: '100%',
      metric1Label: 'Client-side Privacy',
      metric2Val: 'ISO/WHO',
      metric2Label: 'Open Methodology',
      metric3Val: '0%',
      metric3Label: 'Fake Health Scores',
    },
    disciplines: {
      badge: 'Screenings Catalog',
      title: '10 Objective Disciplines',
      subtitle: 'Comprehensive, evidence-based screenings of sensory, cognitive, and physiological markers.',
      startBtn: 'Begin screening',
    },
    journey: {
      badge: 'Transparency at Every Step',
      title: 'How SIHAT Works',
      subtitle: '3 steps toward crystal clarity on your current physiological status.',
      step1Title: 'Select a check',
      step1Desc: 'Open methodology passports. Transparent criteria without black-box formulas. Know exactly what is measured.',
      step1Tag: 'Open Research Protocol',
      step2Title: 'Take the check',
      step2Desc: 'Private, localized session. Your sensor responses and micro-reactions are processed securely on-device.',
      step2Tag: 'On-device Compute',
      step3Title: 'Receive clarity',
      step3Desc: 'Objective metric values and plain explanations. The sovereign right to save or instantly wipe records.',
      step3Tag: 'Complete Data Ownership',
    },
    aiShowcase: {
      badge: 'Embedded AI Navigator',
      title: 'SIHAT AI Navigator: Strict boundaries and zero diagnosing',
      subtitle: 'Our guide helps you explore tests, explains scientific terminology, and pinpoints relevant disciplines without clinical overstepping.',
      check1: 'Correlates fatigue markers with objective screening modules.',
      check2: 'Explains scientific terms in plain language.',
      prohibitedNote: 'Strictly prohibited from rendering clinical diagnoses or prescribing medication.',
      architectureTitle: 'Architectural Principle',
      architectureDesc: 'Strict system boundaries prevent medical speculation and route users to physicians for acute complaints.',
      chatTitle: 'SIHAT Gemini Navigator',
      chatStatus: 'Safe mode active',
      chatBadge: 'Bounded Guide v1.2',
      userQuery: '“I feel eye strain toward the end of the day and scattered focus. Where should I start?”',
      aiReplyText: 'For eye fatigue and reduced attention, we recommend starting with two non-invasive screenings:',
      aiItem1: '1) Contrast Sensitivity Check (Vision discipline) — 3 min',
      aiItem2: '2) Schulte Attention Table (Attention discipline) — 2 min',
      aiSafetyNotice: 'Reminder: this is an educational screening and does not replace an ophthalmologist examination.',
      launchBtn: 'Open AI Guide Drawer',
    },
    disclaimer: {
      badge: 'ETHICAL STANDARD & SAFETY',
      headline: 'SIHAT is not a medical device and does not substitute for a physician.',
      text: 'The SIHAT platform is not a medical device, does not diagnose conditions, and does not prescribe treatments. In case of acute or deteriorating symptoms, seek immediate professional medical attention.',
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
    },
    footer: {
      rights: 'All rights reserved.',
      strictNonDiagnostic: 'SIHAT is an informational screening and educational platform. It does not replace professional medical advice.',
      designedWithCare: 'Crafted according to the SIHAT Signature design standard with focus on privacy and security.',
      protocols: 'Protocols',
      science: 'Science & System',
      languages: 'Supported Languages',
    },
  },
};
