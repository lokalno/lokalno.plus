# Публікація сайту в інтернет

## Vercel + Supabase (рекомендовано)

1. PostgreSQL на [supabase.com](https://supabase.com)
2. Змініть `provider` у `prisma/schema.prisma` на `postgresql`
3. Деплой на [vercel.com](https://vercel.com) з змінними `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
4. `npx prisma db push && npm run db:seed`

## Домен .ua

Купіть на [nic.ua](https://nic.ua), налаштуйте DNS на Vercel.

## Далі

- Cloudinary для фото в production
- LiqPay для оплати
- API Нова Пошта для доставки
- ФОП + політика конфіденційності + оферта
