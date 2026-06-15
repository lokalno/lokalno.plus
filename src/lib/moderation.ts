/** Товари, продаж яких заборонено законодавством України та правилами маркетплейсу. */
export const PROHIBITED_SALE_CATEGORIES = [
  "Сигарети та тютюнові вироби",
  "Алкогольні напої",
  "Наркотичні та психотропні речовини",
  "Зброя, боєприпаси та вибухові речовини",
  "Лікарські засоби",
  "Інші товари, продаж яких заборонений законодавством України",
] as const;

export const FORBIDDEN_WORDS = [
  // Зброя, боєприпаси, вибухівка
  "зброя",
  "зброї",
  "зброєю",
  "weapon",
  "weapons",
  "gun",
  "guns",
  "пістолет",
  "гвинтівка",
  "гвинтівку",
  "автомат калашникова",
  "ак-47",
  "ак47",
  "калашников",
  "рушниця",
  "рушницю",
  "shotgun",
  "rifle",
  "боєприпас",
  "боєприпаси",
  "ammunition",
  "ammo",
  "патрони",
  "патрон",
  "набої",
  "набій",
  "вибухівк",
  "вибухівка",
  "explosive",
  "explosives",
  "граната",
  "гранату",
  "grenade",
  "динаміт",
  "dynamite",
  "тротил",
  "тнт",
  "tnt",
  "кастет",
  "травмат",
  "пневматична зброя",
  "пневмат",
  "арбалет",
  "ножівка",
  "балісонг",
  "switchblade",

  // Наркотики та психотропи
  "наркотик",
  "наркотики",
  "наркотичн",
  "drug",
  "drugs",
  "кокаїн",
  "кокаин",
  "cocaine",
  "героїн",
  "героин",
  "heroin",
  "марихуана",
  "marijuana",
  "cannabis",
  "канабіс",
  "каннабис",
  "гашиш",
  "hashish",
  "амфетамін",
  "амфетамин",
  "amphetamine",
  "метамфетамін",
  "methamphetamine",
  "mdma",
  "екстазі",
  "ecstasy",
  "lsd",
  "опіум",
  "опиум",
  "opium",
  "фентаніл",
  "fentanyl",
  "психотроп",
  "spice",
  "спайс",
  "мефедрон",
  "mephedrone",

  // Сигарети та тютюн
  "сигарет",
  "сигарета",
  "сигарети",
  "cigarette",
  "cigarettes",
  "сигарил",
  "cigarillo",
  "тютюн",
  "тютюнов",
  "tobacco",
  "нікотин",
  "nicotine",
  "кальян",
  "hookah",
  "вейп",
  "vape",
  "вейпінг",
  "vaping",
  "iqos",
  "айкос",
  "glo",
  "гло",
  "стіки",
  "heets",
  "снюс",
  "snus",

  // Алкоголь
  "алкоголь",
  "алкогольн",
  "alcohol",
  "alcoholic",
  "горілка",
  "горилка",
  "vodka",
  "віскі",
  "whisky",
  "whiskey",
  "пиво",
  "beer",
  "вино",
  "wine",
  "шампанськ",
  "champagne",
  "коньяк",
  "cognac",
  "лікер",
  "liqueur",
  "текіла",
  "tequila",
  "ром",
  "rum",
  "самогон",
  "настоянка",
  "джин",
  "gin",
  "абсент",
  "absinthe",

  // Лікарські засоби
  "лікарськ",
  "ліки",
  "medicine",
  "medicines",
  "медикамент",
  "medication",
  "pharmaceutical",
  "антибіотик",
  "antibiotic",
  "рецептурн",
  "інсулін",
  "insulin",

  // Інше заборонене
  "підробка",
  "fake passport",
  "фальшив",
  "краден",
  "stolen",
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesForbiddenWord(text: string, word: string): boolean {
  const lower = text.toLowerCase();
  const w = word.toLowerCase();

  if (/^[a-zа-яіїєґ0-9-]+$/i.test(word)) {
    const re = new RegExp(`(?:^|[^a-zа-яіїєґ0-9-])${escapeRegex(w)}(?:[^a-zа-яіїєґ0-9-]|$)`, "i");
    return re.test(lower);
  }

  return lower.includes(w);
}

export function findForbiddenWord(text: string): string | null {
  for (const word of FORBIDDEN_WORDS) {
    if (matchesForbiddenWord(text, word)) {
      return word;
    }
  }
  return null;
}

export function checkListingContent(title: string, description: string): string | null {
  return findForbiddenWord(title) || findForbiddenWord(description);
}

/** Сервіс лише розміщує оголошення — не є стороною угоди між покупцем і продавцем. */
export const PLATFORM_DISCLAIMER =
  "lokalno.plus — це платформа для розміщення оголошень. Сервіс не є стороною угоди між покупцем і продавцем. Усі домовленості, оплата, доставка та якість товару — відповідальність покупця й продавця.";

export const DEFAULT_RULES = `Правила користування маркетплейсом

ВАЖЛИВО
${PLATFORM_DISCLAIMER}

1. Заборонено продавати
• Сигарети та тютюнові вироби (у т.ч. електронні сигарети, вейпи, кальяни)
• Алкогольні напої
• Наркотичні та психотропні речовини
• Зброю, боєприпаси та вибухові речовини
• Лікарські засоби
• Підроблені товари та документи
• Крадені речі
• Тварин без документів
• Будь-які інші товари, продаж яких заборонений законодавством України

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

export { DEFAULT_PRIVACY, LEGACY_PRIVACY_SNIPPET, resolvePrivacyContent } from "@/lib/privacy-policy";
