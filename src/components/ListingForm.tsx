"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  LISTING_TITLE_MAX,
  MAX_LISTING_PHOTOS,
  LISTING_PHOTO_MAX_BYTES,
  LISTING_PHOTO_MAX_WIDTH,
  formatListingCategory,
  getCategoryDetailConfig,
  listCategoryDetailItems,
  listCategoryDetails,
  parseListingCategory,
} from "@/lib/constants";
import { getListingFormProgress, getRecommendedPriceRange } from "@/lib/listing-form-progress";
import { validateListingStock, validateListingStockForCreate } from "@/lib/listing-stock";
import {
  CAR_BODY_TYPES,
  CAR_BRANDS,
  CAR_FUEL_TYPES,
  CAR_TRANSMISSIONS,
  MOTO_BRANDS,
  MOTO_FUEL_TYPES,
  MOTO_TYPES,
  TRUCK_BRANDS,
  TRUCK_FUEL_TYPES,
  TRUCK_TYPES,
  isCarListingCategory,
  isMotoListingCategory,
  isTruckListingCategory,
  tonsToKg,
} from "@/lib/vehicle";
import {
  AGRI_BRANDS,
  AGRI_TYPES,
  isAgriListingCategory,
} from "@/lib/agri";
import {
  PART_FOR_VEHICLES,
  PART_POPULAR,
  PART_TYPES,
  PART_BRANDS,
  isPartsListingCategory,
} from "@/lib/parts";
import { getListingPhotosPayloadSize, validateListingPhotos } from "@/lib/listing-photos";
import { uploadPhotoFile } from "@/lib/upload-photo";
import SettlementSearch from "@/components/SettlementSearch";
import ListingCreatePreview from "@/components/ListingCreatePreview";
import ClothingSizeFields, { getInitialChildSizeMode } from "@/components/ClothingSizeFields";
import PlatformDisclaimerNotice from "@/components/PlatformDisclaimerNotice";
import ProhibitedGoodsNotice from "@/components/ProhibitedGoodsNotice";
import { getClothingSizeKind, getListingConditions } from "@/lib/clothing-sizes";
import { checkListingContent } from "@/lib/moderation";
import ListingVariantsEditor from "@/components/ListingVariantsEditor";
import {
  isClothingVariantsCategory,
  parseListingVariants,
  sumVariantStock,
  validateListingVariants,
  type ListingVariant,
} from "@/lib/listing-variants";

const DRAFT_STORAGE_KEY = "lokalno-listing-draft";
const DESCRIPTION_MAX = 1000;

type ListingFormProps = {
  variant?: "create" | "edit";
  initial?: {
    id?: string;
    title: string;
    description: string;
    price: number;
    category: string;
    brand?: string | null;
    condition: string;
    city: string;
    itemLocation?: string | null;
    stock?: number;
    photos: string[];
    allowPriceOffers?: boolean;
    allowSelfPickup?: boolean;
    vehicleYear?: number | null;
    vehicleFuel?: string | null;
    vehicleTransmission?: string | null;
    vehicleBody?: string | null;
    vehicleMileage?: number | null;
    vehicleType?: string | null;
    vehicleEngineVolume?: number | null;
    vehicleLoadCapacity?: number | null;
    partForVehicle?: string | null;
    partType?: string | null;
    partPopular?: string | null;
    itemSize?: string | null;
    variants?: string | null;
  };
};

function getInitialListingVariants(initial?: ListingFormProps["initial"]): ListingVariant[] {
  if (initial?.variants) {
    const parsed = parseListingVariants(initial.variants);
    if (parsed.length > 0) return parsed;
  }
  if (initial?.category && isClothingVariantsCategory(initial.category) && initial.itemSize) {
    return [{ color: "", size: initial.itemSize, stock: initial.stock ?? 1 }];
  }
  return [{ color: "", size: "", stock: 1 }];
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-gray-800">{children}</label>;
}

function PriceOffersCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-sm leading-snug text-gray-700">
        <span className="font-medium text-gray-900">Дозволити покупцям пропонувати свою ціну</span>
        <span className="mt-1 block text-xs text-gray-500">
          Якщо галочку поставлено — покупці зможуть надіслати вам свою пропозицію. Без галочки
          кнопка «Запропонувати ціну» не з&apos;явиться.
        </span>
      </span>
    </label>
  );
}

function SelfPickupCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-sm leading-snug text-gray-700">
        <span className="font-medium text-gray-900">Є самовивіз</span>
        <span className="mt-1 block text-xs text-gray-500">
          Покупець зможе забрати товар особисто у вашому місті. Доставка Nova Poshta також
          залишається доступною.
        </span>
      </span>
    </label>
  );
}

export default function ListingForm({ variant = "create", initial }: ListingFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const isCreate = variant === "create" && !isEdit;
  const parsedCategory = parseListingCategory(initial?.category || CATEGORIES[2]);

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [category, setCategory] = useState(parsedCategory.main);
  const [subcategory, setSubcategory] = useState(parsedCategory.sub);
  const [categoryDetail, setCategoryDetail] = useState(parsedCategory.detail);
  const [categoryItem, setCategoryItem] = useState(parsedCategory.item);
  const [brand, setBrand] = useState(initial?.brand || "");
  const [condition, setCondition] = useState(initial?.condition || "LIKE_NEW");
  const [city, setCity] = useState(initial?.city || "Київ");
  const [itemLocation, setItemLocation] = useState(initial?.itemLocation || "");
  const [stock, setStock] = useState(initial?.stock?.toString() || "1");
  const [allowPriceOffers, setAllowPriceOffers] = useState(initial?.allowPriceOffers ?? false);
  const [allowSelfPickup, setAllowSelfPickup] = useState(initial?.allowSelfPickup ?? false);
  const [vehicleYear, setVehicleYear] = useState(initial?.vehicleYear?.toString() || "");
  const [vehicleMileage, setVehicleMileage] = useState(initial?.vehicleMileage?.toString() || "");
  const [vehicleFuel, setVehicleFuel] = useState(initial?.vehicleFuel || "");
  const [vehicleTransmission, setVehicleTransmission] = useState(initial?.vehicleTransmission || "");
  const [vehicleBody, setVehicleBody] = useState(initial?.vehicleBody || "");
  const [vehicleType, setVehicleType] = useState(initial?.vehicleType || "");
  const [vehicleEngineVolume, setVehicleEngineVolume] = useState(
    initial?.vehicleEngineVolume?.toString() || ""
  );
  const [vehicleLoadCapacityTons, setVehicleLoadCapacityTons] = useState(
    initial?.vehicleLoadCapacity ? String(initial.vehicleLoadCapacity / 1000) : ""
  );
  const [partForVehicle, setPartForVehicle] = useState(initial?.partForVehicle || "");
  const [partType, setPartType] = useState(initial?.partType || "");
  const [partPopular, setPartPopular] = useState(initial?.partPopular || "");
  const [itemSize, setItemSize] = useState(initial?.itemSize || "");
  const [variants, setVariants] = useState<ListingVariant[]>(() => getInitialListingVariants(initial));
  const [childSizeMode, setChildSizeMode] = useState<"age" | "height">(
    getInitialChildSizeMode(initial?.itemSize)
  );
  const [photos, setPhotos] = useState<string[]>(initial?.photos || []);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstSubcategoryEffect = useRef(true);

  const progress = getListingFormProgress({
    title,
    description,
    price,
    city,
    itemLocation,
    stock,
    photosCount: photos.length,
    categoryMain: category,
    condition,
  });

  const recommendedPrice = useMemo(() => {
    const numeric = Number(price);
    return numeric > 0 ? getRecommendedPriceRange(numeric) : null;
  }, [price]);

  const subcategoryOptions = useMemo(
    () => CATEGORY_SUBCATEGORIES[category as keyof typeof CATEGORY_SUBCATEGORIES] ?? ["Інше"],
    [category]
  );

  const categoryDetailOptions = useMemo(
    () => listCategoryDetails(category, subcategory),
    [category, subcategory]
  );

  const categoryItemOptions = useMemo(
    () =>
      categoryDetail ? listCategoryDetailItems(category, subcategory, categoryDetail) : [],
    [category, subcategory, categoryDetail]
  );

  const isGroupedDetailConfig = useMemo(() => {
    const config = getCategoryDetailConfig(category, subcategory);
    return config !== null && !Array.isArray(config);
  }, [category, subcategory]);

  const isCarListing = isCarListingCategory(category, subcategory);
  const isMotoListing = isMotoListingCategory(category, subcategory);
  const isTruckListing = isTruckListingCategory(category, subcategory);
  const isPartsListing = isPartsListingCategory(category, subcategory);
  const isAgriListing = isAgriListingCategory(category, subcategory);
  const brandOptions = isTruckListing
    ? TRUCK_BRANDS
    : isMotoListing
      ? MOTO_BRANDS
      : CAR_BRANDS;
  const isBrandSelect = isCarListing || isMotoListing || isTruckListing;
  const clothingSizeKind = getClothingSizeKind(
    category,
    subcategory,
    categoryDetail || undefined
  );
  const useClothingVariants = category === "Одяг і взуття";
  const conditionOptions = getListingConditions(category, subcategory);

  useEffect(() => {
    if (isFirstSubcategoryEffect.current) {
      isFirstSubcategoryEffect.current = false;
      return;
    }
    setCategoryDetail("");
    setCategoryItem("");
    setItemSize("");
    setChildSizeMode("age");
  }, [subcategory]);

  useEffect(() => {
    if (!clothingSizeKind) {
      setItemSize("");
    }
  }, [clothingSizeKind, categoryDetail]);

  useEffect(() => {
    if (!(condition in conditionOptions)) {
      setCondition("LIKE_NEW");
    }
  }, [condition, conditionOptions]);

  useEffect(() => {
    setCategoryItem("");
  }, [categoryDetail]);

  useEffect(() => {
    if (!subcategoryOptions.includes(subcategory)) {
      setSubcategory(subcategoryOptions[0] ?? "Інше");
    }
  }, [category, subcategory, subcategoryOptions]);

  useEffect(() => {
    if (categoryDetail && !categoryDetailOptions.includes(categoryDetail)) {
      setCategoryDetail("");
    }
  }, [subcategory, categoryDetail, categoryDetailOptions]);

  useEffect(() => {
    if (categoryItem && !categoryItemOptions.includes(categoryItem)) {
      setCategoryItem("");
    }
  }, [categoryDetail, categoryItem, categoryItemOptions]);

  useEffect(() => {
    if (!isCreate) return;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        title?: string;
        description?: string;
        price?: string;
        category?: string;
        categoryMain?: string;
        brand?: string;
        condition?: string;
        city?: string;
        itemLocation?: string;
        stock?: string;
      };
      if (draft.title) setTitle(draft.title);
      if (draft.description) setDescription(draft.description);
      if (draft.price) setPrice(draft.price);
      if (draft.category) setCategory(draft.category);
      else if (draft.categoryMain) setCategory(draft.categoryMain);
      if (draft.brand) setBrand(draft.brand);
      if (draft.condition) setCondition(draft.condition);
      if (draft.city) setCity(draft.city);
      if (draft.itemLocation) setItemLocation(draft.itemLocation);
      if (draft.stock) setStock(draft.stock);
    } catch {
      // ignore invalid draft
    }
  }, [isCreate]);

  useEffect(() => {
    if (!isCreate) return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          title,
          description,
          price,
          category,
          brand,
          condition,
          city,
          itemLocation,
          stock,
        })
      );
      setDraftSavedAt(new Date().toISOString());
    }, 800);
    return () => clearTimeout(timer);
  }, [title, description, price, category, brand, condition, city, itemLocation, stock, isCreate]);

  async function uploadPhoto(file: File) {
    return uploadPhotoFile(file, {
      maxWidth: LISTING_PHOTO_MAX_WIDTH,
      maxBytes: LISTING_PHOTO_MAX_BYTES,
    });
  }

  async function addPhotoFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setLoading(true);
    setError("");
    setUploadStatus("");
    try {
      const filesToUpload = list.slice(0, MAX_LISTING_PHOTOS - photos.length);
      const newPhotos: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadStatus(`Завантаження фото ${i + 1} з ${filesToUpload.length}...`);
        const url = await uploadPhoto(filesToUpload[i]);
        newPhotos.push(url);
      }

      const merged = [...photos, ...newPhotos];
      const check = validateListingPhotos(merged);
      if (!check.ok) throw new Error(check.error);

      setPhotos(merged);
      setUploadStatus(`Додано ${newPhotos.length} фото`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження фото");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    await addPhotoFiles(files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (loading || photos.length >= MAX_LISTING_PHOTOS) return;
    const files = e.dataTransfer.files;
    if (files?.length) void addPhotoFiles(files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const photosCheck = validateListingPhotos(photos);
      if (!photosCheck.ok) throw new Error(photosCheck.error);

      const position = itemLocation.trim();
      if (position.length < 2) {
        throw new Error("Вкажіть позицію на складі — де фізично лежить цей товар");
      }

      if (clothingSizeKind && !useClothingVariants && !itemSize.trim()) {
        throw new Error("Оберіть розмір товару");
      }

      let resolvedStock = stock;
      let resolvedVariants: ListingVariant[] | undefined;
      const formattedCategory = formatListingCategory(
        category,
        subcategory,
        categoryDetail || undefined,
        categoryItem || undefined
      );

      if (useClothingVariants) {
        const variantsCheck = validateListingVariants(variants, formattedCategory);
        if (!variantsCheck.ok) {
          throw new Error(variantsCheck.error);
        }
        resolvedVariants = variantsCheck.variants;
        resolvedStock = String(sumVariantStock(variantsCheck.variants));
      }

      if (title.trim().length > LISTING_TITLE_MAX) {
        throw new Error(`Назва товару — не більше ${LISTING_TITLE_MAX} символів`);
      }

      const forbiddenWord = checkListingContent(title, description);
      if (forbiddenWord) {
        throw new Error(
          `Заборонений товар або слово «${forbiddenWord}». Перегляньте правила сайту.`
        );
      }

      const stockCheck = useClothingVariants
        ? validateListingStock(resolvedStock, { min: 0 })
        : isCreate
          ? validateListingStockForCreate(stock)
          : validateListingStock(stock);
      if (!stockCheck.ok) {
        throw new Error(stockCheck.error);
      }

      if (useClothingVariants && isCreate && stockCheck.stock < 1) {
        throw new Error("Додайте хоча б один варіант з кількістю більше 0.");
      }

      const payload = {
        title,
        description,
        price: Number(price),
        category: formattedCategory,
        brand: brand.trim() || null,
        condition,
        city,
        itemLocation: position,
        stock: stockCheck.stock,
        allowPriceOffers,
        allowSelfPickup,
        photos: photosCheck.photos,
        itemSize: useClothingVariants ? null : clothingSizeKind ? itemSize.trim() : null,
        ...(useClothingVariants && resolvedVariants
          ? { variants: resolvedVariants }
          : {}),
        ...(isCarListing
          ? {
              vehicleYear: Number(vehicleYear),
              vehicleMileage: Number(vehicleMileage),
              vehicleFuel,
              vehicleTransmission,
              vehicleBody,
            }
          : {}),
        ...(isMotoListing
          ? {
              vehicleYear: Number(vehicleYear),
              vehicleMileage: Number(vehicleMileage),
              vehicleFuel,
              vehicleType,
              vehicleEngineVolume: Number(vehicleEngineVolume),
            }
          : {}),
        ...(isTruckListing
          ? {
              vehicleYear: Number(vehicleYear),
              vehicleMileage: Number(vehicleMileage),
              vehicleFuel,
              vehicleTransmission,
              vehicleType,
              vehicleLoadCapacity: tonsToKg(Number(vehicleLoadCapacityTons)),
            }
          : {}),
        ...(isPartsListing
          ? {
              partForVehicle,
              partType,
              partPopular: partPopular || null,
            }
          : {}),
        ...(isAgriListing
          ? {
              brand,
              vehicleType,
              vehicleYear: Number(vehicleYear),
            }
          : {}),
      };

      if (getListingPhotosPayloadSize(photosCheck.photos) > 2_500_000) {
        throw new Error("Занадто багато великих фото. Спробуйте менше зображень.");
      }

      const url = isEdit ? `/api/listings/${initial!.id}` : "/api/listings";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");

      if (isCreate) localStorage.removeItem(DRAFT_STORAGE_KEY);

      if (!isEdit) {
        router.push(
          data.status === "PENDING"
            ? `/listings/${data.id}?pending=1`
            : `/listings/${data.id}`
        );
      } else {
        router.push(`/listings/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  }

  function adjustStock(delta: number) {
    const next = Math.min(9999, Math.max(1, Number(stock || "1") + delta));
    setStock(String(next));
  }

  const transportFieldsSection = isCarListing ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <FieldLabel>
          Рік випуску <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="1950"
          max={new Date().getFullYear() + 1}
          value={vehicleYear}
          onChange={(e) => setVehicleYear(e.target.value)}
          required
          placeholder="2018"
        />
      </div>
      <div>
        <FieldLabel>
          Пробіг (км) <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="0"
          step="1000"
          value={vehicleMileage}
          onChange={(e) => setVehicleMileage(e.target.value)}
          required
          placeholder="95000"
        />
      </div>
      <div>
        <FieldLabel>
          Паливо <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={vehicleFuel} onChange={(e) => setVehicleFuel(e.target.value)} required>
          <option value="">Оберіть</option>
          {CAR_FUEL_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>
          Коробка передач <span className="text-red-500">*</span>
        </FieldLabel>
        <select
          value={vehicleTransmission}
          onChange={(e) => setVehicleTransmission(e.target.value)}
          required
        >
          <option value="">Оберіть</option>
          {CAR_TRANSMISSIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>
          Тип кузова <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={vehicleBody} onChange={(e) => setVehicleBody(e.target.value)} required>
          <option value="">Оберіть</option>
          {CAR_BODY_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  ) : isMotoListing ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldLabel>
          Тип транспорту <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required>
          <option value="">Оберіть</option>
          {MOTO_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>
          Рік випуску <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="1950"
          max={new Date().getFullYear() + 1}
          value={vehicleYear}
          onChange={(e) => setVehicleYear(e.target.value)}
          required
          placeholder="2020"
        />
      </div>
      <div>
        <FieldLabel>
          Об&apos;єм двигуна (см³) <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="50"
          max="3000"
          step="50"
          value={vehicleEngineVolume}
          onChange={(e) => setVehicleEngineVolume(e.target.value)}
          required
          placeholder="250"
        />
      </div>
      <div>
        <FieldLabel>
          Паливо <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={vehicleFuel} onChange={(e) => setVehicleFuel(e.target.value)} required>
          <option value="">Оберіть</option>
          {MOTO_FUEL_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>
          Пробіг (км) <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="0"
          step="500"
          value={vehicleMileage}
          onChange={(e) => setVehicleMileage(e.target.value)}
          required
          placeholder="12000"
        />
      </div>
    </div>
  ) : isTruckListing ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldLabel>
          Тип транспорту <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required>
          <option value="">Оберіть</option>
          {TRUCK_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>
          Рік випуску <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="1950"
          max={new Date().getFullYear() + 1}
          value={vehicleYear}
          onChange={(e) => setVehicleYear(e.target.value)}
          required
          placeholder="2018"
        />
      </div>
      <div>
        <FieldLabel>
          Вантажопідйомність (т) <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={vehicleLoadCapacityTons}
          onChange={(e) => setVehicleLoadCapacityTons(e.target.value)}
          required
          placeholder="20"
        />
      </div>
      <div>
        <FieldLabel>
          Паливо <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={vehicleFuel} onChange={(e) => setVehicleFuel(e.target.value)} required>
          <option value="">Оберіть</option>
          {TRUCK_FUEL_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>
          Коробка передач <span className="text-red-500">*</span>
        </FieldLabel>
        <select
          value={vehicleTransmission}
          onChange={(e) => setVehicleTransmission(e.target.value)}
          required
        >
          <option value="">Оберіть</option>
          {CAR_TRANSMISSIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>
          Пробіг (км) <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="0"
          step="1000"
          value={vehicleMileage}
          onChange={(e) => setVehicleMileage(e.target.value)}
          required
          placeholder="350000"
        />
      </div>
    </div>
  ) : isPartsListing ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldLabel>
          Для якого транспорту <span className="text-red-500">*</span>
        </FieldLabel>
        <select
          value={partForVehicle}
          onChange={(e) => setPartForVehicle(e.target.value)}
          required
        >
          <option value="">Оберіть</option>
          {PART_FOR_VEHICLES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>
          Тип деталі <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={partType} onChange={(e) => setPartType(e.target.value)} required>
          <option value="">Оберіть</option>
          {PART_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Марка машини</FieldLabel>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Будь-яка / не вказано</option>
          {PART_BRANDS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
        <FieldLabel>Популярне</FieldLabel>
        <select value={partPopular} onChange={(e) => setPartPopular(e.target.value)}>
          <option value="">Не обрано</option>
          {PART_POPULAR.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  ) : isAgriListing ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <FieldLabel>
          Марка <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} required>
          <option value="">Оберіть</option>
          {AGRI_BRANDS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>
          Тип техніки <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required>
          <option value="">Оберіть</option>
          {AGRI_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>
          Рік випуску <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          type="number"
          min="1950"
          max={new Date().getFullYear() + 1}
          value={vehicleYear}
          onChange={(e) => setVehicleYear(e.target.value)}
          required
          placeholder="2015"
        />
      </div>
    </div>
  ) : null;

  const simpleForm = (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <ProhibitedGoodsNotice />

      <div>
        <FieldLabel>Назва *</FieldLabel>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={LISTING_TITLE_MAX}
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {title.length}/{LISTING_TITLE_MAX}
        </p>
      </div>

      <div>
        <FieldLabel>Опис *</FieldLabel>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          maxLength={2000}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Ціна (₴) *</FieldLabel>
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        {!useClothingVariants && (
          <div>
            <FieldLabel>Кількість в наявності *</FieldLabel>
            <input
              type="number"
              min="0"
              max="9999"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              0 — товар тимчасово недоступний для покупки.
            </p>
          </div>
        )}
        <SettlementSearch value={city} onChange={setCity} label="Місто / село" required />
      </div>

      <PriceOffersCheckbox checked={allowPriceOffers} onChange={setAllowPriceOffers} />

      <div>
        <FieldLabel>
          Позиція на складі <span className="text-red-500">*</span>
        </FieldLabel>
        <input
          value={itemLocation}
          onChange={(e) => setItemLocation(e.target.value)}
          maxLength={200}
          required
          placeholder="Стелаж А-3, полиця 12 / коробка 45 / ряд 2"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Обов&apos;язково для кожного товару — щоб швидко знайти його серед сотень оголошень.
        </p>
      </div>

      <SelfPickupCheckbox checked={allowSelfPickup} onChange={setAllowSelfPickup} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Категорія *</FieldLabel>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Підкатегорія *</FieldLabel>
          <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
            {subcategoryOptions.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
        {categoryDetailOptions.length > 0 && (
          <div>
            <FieldLabel>{isGroupedDetailConfig ? "Розділ" : "Уточнення"}</FieldLabel>
            <select
              value={categoryDetail}
              onChange={(e) => setCategoryDetail(e.target.value)}
            >
              <option value="">Усі в підкатегорії</option>
              {categoryDetailOptions.map((detail) => (
                <option key={detail} value={detail}>
                  {detail}
                </option>
              ))}
            </select>
          </div>
        )}
        {categoryItemOptions.length > 0 && (
          <div>
            <FieldLabel>Уточнення</FieldLabel>
            <select value={categoryItem} onChange={(e) => setCategoryItem(e.target.value)}>
              <option value="">Усі в розділі</option>
              {categoryItemOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <FieldLabel>{isBrandSelect ? "Марка *" : "Бренд"}</FieldLabel>
          {isBrandSelect ? (
            <select value={brand} onChange={(e) => setBrand(e.target.value)} required>
              <option value="">Оберіть марку</option>
              {brandOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              maxLength={80}
              placeholder="Наприклад, Apple"
            />
          )}
        </div>
        {clothingSizeKind && !useClothingVariants && (
          <ClothingSizeFields
            kind={clothingSizeKind}
            itemSize={itemSize}
            onItemSizeChange={setItemSize}
            childSizeMode={childSizeMode}
            onChildSizeModeChange={setChildSizeMode}
          />
        )}
        {useClothingVariants && (
          <ListingVariantsEditor
            variants={variants}
            onChange={setVariants}
            sizeKind={clothingSizeKind}
          />
        )}
        <div>
          <FieldLabel>Стан *</FieldLabel>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {Object.entries(conditionOptions).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {transportFieldsSection}

      <div>
        <FieldLabel>Фото * (мінімум 1, до {MAX_LISTING_PHOTOS})</FieldLabel>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={loading || photos.length >= MAX_LISTING_PHOTOS}
        />
        {uploadStatus && <p className="mt-2 text-xs text-brand-700">{uploadStatus}</p>}
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3">
        <PlatformDisclaimerNotice compact />
      </div>
      <button
        type="submit"
        disabled={loading || photos.length === 0}
        className="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Збереження..." : isEdit ? "Зберегти зміни" : "Опублікувати"}
      </button>
    </form>
  );

  if (!isCreate) return simpleForm;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Створити оголошення</h1>
        <p className="mt-2 text-gray-600">
          Заповніть інформацію про товар та опублікуйте за 1 хвилину
        </p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Прогрес заповнення</span>
            <span className="font-semibold text-brand-700">Заповнено на {progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-6">
          <ProhibitedGoodsNotice />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <FormSection
              title="Фото товару"
              description={`Додайте якісні фото товару. Можна завантажити до ${MAX_LISTING_PHOTOS} фото.`}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  dragActive
                    ? "border-brand-500 bg-brand-50"
                    : "border-brand-300 bg-brand-50/40"
                }`}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Перетягніть фото сюди або</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || photos.length >= MAX_LISTING_PHOTOS}
                  className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Додати фото
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading || photos.length >= MAX_LISTING_PHOTOS}
                  className="hidden"
                />
                {uploadStatus && <p className="mt-3 text-xs text-brand-700">{uploadStatus}</p>}
              </div>

              {(photos.length > 0 || photos.length < MAX_LISTING_PHOTOS) && (
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt=""
                        className="h-28 w-28 rounded-xl border border-gray-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/80 text-xs text-white hover:bg-gray-900"
                        aria-label="Видалити фото"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_LISTING_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 hover:border-brand-300 hover:text-brand-700"
                    >
                      <span className="text-2xl leading-none text-brand-600">+</span>
                      <span className="mt-1 text-xs">Додати ще</span>
                    </button>
                  )}
                </div>
              )}
            </FormSection>

            <FormSection title="Основна інформація">
              <div>
                <FieldLabel>
                  Назва товару <span className="text-red-500">*</span>
                </FieldLabel>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={LISTING_TITLE_MAX}
                  placeholder="Наприклад, iPhone 13 Pro 128GB Alpine Green"
                />
                <p className="mt-2 text-right text-xs text-gray-400">
                  {title.length}/{LISTING_TITLE_MAX}
                </p>
              </div>
              <div>
                <FieldLabel>
                  Опис <span className="text-red-500">*</span>
                </FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  maxLength={DESCRIPTION_MAX}
                  placeholder="Опишіть товар: стан, комплектацію, особливості..."
                />
                <p className="mt-2 text-right text-xs text-gray-400">
                  Стан символів: {description.length}/{DESCRIPTION_MAX}
                </p>
              </div>
            </FormSection>

            <FormSection title="Деталі товару">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>
                    Категорія <span className="text-red-500">*</span>
                  </FieldLabel>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>
                    Підкатегорія <span className="text-red-500">*</span>
                  </FieldLabel>
                  <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                    {subcategoryOptions.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
                {categoryDetailOptions.length > 0 && (
                  <div>
                    <FieldLabel>{isGroupedDetailConfig ? "Розділ" : "Уточнення"}</FieldLabel>
                    <select
                      value={categoryDetail}
                      onChange={(e) => setCategoryDetail(e.target.value)}
                    >
                      <option value="">Усі в підкатегорії</option>
                      {categoryDetailOptions.map((detail) => (
                        <option key={detail} value={detail}>
                          {detail}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {categoryItemOptions.length > 0 && (
                  <div>
                    <FieldLabel>Уточнення</FieldLabel>
                    <select value={categoryItem} onChange={(e) => setCategoryItem(e.target.value)}>
                      <option value="">Усі в розділі</option>
                      {categoryItemOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {clothingSizeKind && !useClothingVariants && (
                  <ClothingSizeFields
                    kind={clothingSizeKind}
                    itemSize={itemSize}
                    onItemSizeChange={setItemSize}
                    childSizeMode={childSizeMode}
                    onChildSizeModeChange={setChildSizeMode}
                  />
                )}
                {useClothingVariants && (
                  <div className="sm:col-span-2">
                    <ListingVariantsEditor
                      variants={variants}
                      onChange={setVariants}
                      sizeKind={clothingSizeKind}
                    />
                  </div>
                )}
                <div>
                  <FieldLabel>
                    Стан <span className="text-red-500">*</span>
                  </FieldLabel>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                    {Object.entries(conditionOptions).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>{isBrandSelect ? "Марка *" : "Бренд"}</FieldLabel>
                  {isBrandSelect ? (
                    <select value={brand} onChange={(e) => setBrand(e.target.value)} required>
                      <option value="">Оберіть марку</option>
                      {brandOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      maxLength={80}
                      placeholder="Наприклад, Apple, Samsung, Nike"
                    />
                  )}
                </div>
                {!useClothingVariants && (
                  <div>
                    <FieldLabel>
                      Кількість <span className="text-red-500">*</span>
                    </FieldLabel>
                    <div className="flex h-[42px] items-stretch overflow-hidden rounded-lg border border-gray-300">
                      <button
                        type="button"
                        onClick={() => adjustStock(-1)}
                        className="w-12 bg-gray-50 text-lg text-gray-600 hover:bg-gray-100"
                      >
                        −
                      </button>
                      <div className="flex flex-1 items-center justify-center border-x border-gray-300 bg-white text-sm font-medium">
                        {stock}
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustStock(1)}
                        className="w-12 bg-gray-50 text-lg text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {transportFieldsSection}
            </FormSection>

            <FormSection title="Ціна">
              <div>
                <FieldLabel>
                  Ціна <span className="text-red-500">*</span>
                </FieldLabel>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="18999"
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ₴
                  </span>
                </div>
                {recommendedPrice && (
                  <p className="mt-2 text-sm text-gray-500">
                    Рекомендована ціна: {recommendedPrice}
                  </p>
                )}
              </div>
              <PriceOffersCheckbox checked={allowPriceOffers} onChange={setAllowPriceOffers} />
            </FormSection>

            <FormSection
              title="Місцезнаходження"
              description="Місто для каталогу та позиція на вашому складі — для кожного товару окремо."
            >
              <SettlementSearch
                value={city}
                onChange={setCity}
                label="Місто"
                required
                placeholder="Київ"
                hideHint
                showLocationIcon
              />
              <div>
                <FieldLabel>
                  Позиція на складі <span className="text-red-500">*</span>
                </FieldLabel>
                <input
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  maxLength={200}
                  required
                  placeholder="Стелаж А-3, полиця 12 / коробка 45 / ряд 2"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Де саме лежить цей товар — ви зможете шукати за позицією у «Мої оголошення».
                </p>
              </div>
              <SelfPickupCheckbox checked={allowSelfPickup} onChange={setAllowSelfPickup} />
            </FormSection>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5 text-brand-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Чернетка збережена
                </span>
                <span className="text-gray-400">·</span>
                <span>
                  Останнє збереження: {draftSavedAt ? "щойно" : "очікування…"}
                </span>
              </div>
              <button
                type="submit"
                disabled={loading || photos.length === 0}
                className="w-full rounded-xl bg-brand-600 py-4 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? "Збереження..." : "Опублікувати оголошення"}
              </button>
              <div className="mt-3 space-y-2">
                <PlatformDisclaimerNotice compact />
                <p className="text-center text-xs text-gray-400">
                  Натискаючи кнопку, ви погоджуєтесь з правилами сайту
                </p>
              </div>
            </div>
          </div>

          <aside>
            <ListingCreatePreview
              title={title}
              description={description}
              price={price}
              city={city}
              itemLocation={itemLocation}
              stock={stock}
              brand={brand}
              categoryLabel={formatListingCategory(
                category,
                subcategory,
                categoryDetail || undefined,
                categoryItem || undefined
              )}
              condition={condition}
              itemSize={itemSize}
              allowSelfPickup={allowSelfPickup}
              photos={photos}
            />
          </aside>
        </div>
      </form>
    </div>
  );
}
