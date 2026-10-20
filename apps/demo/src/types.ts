import type { CharaInspection } from 'ffxiv-chara';
import type { AppearanceInspection } from 'ffxiv-chara/appearance';
import type { EquipmentResolution } from 'ffxiv-chara/xivapi';

export type WorkerReply =
  | { type: 'inspection'; inspection: CharaInspection }
  | { type: 'appearance'; appearance: AppearanceInspection }
  | { type: 'rejected'; code: string };
export interface DemoState {
  fileName: string | null;
  inspection: CharaInspection | null;
  appearance: AppearanceInspection | null;
  appearanceStatus: 'idle' | 'loading' | 'ready' | 'unavailable';
  resolution: EquipmentResolution | null;
  error: string | null;
  localStatus: string;
  reading: boolean;
  lookingUp: boolean;
  lookupMessage: string;
  icons: Map<string, string>;
}
