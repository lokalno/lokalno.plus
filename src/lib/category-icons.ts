import { CATEGORIES } from "./constants";

export const CATEGORY_ICONS: Record<string, string> = {
  Транспорт: "🚗",
  Нерухомість: "🏠",
  Електроніка: "📱",
  "Дім і сад": "🛋️",
  "Одяг і взуття": "👕",
  "Для дітей": "🧸",
  "Спорт і відпочинок": "⚽",
  "Краса і здоров'я": "💄",
  Послуги: "🔧",
  Тварини: "🐾",
  "Товари для тварин": "🦴",
  "Хобі та розваги": "🎮",
  Канцтовари: "✏️",
  Книги: "📚",
  Автотовари: "🔩",
  Зоотовари: "🐕",
  Квіти: "💐",
  "Побутова техніка": "🔌",
  Меблі: "🪑",
  Іграшки: "🎲",
  "Оптовий продаж": "📦",
  Інше: "✨",
};

/** Top categories shown in the mobile horizontal strip */
export const MOBILE_STRIP_CATEGORIES = CATEGORIES.slice(0, 10);

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || "📦";
}
