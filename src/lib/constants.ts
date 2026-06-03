export const UKRAINIAN_CITIES = [
  "Київ",
  "Львів",
  "Одеса",
  "Харків",
  "Дніпро",
  "Запоріжжя",
  "Вінниця",
  "Полтава",
  "Чернівці",
  "Івано-Франківськ",
  "Тернопіль",
  "Ужгород",
  "Миколаїв",
  "Хмельницький",
  "Рівне",
  "Суми",
  "Черкаси",
  "Житомир",
  "Кропивницький",
  "Луцьк",
] as const;

export const CATEGORIES = [
  "Транспорт",
  "Нерухомість",
  "Електроніка",
  "Дім і сад",
  "Одяг і взуття",
  "Для дітей",
  "Спорт і відпочинок",
  "Краса і здоров'я",
  "Послуги",
  "Тварини",
  "Хобі та розваги",
  "Канцтовари",
  "Книги",
  "Автотовари",
  "Зоотовари",
  "Квіти",
  "Побутова техніка",
  "Меблі",
  "Іграшки",
  "Одяг",
  "Оптовий продаж",
  "Інше",
] as const;

export const MAX_LISTING_PHOTOS = 10;

/** Target size per listing photo after client compression (~180 KB). */
export const LISTING_PHOTO_MAX_BYTES = 180_000;
export const LISTING_PHOTO_MAX_WIDTH = 1200;

export const CONDITIONS: Record<string, string> = {
  NEW: "Нове",
  LIKE_NEW: "Вживане — як нове",
  GOOD: "Добрий стан",
  FAIR: "Задовільний",
};

export const CATEGORY_SUBCATEGORIES: Record<(typeof CATEGORIES)[number], string[]> = {
  Транспорт: ["Легкові авто", "Мото", "Вантажівки", "Запчастини", "Інше"],
  Нерухомість: ["Квартири", "Будинки", "Земля", "Комерційна", "Оренда"],
  Електроніка: ["Мобільні телефони", "Ноутбуки", "Планшети", "Аудіо", "Фото", "Інше"],
  "Дім і сад": ["Меблі", "Кухня", "Інструменти", "Сад", "Декор"],
  "Одяг і взуття": ["Чоловіче", "Жіноче", "Дитяче", "Взуття", "Аксесуари"],
  "Для дітей": ["Іграшки", "Коляски", "Одяг", "Меблі", "Інше"],
  "Спорт і відпочинок": ["Велосипеди", "Тренажери", "Туризм", "Ігри", "Інше"],
  "Краса і здоров'я": ["Косметика", "Парфумерія", "Догляд", "Медтехніка"],
  Послуги: ["Ремонт", "Навчання", "Краса", "Транспорт", "Інше"],
  Тварини: ["Собаки", "Коти", "Птахи", "Акваріум", "Товари"],
  "Хобі та розваги": ["Книги", "Музика", "Колекції", "Рукоділля", "Інше"],
  Канцтовари: ["Папір", "Письмове", "Шкільне", "Офісне", "Інше"],
  Книги: ["Художня", "Навчальна", "Дитячі", "Комікси", "Інше"],
  Автотовари: ["Запчастини", "Аксесуари", "Шини", "Масла", "Інше"],
  Зоотовари: ["Корм", "Аксесуари", "Догляд", "Акваріум", "Інше"],
  Квіти: ["Букети", "Кімнатні", "Садові", "Декор", "Інше"],
  "Побутова техніка": ["Кухня", "Пральні машини", "Пилососи", "Клімат", "Інше"],
  Меблі: ["Дивани", "Столи", "Шафи", "Ліжка", "Інше"],
  Іграшки: ["Для немовлят", "Конструктори", "Настільні", "М'які", "Інше"],
  Одяг: ["Чоловіче", "Жіноче", "Дитяче", "Інше"],
  "Оптовий продаж": ["Одяг", "Електроніка", "Побутове", "Продукти", "Інше"],
  Інше: ["Інше"],
};

export function formatListingCategory(main: string, sub?: string): string {
  if (sub && sub !== "Інше") return `${main} > ${sub}`;
  return main;
}

export function parseListingCategory(value: string): { main: string; sub: string } {
  const parts = value.split(" > ").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { main: parts[0], sub: parts.slice(1).join(" > ") };
  }
  const main = CATEGORIES.includes(parts[0] as (typeof CATEGORIES)[number])
    ? parts[0]
    : CATEGORIES[0];
  const subs = CATEGORY_SUBCATEGORIES[main as (typeof CATEGORIES)[number]] ?? ["Інше"];
  return { main, sub: subs[0] ?? "Інше" };
}

export const LISTING_STATUSES: Record<string, string> = {
  PENDING: "На модерації",
  ACTIVE: "Активне",
  SOLD: "Продано",
  HIDDEN: "Приховане",
};

export const ORDER_STATUSES: Record<string, string> = {
  PENDING: "В обробці",
  CONFIRMED: "Прийнято продавцем",
  SHIPPED: "Відправлено",
  COMPLETED: "Завершено",
  CANCELLED: "Скасовано",
};

export const REPORT_REASONS = [
  "Заборонений товар",
  "Шахрайство",
  "Підробка",
  "Неправильний опис",
  "Інше",
] as const;

export const REPORT_STATUSES: Record<string, string> = {
  PENDING: "Нова",
  REVIEWED: "Переглянута",
  RESOLVED: "Вирішена",
};

export const SUPPORT_SUBJECTS = [
  "Питання по сайту",
  "Проблема з акаунтом",
  "Проблема з оголошенням",
  "Скарга",
  "Інше",
] as const;

export const SUPPORT_STATUSES: Record<string, string> = {
  OPEN: "Нове",
  RESOLVED: "Вирішено",
};
