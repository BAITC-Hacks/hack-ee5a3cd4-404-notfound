export type Language = 'ru' | 'kz';

export interface Translations {
  appName: string;
  appSubtitle: string;
  tabs: {
    trajectory: string;
    catalog: string;
    gamification: string;
    hr: string;
    import: string;
  };
  metrics: {
    currentPosition: string;
    targetPosition: string;
    readiness: string;
    totalGaps: string;
    criticalGaps: string;
    learningVelocity: string;
    tenure: string;
    manager: string;
    coins: string;
  };
  actions: {
    careerSimulator: string;
    competencyRadar: string;
    exportPDP: string;
    markCompleted: string;
    completing: string;
    createEvent: string;
    giveKudos: string;
    redeemReward: string;
    filterDepartment: string;
    filterGrade: string;
    searchPlaceholder: string;
  };
  simulator: {
    title: string;
    subtitle: string;
    targetRoleLabel: string;
    targetGradeLabel: string;
    simulationReadiness: string;
    approveGoal: string;
    resetGoal: string;
    cancel: string;
  };
  radar: {
    title: string;
    subtitle: string;
    currentLevel: string;
    requiredLevel: string;
    close: string;
  };
  pdp: {
    title: string;
    subtitle: string;
    printPdf: string;
    copyMarkdown: string;
    copied: string;
    signatures: string;
  };
  hr: {
    title: string;
    subtitle: string;
    totalEmployees: string;
    avgReadiness: string;
    laggingSkills: string;
    withoutNextStep: string;
    flightRisk: string;
    activityConversion: string;
  };
  gamification: {
    title: string;
    subtitle: string;
    balance: string;
    challengesTitle: string;
    storeTitle: string;
    kudosTitle: string;
    sendKudosButton: string;
  };
}

