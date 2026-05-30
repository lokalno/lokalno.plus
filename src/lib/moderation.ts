export const FORBIDDEN_WORDS = [
  "зброя",
  "weapon",
  "наркотик",
  "drug",
  "кокаїн",
  "героїн",
  "marijuana",
  "марихуана",
  "підробка",
  "fake passport",
  "фальшив",
  "краден",
  "stolen",
];

export function findForbiddenWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}

export function checkListingContent(title: string, description: string): string | null {
  return findForbiddenWord(title) || findForbiddenWord(description);
}

export const DEFAULT_RULES = `Правила користування маркетплейсом

1. Заборонено продавати
• Зброю, боєприпаси, вибухівку
• Наркотики та ліки без рецепта
• Підроблені товари та документи
• Крадені речі
• Тварин без документів

2. Обов'язки продавця
• Чесний опис товару та фото
• Актуальна ціна
• Відповідь покупцям протягом 24 годин

3. Модерація
• Нові оголошення можуть проходити перевірку перед публікацією
• Адміністратор може приховати або видалити оголошення
• За порушення акаунт може бути заблоковано

4. Скарги
• Якщо бачите заборонений товар — натисніть «Поскаржитися»

5. Контакти
• Питання: support@lokalno.ua`;

export const DEFAULT_PRIVACY = `Політика конфіденційності

Ми зберігаємо ваш email, ім'я та місто для роботи сервісу.
Дані не передаються третім особам без вашої згоди.
Ви можете запросити видалення акаунту через email підтримки.`;
