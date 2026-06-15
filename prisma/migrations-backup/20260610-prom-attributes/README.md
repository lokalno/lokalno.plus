# ETAP 3: Prom attributes — schema + import parsing (PLAN ONLY)

**Статус:** PLAN ONLY — `schema.prisma`, import code, UI **ще не змінювались**.  
SQL / migrate / deploy **не виконувати** до окремого підтвердження.

## Мета

Зберігати Prom-атрибути окремо від checkout `variants` / `itemSize`:

| Поле | Тип | Джерело Prom Excel |
|------|-----|-------------------|
| `promColor` | `TEXT?` | характеристика «Колір» / «Color» |
| `promSize` | `TEXT?` | «Розмір», «Розмір одягу», «Size» |
| `promVariantGroupId` | `TEXT?` | `ID_групи_різновидів` |
| `promCharacteristics` | `JSONB?` | усі triplets Назва / Одиниця / Значення |

Записувати при **CREATE** і **UPDATE** (re-import через ETAP 1 upsert).  
**Не чіпати:** `variants`, `itemSize`, `status`, moderation, admin.

---

## Архітектура: Prom vs Lokalno variants

```
Prom import row
├── promColor, promSize, promCharacteristics  → нові колонки (інформаційні + dedup hints)
├── promVariantGroupId                        → група різновидів Prom
└── variants / itemSize                       → НЕ заповнюємо автоматично з Prom
    └── лишаються для ручного checkout UI (ListingForm)
```

**Чому не мапимо Prom → `variants`:**  
Prom «різновид» = окремий рядок Excel з унікальним `Унікальний_ідентифікатор`.  
Lokalno `variants` = color×size matrix для одного listing + checkout.  
Автоматичне злиття зламає існуючий checkout.

---

## План парсингу Excel

### 1. Колонки з фіксованими заголовками

```typescript
promVariantGroupId: ["ID_групи_різновидів"]
```

### 2. Повторювані блоки характеристик

Prom export має кілька наборів:

- `Назва_Характеристики` / `Назва_Характеристики_2` / …
- `Одиниця_виміру_Характеристики` (опційно)
- `Значення_Характеристики`

**Алгоритм** (`parsePromCharacteristics(row, headers)`):

1. Знайти всі ключі `^Назва_Характеристики(_\d+)?$`
2. Для кожного — знайти парний `Значення_Характеристики(_N)?`
3. Зібрати `{ name, unit?, value }[]` → JSON у `promCharacteristics`
4. Витягнути canonical:
   - `promColor` ← name matches `/колір|color/i`
   - `promSize` ← name matches `/розмір|size|розмір одягу/i`

### 3. Розширення типів

```typescript
// PromImportRow +
promColor: string | null;
promSize: string | null;
promVariantGroupId: string | null;
promCharacteristics: PromCharacteristic[] | null; // Prisma Json / PostgreSQL JSONB
```

### 4. Запис у БД (`prom-import-service.ts`)

Додати до `listingPayload` + `ValidatedPromListing`:

```typescript
promColor, promSize, promVariantGroupId,
promCharacteristics: characteristics.length ? characteristics : null
```

Upsert ETAP 1 — ті самі поля в UPDATE (status не чіпаємо).

---

## Файли для змін (після підтвердження)

| Файл | Зміна |
|------|-------|
| `prisma/schema.prisma` | +4 nullable поля |
| `src/lib/prom-import.ts` | parse characteristics, extend `PromImportRow` |
| `src/lib/prom-import-characteristics.ts` | **NEW** — pure parse helpers + tests |
| `src/lib/prom-import-service.ts` | payload + validated type |
| `src/lib/prom-listing-specs.ts` | **NEW** — merge prom specs для UI |
| `src/app/listings/[id]/page.tsx` | показ у `ListingCharacteristics` |
| `src/app/admin/listings/page.tsx` | опційно: Prom колір/розмір у meta (read-only) |

**Не змінюємо:** `admin-listing-duplicates.ts`, moderation, `ListingForm`, `listing-variants.ts`.

---

## UI: як показати в listing

### Публічна сторінка `/listings/[id]`

Блок **«Характеристики»** (`ListingCharacteristics`) — доповнити **після** існуючих полів, **без дублікатів**:

| Label | Джерело | Умова показу |
|-------|---------|--------------|
| Колір (Prom) | `promColor` | якщо є і немає `usesVariants` |
| Розмір (Prom) | `promSize` | якщо є і немає `itemSize` / `usesVariants` |
| Група різновидів Prom | `promVariantGroupId` | тільки owner/admin (опційно) |
| Інші Prom-характеристики | `promCharacteristics` JSONB | name → label, value → value |

**Порядок пріоритету розміру/кольору на UI:**

1. Якщо `usesVariants` → показуємо «Кольори» з `variants` (як зараз)
2. Інакше якщо `itemSize` → «Розмір» з itemSize (як зараз)
3. Інакше fallback на `promColor` / `promSize`

Додаткові характеристики з JSON (наприклад «Матеріал», «Сезон») — окремі рядки в grid.

### Admin `/admin/listings`

У meta-рядку поруч з `Prom: {promImportKey}`:

```
· Prom колір: сірий · Prom розмір: XS-XXL · група: 12345
```

Без змін workflow approve/delete.

---

## Порядок rollout (після підтвердження plan)

1. `upgrade.sql` на staging (additive columns)
2. `prisma db push` / sync schema
3. Code: parser + service + unit tests
4. UI: listing characteristics
5. Re-import тест → поля заповнюються
6. ETAP 2 backfill (окремо, якщо ще не робили) — characteristics лише з re-import

---

## Обмеження

- ❌ DELETE / auto cleanup
- ❌ зміна moderation / status logic
- ❌ auto-fill `variants` from Prom
- ❌ production SQL execute (до OK)
- ❌ deploy (до OK)

## ETAP 4 (наступний)

UX confirm при re-import COMPLETED file.