export const translations: Record<Language, Translations> = {
  ru: {
    appName: 'Halyk Career Quest',
    appSubtitle: 'AI-платформа карьерных траекторий и развития компетенций',
    tabs: {
      trajectory: 'Траектория',
      catalog: 'Каталог Halyk Academy',
      gamification: 'Квесты и Признание',
      hr: 'HR-Аналитика & Риски',
      import: 'Импорт (Жюри)',
    },
    metrics: {
      currentPosition: 'Текущая позиция',
      targetPosition: 'Целевая должность',
      readiness: 'Готовность к грейду',
      totalGaps: 'Всего разрывов',
      criticalGaps: 'Критических разрывов',
      learningVelocity: 'Темп освоения',
      tenure: 'Стаж в банке',
      manager: 'Руководитель',
      coins: 'Halyk Coins',
    },
    actions: {
      careerSimulator: 'Карьерный симулятор',
      competencyRadar: 'Радар компетенций',
      exportPDP: 'Экспорт ИПР',
      markCompleted: 'Отметить выполненным',
      completing: 'Применение...',
      createEvent: 'Создать мероприятие',
      giveKudos: 'Сказать спасибо коллеге',
      redeemReward: 'Получить',
      filterDepartment: 'Все департаменты',
      filterGrade: 'Все грейды',
      searchPlaceholder: 'Поиск сотрудника по имени, ID или роли...',
    },
    simulator: {
      title: 'Карьерный симулятор ("Что если...")',
      subtitle: 'Моделирование готовности, дефицита компетенций и AI-рекомендаций при смене целевой роли или грейда',
      targetRoleLabel: 'Целевая роль (Специализация)',
      targetGradeLabel: 'Целевой грейд',
      simulationReadiness: 'Готовность к симуляции',
      approveGoal: 'Утвердить как целевую должность',
      resetGoal: 'Сбросить к исходной',
      cancel: 'Отмена',
    },
    radar: {
      title: 'Радар компетенций (Spider Matrix)',
      subtitle: 'Сравнение текущих навыков сотрудника с требованиями матрицы компетенций',
      currentLevel: 'Текущий уровень',
      requiredLevel: 'Требуется для грейда',
      close: 'Закрыть',
    },
    pdp: {
      title: 'Индивидуальный план развития (ИПР)',
      subtitle: 'Официальный документ согласования карьерного перехода и карты развития Halyk Bank',
      printPdf: 'Печать / PDF',
      copyMarkdown: 'Копировать Markdown',
      copied: 'Скопировано',
      signatures: 'Лист согласования и подписи',
    },
    hr: {
      title: 'HR-Аналитика компетенций и прогноз рисков',
      subtitle: 'Агрегированный срез по сотрудникам, проседающим навыкам и рискам оттока',
      totalEmployees: 'Всего сотрудников',
      avgReadiness: 'Средняя готовность к промоушену',
      laggingSkills: 'Проседающие компетенции банка',
      withoutNextStep: 'Сотрудники без рекомендованного шага',
      flightRisk: 'Прогноз риска выгорания и оттока',
      activityConversion: 'Конверсия обучающих форматов',
    },
    gamification: {
      title: 'Квесты развития, Признание и Halyk Store',
      subtitle: 'Добровольная мотивация: персональные вызовы, благодарности коллег и обмен баллов развития',
      balance: 'Баланс Halyk Coins',
      challengesTitle: 'Квартальные вызовы развития',
      storeTitle: 'Корпоративный магазин Halyk Store',
      kudosTitle: 'Признание и благодарности от коллег (Kudos)',
      sendKudosButton: 'Отправить спасибо',
    },
  },
  kz: {
    appName: 'Halyk Career Quest',
    appSubtitle: 'Мансап траекториялары мен құзыреттерді дамытудың AI-платформасы',
    tabs: {
      trajectory: 'Траектория',
      catalog: 'Halyk Academy каталогы',
      gamification: 'Квесттер және Құрмет',
      hr: 'HR-Аналитика & Тәуекелдер',
      import: 'Импорт (Қазылар)',
    },
    metrics: {
      currentPosition: 'Қазіргі лауазымы',
      targetPosition: 'Мақсатты лауазым',
      readiness: 'Грейдке дайындық',
      totalGaps: 'Барлық алшақтықтар',
      criticalGaps: 'Критикалық алшақтықтар',
      learningVelocity: 'Даму қарқыны',
      tenure: 'Банктегі өтілі',
      manager: 'Жетекшісі',
      coins: 'Halyk Coins',
    },
    actions: {
      careerSimulator: 'Мансап симуляторы',
      competencyRadar: 'Құзыреттілік радары',
      exportPDP: 'ЖДА экспорттау',
      markCompleted: 'Орындалды деп белгілеу',
      completing: 'Қолданылуда...',
      createEvent: 'Іс-шара қосу',
      giveKudos: 'Әріптеске алғыс айту',
      redeemReward: 'Алу',
      filterDepartment: 'Барлық департаменттер',
      filterGrade: 'Барлық грейдтер',
      searchPlaceholder: 'Қызметкерді аты, ID немесе рөлі бойынша іздеу...',
    },
    simulator: {
      title: 'Мансап симуляторы ("Егер де...")',
      subtitle: 'Мақсатты рөлді немесе грейдті ауыстыру кезіндегі дайындықты, құзыреттер дефицитін және AI ұсыныстарын модельдеу',
      targetRoleLabel: 'Мақсатты рөл (Мамандану)',
      targetGradeLabel: 'Мақсатты грейд',
      simulationReadiness: 'Симуляция дайындығы',
      approveGoal: 'Мақсатты лауазым ретінде бекіту',
      resetGoal: 'Бастапқы күйге қайтару',
      cancel: 'Бас тарту',
    },
    radar: {
      title: 'Құзыреттілік радары (Spider Matrix)',
      subtitle: 'Қызметкердің ағымдағы дағдыларын құзыреттер матрицасы талаптарымен салыстыру',
      currentLevel: 'Ағымдағы деңгей',
      requiredLevel: 'Грейд үшін талап етіледі',
      close: 'Жабу',
    },
    pdp: {
      title: 'Жеке даму жоспары (ЖДА)',
      subtitle: 'Halyk Bank-тің мансаптық өсу мен даму картасын ресми бекіту құжаты',
      printPdf: 'Басып шығару / PDF',
      copyMarkdown: 'Markdown көшіру',
      copied: 'Көшірілді',
      signatures: 'Келісу парағы және қолдар',
    },
    hr: {
      title: 'Құзыреттердің HR-талдамасы және тәуекелдер болжамы',
      subtitle: 'Қызметкерлер, артта қалған дағдылар және кету тәуекелдері бойынша жиынтық кескін',
      totalEmployees: 'Барлық қызметкерлер',
      avgReadiness: 'Өсуге орташа дайындық',
      laggingSkills: 'Банктің артта қалған құзыреттері',
      withoutNextStep: 'Ұсынылған қадамы жоқ қызметкерлер',
      flightRisk: 'Шаршау және жұмыстан кету қаупінің болжамы',
      activityConversion: 'Оқыту форматтарының конверсиясы',
    },
    gamification: {
      title: 'Даму квесттері, Құрмет және Halyk Store',
      subtitle: 'Ерікті мотивация: жеке сынақтар, әріптестер алғысы және даму ұпайларын айырбастау',
      balance: 'Halyk Coins балансы',
      challengesTitle: 'Тоқсандық даму сынақтары',
      storeTitle: 'Halyk Store корпоративтік дүкені',
      kudosTitle: 'Әріптестерден алғыс пен құрмет (Kudos)',
      sendKudosButton: 'Алғыс жолдау',
    },
  },
};
