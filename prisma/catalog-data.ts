const photo = (seed: string) => `https://picsum.photos/seed/lokalno-${seed}/600/600`;

export function listingPhotos(baseSeed: string): string {
  return JSON.stringify(
    Array.from({ length: 10 }, (_, i) => photo(`${baseSeed}-${i + 1}`))
  );
}

type CatalogItem = {
  title: string;
  description: string;
  price: number;
  condition: "NEW" | "GOOD" | "FAIR";
  city: string;
  photo: string;
};

function items(category: string, products: CatalogItem[]) {
  return products.map((p) => ({ ...p, category }));
}

export const CATALOG = [
  ...items("Транспорт", [
    { title: "Toyota Camry 2016", description: "2.0 бензин, автомат, повна комплектація.", price: 485000, condition: "GOOD", city: "Київ", photo: photo("auto-1") },
    { title: "Volkswagen Golf 2018", description: "1.4 TSI, пробіг 98000 км, сервісна книга.", price: 520000, condition: "GOOD", city: "Львів", photo: photo("auto-2") },
    { title: "Honda CBR 600", description: "Мотоцикл, один власник, нові шини.", price: 185000, condition: "GOOD", city: "Одеса", photo: photo("auto-3") },
    { title: "Електросамокат Xiaomi", description: "Pro 2, до 45 км, майже новий.", price: 8900, condition: "GOOD", city: "Харків", photo: photo("auto-4") },
    { title: "Велосипед міський", description: "7 швидкостей, з кошиком і замком.", price: 4200, condition: "GOOD", city: "Дніпро", photo: photo("auto-5") },
    { title: "Skoda Octavia 2015", description: "Дизель, економічна, без ДТП.", price: 395000, condition: "GOOD", city: "Запоріжжя", photo: photo("auto-6") },
    { title: "Причіп легковий", description: "750 кг, документи в порядку.", price: 28000, condition: "GOOD", city: "Вінниця", photo: photo("auto-7") },
    { title: "Ford Transit 2014", description: "Вантажний, 2.2 дизель, для бізнесу.", price: 310000, condition: "FAIR", city: "Полтава", photo: photo("auto-8") },
    { title: "Дитячий велосипед 20\"", description: "З додатковими колесами, як новий.", price: 2800, condition: "GOOD", city: "Чернівці", photo: photo("auto-9") },
    { title: "Запчастини BMW E46", description: "Фари, бампер, оригінал.", price: 6500, condition: "GOOD", city: "Тернопіль", photo: photo("auto-10") },
  ]),
  ...items("Нерухомість", [
    { title: "1-кімнатна квартира", description: "42 м², центр, ремонт, меблі.", price: 1850000, condition: "GOOD", city: "Київ", photo: photo("real-1") },
    { title: "2-кімнатна новобудова", description: "65 м², 12 поверх, без ремонту.", price: 1420000, condition: "NEW", city: "Львів", photo: photo("real-2") },
    { title: "Кімната в гуртожитку", description: "18 м², тихий район, з меблями.", price: 320000, condition: "GOOD", city: "Одеса", photo: photo("real-3") },
    { title: "Будинок 120 м²", description: "6 соток, газ, літня кухня.", price: 2100000, condition: "GOOD", city: "Харків", photo: photo("real-4") },
    { title: "Гараж кооперативний", description: "24 м², центральний в'їзд.", price: 185000, condition: "GOOD", city: "Дніпро", photo: photo("real-5") },
    { title: "Оренда 1-кімнатної", description: "Подобово або довгостроково, центр.", price: 12000, condition: "GOOD", city: "Київ", photo: photo("real-6") },
    { title: "Земельна ділянка 10 соток", description: "Під забудову, комунікації поруч.", price: 280000, condition: "NEW", city: "Вінниця", photo: photo("real-7") },
    { title: "Студія 28 м²", description: "ЖК біля метро, з технікою.", price: 980000, condition: "GOOD", city: "Запоріжжя", photo: photo("real-8") },
    { title: "Комерційне приміщення", description: "80 м², вітрини, під офіс/магазин.", price: 1650000, condition: "GOOD", city: "Полтава", photo: photo("real-9") },
    { title: "Дача з садом", description: "Будиночок, колодязь, фруктові дерева.", price: 450000, condition: "FAIR", city: "Черкаси", photo: photo("real-10") },
  ]),
  ...items("Електроніка", [
    { title: "iPhone 13 128GB", description: "Синій, 86% батареї, без подряпин.", price: 14500, condition: "GOOD", city: "Київ", photo: photo("elek-1") },
    { title: "MacBook Air M1", description: "256GB, 8GB RAM.", price: 28000, condition: "GOOD", city: "Львів", photo: photo("elek-2") },
    { title: "Навушники Sony WH-1000XM4", description: "Шумопоглинання, повний комплект.", price: 6200, condition: "GOOD", city: "Одеса", photo: photo("elek-3") },
    { title: "Планшет Samsung Tab A8", description: "10.5 дюймів, 64GB, з чохлом.", price: 4800, condition: "GOOD", city: "Харків", photo: photo("elek-4") },
    { title: "Камера Canon EOS", description: "Бездзеркальна, з об'єктивом 18-55.", price: 18500, condition: "GOOD", city: "Дніпро", photo: photo("elek-5") },
    { title: "Монітор 27\" Dell", description: "Full HD, IPS.", price: 5200, condition: "GOOD", city: "Запоріжжя", photo: photo("elek-6") },
    { title: "Клавіатура механічна", description: "RGB, перемикачі Blue, нова.", price: 1890, condition: "NEW", city: "Вінниця", photo: photo("elek-7") },
    { title: "Powerbank 20000 mAh", description: "Швидка зарядка, USB-C, новий.", price: 680, condition: "NEW", city: "Полтава", photo: photo("elek-8") },
    { title: "Роутер Wi-Fi 6", description: "TP-Link, dual band.", price: 1100, condition: "GOOD", city: "Черкаси", photo: photo("elek-9") },
    { title: "Smartwatch Apple Watch SE", description: "44mm, GPS, з ремінцем.", price: 6500, condition: "GOOD", city: "Рівне", photo: photo("elek-10") },
  ]),
  ...items("Дім і сад", [
    { title: "Лампа настільна", description: "Мінімалістичний дизайн, працює бездоганно.", price: 420, condition: "GOOD", city: "Київ", photo: photo("dim-1") },
    { title: "Комplect постільної білизни", description: "1.5 спальне, бавовна, новий.", price: 680, condition: "NEW", city: "Львів", photo: photo("dim-2") },
    { title: "Каструля набір Tefal", description: "3 предмети, антипригарне покриття.", price: 1450, condition: "GOOD", city: "Одеса", photo: photo("dim-3") },
    { title: "Килим вовняний", description: "120×180 см, бежевий, чистий.", price: 2200, condition: "GOOD", city: "Дніпро", photo: photo("dim-4") },
    { title: "Садовий інструмент набір", description: "Лопата, граблі, рукавички.", price: 420, condition: "GOOD", city: "Харків", photo: photo("dim-5") },
    { title: "Садові крісла 2 шт", description: "Пластик, зелені, майже нові.", price: 680, condition: "GOOD", city: "Запоріжжя", photo: photo("dim-6") },
    { title: "Газонокосарка Bosch", description: "Електрична, 1200W, працює добре.", price: 3200, condition: "GOOD", city: "Вінниця", photo: photo("dim-7") },
    { title: "Барбекю переносне", description: "На вугілля, з кришкою.", price: 1890, condition: "GOOD", city: "Полтава", photo: photo("dim-8") },
    { title: "Органайзер для кухні", description: "Бамбук, 3 рівні, новий.", price: 340, condition: "NEW", city: "Чернівці", photo: photo("dim-9") },
    { title: "Плед м'який", description: "Великий, сірий, для дивану.", price: 450, condition: "NEW", city: "Тернопіль", photo: photo("dim-10") },
  ]),
  ...items("Одяг і взуття", [
    { title: "Джинси Levi's 501", description: "Класичні джинси, розмір 32/32.", price: 890, condition: "GOOD", city: "Львів", photo: photo("odyag-1") },
    { title: "Зимова куртка North Face", description: "Розмір M, без дефектів.", price: 3200, condition: "GOOD", city: "Київ", photo: photo("odyag-2") },
    { title: "Кросівки Nike Air Max", description: "Розмір 42, легкі подряпини.", price: 2200, condition: "GOOD", city: "Київ", photo: photo("vzuttia-1") },
    { title: "Черевики Timberland", description: "Розмір 43, зимові.", price: 2800, condition: "GOOD", city: "Львів", photo: photo("vzuttia-2") },
    { title: "Сукня літня Zara", description: "Розмір S, ідеальний стан.", price: 650, condition: "GOOD", city: "Одеса", photo: photo("odyag-3") },
    { title: "Кеди Converse", description: "Класичні білі, розмір 41.", price: 890, condition: "GOOD", city: "Дніпро", photo: photo("vzuttia-5") },
    { title: "Піджак класичний", description: "Темно-синій, розмір 50.", price: 1450, condition: "GOOD", city: "Чернівці", photo: photo("odyag-8") },
    { title: "Сумка шкіряна", description: "Коричнева, мінімальні сліди.", price: 4500, condition: "GOOD", city: "Київ", photo: photo("akses-1") },
    { title: "Футболка Nike", description: "Біла, розмір L, нова з біркою.", price: 420, condition: "NEW", city: "Вінниця", photo: photo("odyag-6") },
    { title: "Кросівки Adidas Ultraboost", description: "Розмір 42, для бігу.", price: 1950, condition: "GOOD", city: "Миколаїв", photo: photo("vzuttia-8") },
  ]),
  ...items("Для дітей", [
    { title: "Дитячий комбінезон", description: "На 6-9 місяців, зимовий, теплий.", price: 350, condition: "GOOD", city: "Одеса", photo: photo("dyti-1") },
    { title: "Коляска прогулянкова", description: "Легка, складається.", price: 3200, condition: "GOOD", city: "Київ", photo: photo("dyti-2") },
    { title: "Конструктор LEGO", description: "Набір City, 400 деталей, повний.", price: 890, condition: "GOOD", city: "Львів", photo: photo("dyti-3") },
    { title: "Велосипед дитячий", description: "16 дюймів, з додатковими колесами.", price: 2800, condition: "GOOD", city: "Харків", photo: photo("dyti-4") },
    { title: "Ліжечко дитяче", description: "Біле, з матрацом, до 3 років.", price: 4500, condition: "GOOD", city: "Дніпро", photo: photo("dyti-5") },
    { title: "М'який ведмедик", description: "Великий, чистий, як новий.", price: 180, condition: "GOOD", city: "Вінниця", photo: photo("dyti-6") },
    { title: "Одяг для немовляти набір", description: "5 речей, 0-3 місяці, новий.", price: 420, condition: "NEW", city: "Полтава", photo: photo("dyti-7") },
    { title: "Стілець для годування", description: "Складний, з столиком.", price: 980, condition: "GOOD", city: "Запоріжжя", photo: photo("dyti-8") },
    { title: "Книжки дитячі набір", description: "10 книжок українською, 3-6 років.", price: 320, condition: "GOOD", city: "Суми", photo: photo("dyti-9") },
    { title: "Автокрісло дитяче", description: "Група 1-2-3, ISOFIX.", price: 3500, condition: "GOOD", city: "Миколаїв", photo: photo("dyti-10") },
  ]),
  ...items("Спорт і відпочинок", [
    { title: "Велосипед горний", description: "21 швидкість, рама 19\".", price: 8500, condition: "GOOD", city: "Київ", photo: photo("sport-1") },
    { title: "Гантелі 2×10 кг", description: "Регульовані, з хватами.", price: 1200, condition: "GOOD", city: "Львів", photo: photo("sport-2") },
    { title: "Коврик для йоги", description: "6 мм, антиковзкий, новий.", price: 380, condition: "NEW", city: "Одеса", photo: photo("sport-3") },
    { title: "Роликові ковзани", description: "Розмір 41, з захистом.", price: 1450, condition: "GOOD", city: "Харків", photo: photo("sport-4") },
    { title: "М'яч футбольний Adidas", description: "Розмір 5, новий.", price: 520, condition: "NEW", city: "Дніпро", photo: photo("sport-5") },
    { title: "Палатка туристична", description: "2-місна, водонепроникна.", price: 2200, condition: "GOOD", city: "Івано-Франківськ", photo: photo("sport-8") },
    { title: "Тенісна ракетка Wilson", description: "З чохлом і м'ячами.", price: 1680, condition: "GOOD", city: "Вінниця", photo: photo("sport-7") },
    { title: "Фітнес-резинки набір", description: "Для домашніх тренувань, новий.", price: 290, condition: "NEW", city: "Тернопіль", photo: photo("sport-9") },
    { title: "Лижі гірські", description: "170 см, з кріпленнями.", price: 4500, condition: "GOOD", city: "Ужгород", photo: photo("sport-10") },
    { title: "Спортивний костюм Nike", description: "Розмір M, для тренувань.", price: 980, condition: "GOOD", city: "Запоріжжя", photo: photo("sport-6") },
  ]),
  ...items("Краса і здоров'я", [
    { title: "Годинник Casio", description: "Класичний, працює ідеально.", price: 890, condition: "GOOD", city: "Львів", photo: photo("akses-2") },
    { title: "Окуляри сонцезахисні", description: "Aviator, з чохлом.", price: 1200, condition: "GOOD", city: "Харків", photo: photo("akses-4") },
    { title: "Біжутерія набір", description: "Сережки та кольє, нові.", price: 450, condition: "NEW", city: "Вінниця", photo: photo("akses-6") },
    { title: "Масажний пістолет", description: "5 насадок, 3 режими, новий.", price: 890, condition: "NEW", city: "Вінниця", photo: photo("inshe-6") },
    { title: "Фен Dyson Supersonic", description: "Оригінал, повний комплект.", price: 8900, condition: "GOOD", city: "Київ", photo: photo("beauty-1") },
    { title: "Набір косметики", description: "Догляд за обличчям, новий.", price: 680, condition: "NEW", city: "Одеса", photo: photo("beauty-2") },
    { title: "Електрична зубна щітка", description: "Oral-B, 2 насадки.", price: 920, condition: "GOOD", city: "Львів", photo: photo("beauty-3") },
    { title: "Тонометр автоматичний", description: "Omron, для дому.", price: 1100, condition: "NEW", city: "Дніпро", photo: photo("beauty-4") },
    { title: "Парфум 100 мл", description: "Новий, запечатаний.", price: 1450, condition: "NEW", city: "Київ", photo: photo("beauty-5") },
    { title: "Шовковий палантин", description: "Блакитний, для вечірок.", price: 560, condition: "GOOD", city: "Житомир", photo: photo("akses-9") },
  ]),
  ...items("Послуги", [
    { title: "Ремонт iPhone", description: "Заміна екрана, батареї, діагностика.", price: 800, condition: "NEW", city: "Київ", photo: photo("serv-1") },
    { title: "Кур'єрська доставка", description: "По місту, швидко та надійно.", price: 150, condition: "NEW", city: "Львів", photo: photo("serv-2") },
    { title: "Прибирання квартири", description: "Генеральне, з миючими засобами.", price: 1200, condition: "NEW", city: "Одеса", photo: photo("serv-3") },
    { title: "Репетитор англійської", description: "Онлайн або офлайн, досвід 5 років.", price: 350, condition: "NEW", city: "Харків", photo: photo("serv-4") },
    { title: "Фотограф на захід", description: "Весілля, дні народження, портрети.", price: 2500, condition: "NEW", city: "Київ", photo: photo("serv-5") },
    { title: "Переклад документів", description: "UA-EN, нотаріальне засвідчення.", price: 400, condition: "NEW", city: "Дніпро", photo: photo("serv-6") },
    { title: "Комп'ютерна допомога", description: "Налаштування Windows, Wi-Fi, принтер.", price: 500, condition: "NEW", city: "Запоріжжя", photo: photo("serv-7") },
    { title: "Манікюр на дому", description: "Гель-лак, зняття, дизайн.", price: 450, condition: "NEW", city: "Вінниця", photo: photo("serv-8") },
    { title: "Вантажники", description: "Переїзд, підйом меблів, 2 години.", price: 800, condition: "NEW", city: "Полтава", photo: photo("serv-9") },
    { title: "Ремонт взуття", description: "Підошва, міна блискавок, чистка.", price: 250, condition: "NEW", city: "Черкаси", photo: photo("serv-10") },
  ]),
  ...items("Тварини", [
    { title: "Кошеня британець", description: "3 місяці, документи, привитий.", price: 4500, condition: "NEW", city: "Київ", photo: photo("pet-1") },
    { title: "Цуценя лабрадор", description: "2 місяці, з ветпаспортом.", price: 8500, condition: "NEW", city: "Львів", photo: photo("pet-2") },
    { title: "Акварium 60 літрів", description: "З фільтром і освітленням.", price: 2800, condition: "GOOD", city: "Дніпро", photo: photo("inshe-5") },
    { title: "Клітка для птахів", description: "Велика, з аксесуарами.", price: 890, condition: "GOOD", city: "Одеса", photo: photo("pet-3") },
    { title: "Корм для собак 15 кг", description: "Premium, новий мішок.", price: 1200, condition: "NEW", city: "Харків", photo: photo("pet-4") },
    { title: "Будиночок для кота", description: "З когтеточкою, висота 120 см.", price: 1450, condition: "GOOD", city: "Київ", photo: photo("pet-5") },
    { title: "Попугай хвилястий", description: "Ручний, з кліткою.", price: 1800, condition: "GOOD", city: "Вінниця", photo: photo("pet-6") },
    { title: "Нашийник GPS для собак", description: "Трекер, новий.", price: 2200, condition: "NEW", city: "Запоріжжя", photo: photo("pet-7") },
    { title: "Акваріумні рибки набір", description: "5 рибок + їжа на місяць.", price: 650, condition: "GOOD", city: "Полтава", photo: photo("pet-8") },
    { title: "Переноска для тварин", description: "Для котів/собак до 8 кг.", price: 480, condition: "GOOD", city: "Чернівці", photo: photo("pet-9") },
  ]),
  ...items("Хобі та розваги", [
    { title: "Гітара акустична", description: "Yamaha, з чохлом.", price: 3200, condition: "GOOD", city: "Київ", photo: photo("inshe-1") },
    { title: "Настільна гра Monopoly", description: "Українська версія, повний комплект.", price: 650, condition: "GOOD", city: "Одеса", photo: photo("inshe-3") },
    { title: "Книги художня література", description: "Набір 8 книг українською, нові.", price: 480, condition: "NEW", city: "Львів", photo: photo("inshe-2") },
    { title: "Картина на полотні", description: "Абстракція, 50×70 см.", price: 750, condition: "GOOD", city: "Полтава", photo: photo("inshe-7") },
    { title: "PlayStation 5", description: "Disc Edition, 2 геймпади.", price: 16500, condition: "GOOD", city: "Київ", photo: photo("hobby-1") },
    { title: "Набір для малювання", description: "Олія, полотна, пензлі.", price: 890, condition: "NEW", city: "Львів", photo: photo("hobby-2") },
    { title: "Синтезатор Yamaha", description: "61 клавіша, для навчання.", price: 5200, condition: "GOOD", city: "Харків", photo: photo("hobby-3") },
    { title: "Пазли 2000 деталей", description: "Новий, запечатаний.", price: 380, condition: "NEW", city: "Одеса", photo: photo("hobby-4") },
    { title: "Набір для в'язання", description: "Пряжа, спиці, інструкція.", price: 420, condition: "NEW", city: "Дніпро", photo: photo("hobby-5") },
    { title: "Колекційні монети", description: "Набір 10 монет України.", price: 1100, condition: "GOOD", city: "Київ", photo: photo("hobby-6") },
  ]),
  ...items("Інше", [
    { title: "Блендер Bosch", description: "800W, 1.5 л, працює відмінно.", price: 920, condition: "GOOD", city: "Чернівці", photo: photo("inshe-9") },
    { title: "Термос Stanley 1 л", description: "Тримає тепло 12 год, новий.", price: 1100, condition: "NEW", city: "Луцьк", photo: photo("inshe-10") },
    { title: "Рюкзак міський", description: "15 дюймів ноутбук, чорний.", price: 920, condition: "GOOD", city: "Черкаси", photo: photo("akses-8") },
    { title: "Гаманець шкіряний", description: "Компактний, коричневий, новий.", price: 380, condition: "NEW", city: "Полтава", photo: photo("akses-7") },
    { title: "Парасолька автомат", description: "Компактна, вітrostійка, нова.", price: 290, condition: "NEW", city: "Луцьк", photo: photo("akses-10") },
    { title: "Ремінь шкіряний", description: "Чоловічий, чорний, новий.", price: 340, condition: "NEW", city: "Одеса", photo: photo("akses-3") },
    { title: "Шапка в'язана", description: "Тепла шапка, сіра.", price: 220, condition: "NEW", city: "Дніпро", photo: photo("akses-5") },
    { title: "Мікрохвильова піч", description: "20 л, 800W, працює відмінно.", price: 1100, condition: "GOOD", city: "Вінниця", photo: photo("dim-7") },
    { title: "Дзеркало настінне", description: "Овальне, 60×40 см.", price: 520, condition: "GOOD", city: "Полтава", photo: photo("dim-8") },
    { title: "Ваза керамічна", description: "Ручна робота, блакитна, 30 см.", price: 380, condition: "NEW", city: "Харків", photo: photo("dim-4") },
  ]),
];

export const CATALOG_COUNT = CATALOG.length;
