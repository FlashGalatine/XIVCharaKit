import type { CharaInspection } from 'xivcharakit';
import type { AppearanceInspection } from 'xivcharakit/appearance';
import type { EquipmentResolution } from 'xivcharakit/xivapi';

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
