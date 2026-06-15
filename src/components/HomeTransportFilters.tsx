import SearchFilters from "@/components/SearchFilters";
import CarSearchFilters from "@/components/CarSearchFilters";
import MotoSearchFilters from "@/components/MotoSearchFilters";
import TruckSearchFilters from "@/components/TruckSearchFilters";
import PartsSearchFilters from "@/components/PartsSearchFilters";
import AgriSearchFilters from "@/components/AgriSearchFilters";
import {
  isCarCatalogContext,
  isMotoCatalogContext,
  isTruckCatalogContext,
} from "@/lib/vehicle";
import { isPartsCatalogContext } from "@/lib/parts";
import { isAgriCatalogContext } from "@/lib/agri";

type HomeTransportFiltersProps = {
  category?: string;
  subcategory?: string;
};

export default function HomeTransportFilters({
  category,
  subcategory,
}: HomeTransportFiltersProps) {
  const params = { category, subcategory };

  if (isAgriCatalogContext(params.category, params.subcategory)) {
    return <AgriSearchFilters />;
  }
  if (isPartsCatalogContext(params.category, params.subcategory)) {
    return <PartsSearchFilters />;
  }
  if (isTruckCatalogContext(params.category, params.subcategory)) {
    return <TruckSearchFilters />;
  }
  if (isMotoCatalogContext(params.category, params.subcategory)) {
    return <MotoSearchFilters />;
  }
  if (isCarCatalogContext(params.category, params.subcategory)) {
    return <CarSearchFilters />;
  }
  return <SearchFilters />;
}
