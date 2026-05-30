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
  "Інше",
] as const;

export const CATEGORY_ICONS: Record<(typeof CATEGORIES)[number], string> = {
  Транспорт: "🚗",
  Нерухомість: "🏢",
  Електроніка: "📱",
  "Дім і сад": "🌿",
  "Одяг і взуття": "👕",
  "Для дітей": "🧸",
  "Спорт і відпочинок": "⚽",
  "Краса і здоров'я": "💄",
  Послуги: "🛠️",
  Тварини: "🐾",
  "Хобі та розваги": "🎮",
  Інше: "📦",
};

export const MAX_LISTING_PHOTOS = 10;

export const CONDITIONS: Record<string, string> = {
  NEW: "Нове",
  GOOD: "Добрий стан",
  FAIR: "Задовільний",
};

export const LISTING_STATUSES: Record<string, string> = {
  PENDING: "На модерації",
  ACTIVE: "Активне",
  SOLD: "Продано",
  HIDDEN: "Приховане",
};

export const ORDER_STATUSES: Record<string, string> = {
  PENDING: "Очікує",
  CONFIRMED: "Підтверджено",
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
