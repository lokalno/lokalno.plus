const STEPS = [
  {
    icon: "🔍",
    title: "Знайдіть товар",
    text: "Переглядайте оголошення у своєму місті або по всій Україні.",
  },
  {
    icon: "💬",
    title: "Домовтесь з продавцем",
    text: "Напишіть у чат, запропонуйте ціну або оформіть замовлення.",
  },
  {
    icon: "📦",
    title: "Отримайте товар",
    text: "Самовивіз або доставка Nova Poshta — як зручніше вам.",
  },
] as const;

export default function HomeHowItWorks() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-bold text-gray-900">Як це працює</h2>
      <p className="mt-1 text-xs text-gray-500">Три кроки до покупки на lokalno.plus</p>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm"
              aria-hidden
            >
              {step.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                {index + 1}. {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
