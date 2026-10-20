import type {
  EquipmentModel,
  EquipmentResolveInput,
  EquipmentSlot,
  Issue,
} from '../types.js';

export type Language = 'en' | 'ja' | 'de' | 'fr';
export interface ItemRules {
  dyeCount: number | null;
  glamourable: boolean | null;
  wear: Partial<Record<string, boolean>>;
  grandCompany: number | null;
}
export interface StainRow {
  rowId: number;
  names: Partial<Record<Language, string>>;
}
export interface GlassesRow extends StainRow {
  iconId: number | null;
}
export interface ItemRow extends GlassesRow {
  modelMain: string;
  modelSub: string | null;
  slots: EquipmentSlot[];
  levelEquip: number | null;
  uiCategory: number | null;
  rules: ItemRules;
}
export type PublicRow = ItemRow | GlassesRow | StainRow;
export interface LookupResult<R extends PublicRow = PublicRow> {
  status: 'complete' | 'partial' | 'unavailable' | 'cancelled';
  rows: R[];
  version: string | null;
  schema: string | null;
  issues: Issue[];
}
export interface CachedRows {
  format: 1;
  namespace: string;
  version: string;
  schema: string;
  complete: true;
  rows: PublicRow[];
}
export interface ResolutionCache {
  get(key: string): Promise<CachedRows | null>;
  set(key: string, value: CachedRows, ttlMs: number): Promise<void>;
}
export interface XivapiOptions {
  fetch?: typeof globalThis.fetch;
  /** HTTPS API root, including /api. Trusted host configuration only. */
  baseUrl?: string;
  version?: string;
  schema?: string;
  languages?: readonly Language[];
  maxPages?: number;
  timeoutMs?: number;
  cache?: ResolutionCache;
}
export interface XivapiClient {
  getStains(
    ids: readonly number[],
    options?: { signal?: AbortSignal },
  ): Promise<LookupResult<StainRow>>;
  searchItems(
    models: readonly EquipmentModel[],
    options?: { signal?: AbortSignal },
  ): Promise<LookupResult<ItemRow>>;
  getGlasses(
    id: number,
    options?: { signal?: AbortSignal },
  ): Promise<LookupResult<GlassesRow>>;
}

export type ResolutionStatus =
  | 'matched'
  | 'notFound'
  | 'partial'
  | 'unavailable'
  | 'cancelled';
export interface EquipmentCandidate {
  itemId: number;
  names: Partial<Record<Language, string>>;
  iconId: number | null;
  levelEquip: number | null;
  uiCategory: number | null;
  rules: ItemRules;
  viaMainHand: boolean;
}
export interface SlotResolution {
  model: EquipmentModel;
  modelKey: string;
  status: ResolutionStatus;
  /** Describes observed candidates; incomplete results cannot establish uniqueness. */
  ambiguous: boolean;
  candidates: EquipmentCandidate[];
}
export interface FacewearResolution {
  id: number;
  status: ResolutionStatus;
  candidates: GlassesRow[];
}
export interface UpstreamIdentity {
  version: string | null;
  schema: string | null;
}
export interface EquipmentResolution {
  items: Partial<Record<EquipmentSlot, SlotResolution>>;
  facewear: FacewearResolution | null;
  upstream: {
    items: UpstreamIdentity | null;
    facewear: UpstreamIdentity | null;
  };
  issues: Issue[];
}
export interface EquipmentResolver {
  resolve(
    input: EquipmentResolveInput,
    options?: { signal?: AbortSignal },
  ): Promise<EquipmentResolution>;
}
