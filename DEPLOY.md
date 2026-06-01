# Публікація lokalno.plus

## 1. База даних Neon (безкоштовно)

1. Відкрийте [neon.tech](https://neon.tech) → **Sign up** (можна через GitHub).
2. **New Project** → назва `lokalno-plus` → регіон **EU (Frankfurt)**.
3. Скопіюйте **Connection string** (PostgreSQL), виглядає так:
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

## 2. Vercel

1. [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub** (акаунт **lokalno**).
2. **Add New → Project** → репозиторій **lokalno/lokalno.plus** → **Import**.
3. **Environment Variables** (додати для Production, Preview, Development):

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | рядок з Neon (pooled, для застосунку) |
   | `DATABASE_URL_UNPOOLED` | direct connection з Neon (для `prisma db push`) |
   | `NEXTAUTH_SECRET` | довгий випадковий рядок (32+ символів) |
   | `NEXTAUTH_URL` | `https://lokalno.plus` |

4. **Deploy** — зачекайте 2–5 хвилин.

## 3. Заповнити базу (один раз)

Після успішного деплою, локально в папці проєкту (з `.env` де `DATABASE_URL` = Neon):

```bash
npx prisma db seed
```

Або в Neon **SQL Editor** — якщо seed не запускається, напишіть у чат.

**Тестові акаунти після seed:**
- admin: `admin@lokalno.ua` / `admin123`
- seller: `seller1@lokalno.ua` / `seller1234`

## 4. Домен lokalno.plus (nic.ua)

1. Vercel → проєкт → **Settings → Domains** → додати `lokalno.plus` і `www.lokalno.plus`.
2. На **nic.ua** → DNS для `lokalno.plus`:

   | Тип | Ім'я | Значення |
   |-----|------|----------|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

3. Зачекайте 15 хв – 24 год (зазвичай ~1 год).

## 5. Обмеження production

- Фото зберігаються через `/api/upload` (Vercel Blob або вбудовано в базу).
- Рекомендовано: Vercel → **Storage → Blob** → Create → Connect to project (додає `BLOB_READ_WRITE_TOKEN`).
- Після змін у `prisma/schema.prisma` один раз локально (з `.env` де є обидва `DATABASE_URL` і `DATABASE_URL_UNPOOLED`):

```bash
npx prisma db push
```

## Далі

- Cloudinary для фото
- LiqPay для оплати
- API Нова Пошта
