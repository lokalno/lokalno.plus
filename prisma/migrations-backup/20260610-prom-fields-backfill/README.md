# ETAP 2: Prom fields backfill plan (2026-06-10)

**Статус:** PLAN ONLY — SQL не виконувати до окремого підтвердження.

## Мета

Заповнити legacy-поля Prom у існуючих `Listing` **без DELETE**, лише `UPDATE`:

1. `promSku` ← `itemLocation` (де це Prom-артикул)
2. `promImportKey` ← обчислення з `promUniqueId` / `promProductId` / `promSku` (пріоритет як у `buildPromImportKey`)
3. Підготувати dedup v179a до re-import без нових дублікатів

**Не входить у ETAP 2:** `promColor`, `promSize`, `promVariantGroupId`, `promCharacteristics` — це ETAP 3.

---

## Backup plan (перед будь-яким UPDATE на production)

### 1. Повний snapshot БД (обовʼязково)

| Крок | Дія |
|------|-----|
| 1 | Neon Console → Project → **Branches** → create backup branch або snapshot |
| 2 | Або `pg_dump` повної БД у файл з датою: `lokalno-backup-YYYYMMDD-HHMM.sql` |
| 3 | Зберегти dump поза Vercel (локально / cloud storage) |

### 2. Табличний backup цільових рядків (рекомендовано)

Перед UPDATE виконати **лише на staging або після підтвердження**:

```sql
-- Файл: pre-backfill-listing-prom-fields.sql (опційно, не в upgrade.sql)
CREATE TABLE IF NOT EXISTS "ListingPromBackfillBackup20260610" AS
SELECT
  id,
  "sellerId",
  "itemLocation",
  "promImportKey",
  "promUniqueId",
  "promProductId",
  "promSku",
  photos,
  status,
  "createdAt",
  now() AS backed_up_at
FROM "Listing"
WHERE "promSku" IS NULL
  AND "itemLocation" IS NOT NULL
  AND trim("itemLocation") <> ''
  AND trim("itemLocation") <> 'Prom'
  AND photos LIKE '%images.prom.ua%';
```

### 3. Pre-flight COUNT (оцінка scope)

Запустити `estimate.sql` на read-only replica або staging — **не на prod без підтвердження**.

### 4. Rollback-готовність

- Тримати `rollback.sql` під рукою
- Не запускати backfill у години пікової модерації
- Після backfill: перевірити unique index conflicts (`verify.sql`)

---

## Оцінка кількості записів (production, стан на діагностику 2026-06-10)

Джерело: admin `/admin/listings?status=pending`, API `/api/listings/{id}`, ETAP 1.

| Метрика | Значення |
|---------|----------|
| PENDING всього | **505** |
| Можливі дублікати | **142** у **71** групі |
| Prom-поля в legacy | `promImportKey`, `promSku`, `promProductId`, `promUniqueId` = **null** |
| SKU видно в | `itemLocation` (`Kuz - 004`, `SL029`, …) |
| Фото | `images.prom.ua` |

### Очікувані COUNT після `estimate.sql`

| Категорія | Оцінка | Примітка |
|-----------|--------|----------|
| **A. Кандидати на backfill `promSku`** | **~500–505** | PENDING + prom photo + itemLocation ≠ `Prom` |
| **B. Унікальні (sellerId + SKU)** | **~250–360** | 505 мінус ~71–142 «зайвих» копій |
| **C. Отримають `promImportKey`** | **~250–360** | лише **найстаріший** запис на seller+SKU (unique index) |
| **D. Лишаться без `promImportKey`** | **~140–250** | дублікати-друга копія; legacy bridge ETAP 1 все одно знайде по `itemLocation` |
| **E. ACTIVE / інші статуси** | **0–20** | на головній ~15+ ACTIVE; частина може теж бути prom legacy |

> Точні числа — тільки після `estimate.sql` на реальній БД. Оцінка консервативна.

### Ризик unique index

Індекс `(sellerId, promImportKey) WHERE promImportKey IS NOT NULL` **забороняє** два однакові ключі.

Якщо backfill `promImportKey` на **обидві** копії `Kuz - 004` → **помилка unique violation**.

**Рішення в SQL plan:** `promImportKey` ставимо **тільки на найстаріший** listing per `(sellerId, lower(trim(promSku)))`.

---

## Порядок застосування (коли буде дозволено)

1. Backup (§ вище)
2. `estimate.sql` — зафіксувати COUNT
3. `upgrade.sql` крок 1 — `promSku`
4. `upgrade.sql` крок 2 — `promImportKey` (oldest only)
5. `verify.sql` — conflicts = 0
6. Re-import тест на staging: **Оновлено N, Створено 0**

---

## Що НЕ робимо

- ❌ DELETE
- ❌ зміна `status` / moderation
- ❌ auto cleanup дублікатів
- ❌ execute на production без окремого OK

## ETAP 3 (наступний)

Нові колонки + парсинг Prom characteristics — окремий `migrations-backup/202606XX-prom-attributes/`.
