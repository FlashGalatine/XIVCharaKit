import type { EquipmentResolution } from 'xivcharakit/xivapi';

export const iconKey = (id: number, version: string) => `${version}:${id}`;
export async function loadIcons(
  result: EquipmentResolution,
  signal: AbortSignal,
  ready: (key: string, url: string) => void,
): Promise<void> {
  const references = new Map<string, { id: number; version: string }>();
  function add(
    id: number | null | undefined,
    version: string | null | undefined,
  ): void {
    if (
      !Number.isSafeInteger(id) ||
      !id ||
      id < 1 ||
      id > 0xffffffff ||
      typeof version !== 'string' ||
      !/^[a-f0-9]{16}$/.test(version) ||
      references.size >= 16
    )
      return;
    references.set(iconKey(id, version), { id, version });
  }
  for (const slot of Object.values(result.items))
    add(slot?.candidates[0]?.iconId, result.upstream.items?.version);
  add(
    result.facewear?.candidates[0]?.iconId,
    result.upstream.facewear?.version,
  );
  let aggregate = 0;
  for (const [key, { id, version }] of references) {
    if (signal.aborted || aggregate >= 2 * 1024 * 1024) break;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const digits = String(id).padStart(6, '0');
      const url = new URL('https://v2.xivapi.com/api/asset');
      url.search = new URLSearchParams({
        path: `ui/icon/${digits.slice(0, -3)}000/${digits}_hr1.tex`,
        format: 'png',
        version,
      }).toString();
      const combined = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      const response = await fetch(url, {
        signal: combined,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'manual',
      });
      if (
        !response.ok ||
        !response.headers.get('Content-Type')?.startsWith('image/png') ||
        !response.body
      ) {
        void response.body?.cancel().catch(() => {});
        continue;
      }
      reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        aggregate += chunk.value.byteLength;
        if (bytes > 256 * 1024 || aggregate > 2 * 1024 * 1024)
          throw new Error('ICON_LIMIT');
        chunks.push(chunk.value);
      }
      const data = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
      }
      if (
        data.length < 24 ||
        [137, 80, 78, 71, 13, 10, 26, 10].some(
          (value, index) => data[index] !== value,
        )
      )
        continue;
      const view = new DataView(data.buffer);
      if (
        view.getUint32(12) !== 0x49484452 ||
        view.getUint32(16) < 1 ||
        view.getUint32(20) < 1 ||
        view.getUint32(16) > 256 ||
        view.getUint32(20) > 256 ||
        signal.aborted
      )
        continue;
      ready(key, URL.createObjectURL(new Blob([data], { type: 'image/png' })));
    } catch {
      /* Optional icons never invalidate equipment evidence. */
    } finally {
      if (reader) void reader.cancel().catch(() => {});
    }
  }
}
