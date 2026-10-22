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
    subtitle: string;
    searchPlaceholder: string;
    browseCatalog: string;
    tryExercises: string;
    aiGuide: string;
  };
  pillars: {
    title: string;
    subtitle: string;
    p1Title: string;
    p1Desc: string;
    p2Title: string;
    p2Desc: string;
    p3Title: string;
    p3Desc: string;
    p4Title: string;
    p4Desc: string;
  };
  disclaimer: {
    badge: string;
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
      title: 'Понимайте состояние своего здоровья',
      subtitle: 'Валидированные опросники, объективные интерактивные упражнения и строгая конфиденциальность. Без постановки диагнозов и вымышленных «процентов здоровья».',
      searchPlaceholder: 'Поиск тестов, тем и методик...',
      browseCatalog: 'Открыть каталог тестов',
      tryExercises: 'Интерактивные упражнения',
      aiGuide: 'Открыть ИИ-гида',
    },
    pillars: {
      title: 'Почему пользователям важен SIHAT',
      subtitle: 'Принципы прозрачной и этичной медицинской информатики',
      p1Title: 'Методологические паспорта',
      p1Desc: 'Каждый тест имеет открытый паспорт с указанием научной первоосновы, уровня доказательности и ограничений применимости.',
      p2Title: 'Приватность и явное согласие',
      p2Desc: 'Результаты тестов не сохраняются без вашего явного подтверждения. Выбор между сохранением и мгновенным удалением всегда за вами.',
      p3Title: 'Объективные цифровые метрики',
      p3Desc: 'Упражнения измеряют строго время реакции, точность моторных действий и число повторений, не заменяя клиническое обследование.',
      p4Title: 'Контекстный ИИ-помощник',
      p4Desc: 'Серверный ИИ помогает ориентироваться по каталогу и объясняет ограничения методик, не вмешиваясь в клинические решения.',
    },
    disclaimer: {
      badge: 'МЕДИЦИНСКОЕ ПРЕДУПРЕЖДЕНИЕ',
      text: 'Платформа SIHAT не является медицинским изделием, не ставит медицинские диагнозы и не назначает лечение. При любых тревожных, острых или ухудшающихся симптомах немедленно обратитесь к профильному врачу или в службу неотложной помощи.',
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
      title: 'Саломатии худро беҳтар фаҳмед',
      subtitle: 'Пурсишномаҳои тасдиқшуда, машқҳои интерактивии воқеӣ ва махфияти комил. Бе ташхиси бардурӯғ ва «фоизҳои саломатӣ».',
      searchPlaceholder: 'Ҷустуҷӯи тестҳо ва машқҳо...',
      browseCatalog: 'Кушодани феҳристи тестҳо',
      tryExercises: 'Машқҳои интерактивӣ',
      aiGuide: 'Роҳнамои AI',
    },
    pillars: {
      title: 'Чаро корбарон SIHAT-ро интихоб мекунанд',
      subtitle: 'Принсипҳои шаффоф ва ахлоқии информатикаи тиббӣ',
      p1Title: 'Шиносномаҳои методӣ',
      p1Desc: 'Ҳар як тест дорои шиносномаи кушод бо нишон додани сарчашмаи илмӣ, сатҳи асоснокӣ ва маҳдудиятҳо мебошад.',
      p2Title: 'Махфият ва ризоияти озод',
      p2Desc: 'Натиҷаҳо бе ризоияти сареҳи шумо нигоҳ дошта намешаванд. Интихоби захира ё нест кардан ҳамеша дар ихтиёри шумост.',
      p3Title: 'Нишондиҳандаҳои воқеӣ',
      p3Desc: 'Машқҳо суръати вокуниш ва дақиқии амалҳоро чен мекунанд, на ташхиси тиббиро.',
      p4Title: 'Роҳнамои AI бе ташхис',
      p4Desc: 'Ёрдамчии AI ба шумо дар ёфтани тестҳо кӯмак мерасонад, вале ба хулосаҳои тиббӣ дахолат намекунад.',
    },
    disclaimer: {
      badge: 'ОГОҲИИ ТИББӢ',
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
      emptyMsg: 'Шумо ҳанӯз натиҷаи захирашуда надоред. Як тест гузаред ва «Захира кардан»-ро пахш кунед.',
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
      title: 'Understand Your Health',
      subtitle: 'Validated questionnaires, objective interactive exercises, and rigorous privacy. No medical diagnoses or fictitious health percentages.',
      searchPlaceholder: 'Search tests, topics, and methodologies...',
      browseCatalog: 'Explore Catalog',
      tryExercises: 'Interactive Exercises',
      aiGuide: 'Open AI Guide',
    },
    pillars: {
      title: 'Why Users Choose SIHAT',
      subtitle: 'Principles of transparent, ethical, and evidence-based health informatics',
      p1Title: 'Methodology Passports',
      p1Desc: 'Every test features an open passport disclosing its scientific foundation, evidence grade, and applicability boundaries.',
      p2Title: 'Privacy & Explicit Consent',
      p2Desc: 'No results are retained without your explicit confirmation. The choice between permanent saving and instant deletion is always yours.',
      p3Title: 'Objective Digital Metrics',
      p3Desc: 'Exercises measure strictly reaction latency, motor precision, and execution counts without substituting for clinical consultations.',
      p4Title: 'Contextual AI Navigator',
      p4Desc: 'A bounded server-side assistant helps you browse the catalog and understand methodologies without interfering with medical decisions.',
    },
    disclaimer: {
      badge: 'MEDICAL DISCLAIMER',
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
    },
  },
};
