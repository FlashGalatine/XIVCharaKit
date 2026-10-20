import { CharaInputError, inspectChara, readChara } from 'ffxiv-chara';
import type { WorkerReply } from './types.js';

const context = globalThis as unknown as {
  onmessage: (event: MessageEvent<File>) => void;
  postMessage(value: WorkerReply): void;
};
context.onmessage = async (event) => {
  let inspected = false;
  try {
    const inspection = inspectChara(
      readChara(new Uint8Array(await event.data.arrayBuffer())),
    );
    inspected = true;
    context.postMessage({ type: 'inspection', inspection });
    const [appearance, palettes] = await Promise.all([
      import('ffxiv-chara/appearance'),
      import('ffxiv-chara/palettes'),
    ]);
    const result = await appearance.resolveAppearance(inspection, {
      palettes: palettes.createDefaultPaletteProvider(),
    });
    context.postMessage({ type: 'appearance', appearance: result });
  } catch (error) {
    context.postMessage({
      type: 'rejected',
      code: inspected
        ? 'APPEARANCE_UNAVAILABLE'
        : error instanceof CharaInputError
          ? error.code
          : 'FILE_READ_FAILED',
    });
  }
};
