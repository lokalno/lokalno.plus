import { formatPrice } from "@/lib/utils";
import {
  NOVA_POSHTA_CASH_DELIVERY,
  NOVA_POSHTA_MAIN,
  NOVA_POSHTA_PERSONAL_CABINET,
  NOVA_POST_BRAND,
} from "@/lib/nova-poshta-links";

type NovaPoshtaSellerGuideProps = {
  codAmount?: number;
  compact?: boolean;
};

export default function NovaPoshtaSellerGuide({ codAmount, compact = false }: NovaPoshtaSellerGuideProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50/80 text-amber-950 ${
        compact ? "p-3 text-xs" : "p-4 text-sm"
      }`}
    >
      <p className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>
        📦 Як відправити через Nova Poshta
      </p>
      <p className={`mt-1 leading-relaxed text-amber-900/90 ${compact ? "text-xs" : "text-sm"}`}>
        Оплата на сайті не використовується. Покупець платить{" "}
        <strong>на відділенні при отриманні</strong>. Оформіть посилку з{" "}
        <strong>контролем оплати / післяплатою</strong> у кабінеті Nova Poshta.
        {codAmount != null && codAmount > 0 && (
          <>
            {" "}
            Сума для покупця: <strong>{formatPrice(codAmount)}</strong>.
          </>
        )}
      </p>

      <ol className={`mt-3 list-decimal space-y-2 pl-5 ${compact ? "text-xs" : "text-sm"}`}>
        <li>
          Увійдіть у{" "}
          <a
            href={NOVA_POSHTA_PERSONAL_CABINET}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            My Nova Post
          </a>{" "}
          (my.novapost.com) — кабінет для відправлення посилок.
        </li>
        <li>
          Якщо ще немає договору післяплати —{" "}
          <a
            href={NOVA_POSHTA_CASH_DELIVERY}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            підключіть договір післяплати
          </a>{" "}
          (ФОП можна через застосунок NovaPay).
        </li>
        <li>
          Створіть відправлення з адресою покупця з замовлення та увімкніть{" "}
          <strong>«Контроль оплати»</strong> на суму замовлення.
        </li>
        <li>
          Роздрукуйте етикетку або покажіть QR — кнопка «Етикетка NP» у замовленні містить
          дані отримувача.
        </li>
        <li>
          Після відправки вкажіть <strong>номер ТТН</strong> нижче — покупець отримає
          сповіщення.
        </li>
        <li>
          Гроші надійдуть на ваш рахунок Nova Poshta / NovaPay після того, як покупець забере
          посилку та оплатить на відділенні.
        </li>
      </ol>

      <p className={`mt-3 text-amber-800/80 ${compact ? "text-[11px]" : "text-xs"}`}>
        Довідка:{" "}
        <a href={NOVA_POSHTA_CASH_DELIVERY} target="_blank" rel="noopener noreferrer" className="underline">
          Договір післяплати
        </a>
        {" · "}
        <a href={NOVA_POSHTA_MAIN} target="_blank" rel="noopener noreferrer" className="underline">
          {NOVA_POST_BRAND}
        </a>
      </p>
    </div>
  );
}
