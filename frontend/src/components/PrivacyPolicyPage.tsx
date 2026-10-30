import React from 'react'
import { ShieldCheck, Lock, EyeOff, Trash2, Database, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import type { Language } from '../i18n'

interface PrivacyPolicyPageProps {
  lang: Language
  onBack: () => void
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ lang, onBack }) => {
  const t = {
    ru: {
      badge: 'Политика конфиденциальности и защиты данных',
      title: 'Конфиденциальность и безопасность данных SIHAT',
      subtitle: 'Принципы нулевого удержания (Zero-Retention), локальной анонимизации и прозрачного управления личными записями.',
      lastUpdated: 'Редакция от 29 октября 2026 г.',
      backBtn: 'Назад на главную',
      sec1Title: '1. Базовый принцип: Zero-Retention (Нулевое удержание)',
      sec1Body: 'Платформа SIHAT изначально спроектирована по стандарту Privacy by Design. В гостевом режиме выполнения упражнений и прохождения опросников ваши ответы и сырая телеметрия (траектории мыши, время кликов) обрабатываются исключительно в оперативной памяти вашего браузера. Ни один ответ не записывается в постоянную базу данных на сервере без вашего прямого согласия.',
      sec2Title: '2. Сохранение данных только с явного согласия',
      sec2Body: 'По завершении каждого скрининга пользователю предоставляется выбор: нажать «Сохранить в профиль» или «Не сохранять». Если вы выбираете не сохранять результат или покидаете страницу, сессионные данные немедленно стираются. В настройках личного кабинета доступен тумблер «Сохранение только с явного согласия», гарантирующий полный контроль над каждой записью.',
      sec3Title: '3. Отсутствие сторонних рекламных трекеров',
      sec3Body: 'Мы категорически не используем коммерческие маркетинговые пиксели (Meta Pixel, Google Ads, TikTok Pixel, Яндекс Метрика с вебвизором) и сторонние SDK, отслеживающие поведение пользователя в медицинских и когнитивных сервисах. Результаты ваших скринингов никогда не передаются рекламодателям, страховым компаниям или третьим сторонам.',
      sec4Title: '4. Право на забвение и экспорт данных',
      sec4Body: 'Каждый зарегистрированный пользователь имеет неотъемлемое право: экспортировать любой свой отчёт в подписанный PDF-документ; точечно удалять отдельные результаты из архива; полностью очистить историю аккаунта в один клик через раздел «Безопасность» в личном кабинете.',
      sec5Title: '5. Технические меры безопасности',
      sec5Body: 'Все соединения защищены современными протоколами TLS 1.3 / HTTPS с поддержкой шифрования AES-256. Пароли пользователей хэшируются с использованием стойких криптографических функций bcrypt / Argon2. Доступ к API защищён временными криптографическими JWT-токенами с коротким жизненным циклом.',
    },
    tj: {
      badge: 'Сиёсати махфият ва ҳифзи маълумот',
      title: 'Махфият ва амнияти маълумот дар SIHAT',
      subtitle: 'Принсипҳои Zero-Retention, беномсозӣ ва идораи шаффофи сабтҳои шахсӣ.',
      lastUpdated: 'Таҳрири 29 октябри соли 2026',
      backBtn: 'Бозгашт ба саҳифаи асосӣ',
      sec1Title: '1. Принсипи асосӣ: Zero-Retention (Нигоҳ надоштани маълумот)',
      sec1Body: 'Платформаи SIHAT аз рӯи стандарти Privacy by Design таҳия шудааст. Дар ҳолати меҳмонӣ ҳамаи маълумот танҳо дар хотираи фаврии браузери шумо коркард мешавад ва ба пойгоҳи доимии сервер бе розигии шумо сабт намегардад.',
      sec2Title: '2. Сабт танҳо бо розигии ошкоро',
      sec2Body: 'Пас аз анҷоми ҳар як машқ шумо худатон интихоб мекунед: тугмаи «Сабт дар профил» ё «Сабт накардан». Агар шумо сабт кардан нахоҳед, маълумот фавран нест карда мешавад.',
      sec3Title: '3. Набудани трекерҳои таблиғотӣ',
      sec3Body: 'Мо ҳеҷ гоҳ пикселҳои тиҷоратӣ ва скриптҳои таблиғотиро истифода намебарем. Натиҷаҳои санҷиши саломатии шумо ҳаргиз ба ширкатҳои таблиғотӣ ё шахсони сеюм дода намешаванд.',
      sec4Title: '4. Ҳуқуқи пурра барои нест кардани маълумот',
      sec4Body: 'Ҳар як корбар ҳуқуқ дорад: натиҷаҳоро ба файли PDF содир кунад, сабтҳои дилхоҳро аз бойгонӣ нест намояд ё тамоми профили худро комилан пок созад.',
      sec5Title: '5. Амнияти техникӣ ва рамзгузорӣ',
      sec5Body: 'Ҳамаи алоқаҳо бо протоколи TLS 1.3 / HTTPS ҳифз мешаванд. Рамзҳо бо алгоритмҳои устувори криптографӣ рамзгузорӣ шудаанд.',
    },
    en: {
      badge: 'Privacy Policy & Data Governance',
      title: 'SIHAT Privacy & Data Protection Policy',
      subtitle: 'Built on Zero-Retention, privacy-by-design architecture, and sovereign user control over personal metrics.',
      lastUpdated: 'Updated October 29, 2026',
      backBtn: 'Back to Home',
      sec1Title: '1. Core Principle: Zero-Retention by Default',
      sec1Body: 'The SIHAT platform operates on strict Privacy by Design principles. In guest execution mode, task responses and raw telemetry (cursor trajectory, keydown latency) exist strictly in ephemeral browser memory. No telemetry is persisted to disk or server databases without explicit confirmation.',
      sec2Title: '2. Explicit Consent for Record Archival',
      sec2Body: 'Following each screening completion, you are given an uncoerced choice: "Save to Profile" or "Do Not Save". If you discard or navigate away, the attempt payload is wiped. Inside platform settings, you may toggle the Consent Shield to guarantee manual authorization for every saved item.',
      sec3Title: '3. Zero Third-Party Advertising Trackers',
      sec3Body: 'We categorically prohibit commercial tracking pixels (Meta, Google Ads, TikTok) or invasive behavioral analytics SDKs that create digital fingerprints of cognitive or sensory traits. Your health data is never monetized, sold, or shared with insurers.',
      sec4Title: '4. Right to Erasure & Data Portability',
      sec4Body: 'You maintain full data sovereignty: export your records into cryptographically verifiable PDFs; delete individual attempts; or wipe your entire profile and all associated data with one click.',
      sec5Title: '5. Technical Safeguards & Encryption',
      sec5Body: 'All communication is enforced over TLS 1.3 with AES-256 cipher suites. Passwords are hash-protected via bcrypt/Argon2 with high work factors. API calls use ephemeral scoped JWT authentication.',
    },
  }[lang]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.backBtn}</span>
      </Button>

      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <Badge variant="emerald" className="gap-1.5 py-1 px-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {t.subtitle}
        </p>
        <div className="text-xs font-mono text-slate-400">{t.lastUpdated}</div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <EyeOff className="w-5 h-5 text-emerald-500" />
            <span>{t.sec1Title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.sec1Body}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{t.sec2Title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.sec2Body}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-emerald-500" />
            <span>{t.sec3Title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.sec3Body}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-emerald-500" />
            <span>{t.sec4Title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.sec4Body}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-500" />
            <span>{t.sec5Title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.sec5Body}
          </p>
        </div>
      </div>
    </div>
  )
}
