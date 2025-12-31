/**
 * Shared filter options interface used across the application.
 * Fields are optional to support both partial options (from hooks) and full options.
 */
export interface FilterOptions {
  services?: string[];
  projectTypes?: string[];
  includedItems?: string[];
  areasOfWork?: string[];
  priceModels?: Array<{ value: string; label: string }>;
  categories?: string[];
}

export const DEFAULT_PRICE_MODELS: FilterOptions["priceModels"] = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'unit', label: 'Unit Based' },
  { value: 'rfq', label: 'Request for Quote' }
];
