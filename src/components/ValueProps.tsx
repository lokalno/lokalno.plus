const ITEMS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Безпечно",
    text: "Перевірені продавці та відгуки",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Локально",
    text: "Товари поруч з вами у вашому місті",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Швидко",
    text: "Нові оголошення щодня",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Без комісії",
    text: "Без зайвих витрат",
  },
];

export default function ValueProps() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-t border-gray-100 pt-5 mt-2">
      {ITEMS.map((item) => (
        <div
          key={item.title}
          className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm"
        >
          <span className="shrink-0 w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            {item.icon}
          </span>
          <div>
            <p className="font-semibold text-sm text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
