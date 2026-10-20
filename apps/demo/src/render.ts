import type { Field, JsonValue } from 'ffxiv-chara';
import { EQUIPMENT_SLOTS } from 'ffxiv-chara';
import type { AppearanceSlot } from 'ffxiv-chara/appearance';
import { getDyeName } from 'ffxiv-chara/dyes';
import type { EquipmentCandidate } from 'ffxiv-chara/xivapi';
import { iconKey } from './icons.js';
import type { DemoSession } from './state.js';
import type { DemoState } from './types.js';

const slots: [AppearanceSlot, string][] = [
  ['leftEye', 'Left eye'],
  ['rightEye', 'Right eye'],
  ['hair', 'Hair'],
  ['highlights', 'Highlights'],
  ['skin', 'Skin'],
  ['limbal', 'Limbal / tattoo'],
  ['lip', 'Lip'],
  ['facePaint', 'Face paint'],
];
const gearLabels = {
  MainHand: 'Main hand',
  OffHand: 'Off hand',
  HeadGear: 'Head',
  Body: 'Body',
  Hands: 'Hands',
  Legs: 'Legs',
  Feet: 'Feet',
  Ears: 'Ears',
  Neck: 'Neck',
  Wrists: 'Wrists',
  LeftRing: 'Left ring',
  RightRing: 'Right ring',
};
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(
  label: string,
  action: () => void,
  className = 'button',
): HTMLButtonElement {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}
function field(value: Field<unknown> | undefined): string {
  return !value || value.state === 'absent'
    ? 'Not stored'
    : value.state === 'null'
      ? 'null'
      : value.state === 'valid'
        ? String(value.value)
        : value.state === 'unsupported'
          ? 'Unsupported'
          : 'Invalid';
}
function dye(value: Field<number>): string {
  if (value.state !== 'valid') return field(value);
  const id = value.value;
  const name = id === 0 ? 'No dye' : (getDyeName(id) ?? 'Unknown dye');
  return `${name} (${id})`;
}
function disclosure(
  title: string,
  id: string,
): { details: HTMLDetailsElement; body: HTMLDivElement } {
  const details = el('details');
  details.id = id;
  details.append(el('summary', '', title));
  const body = el('div', 'detail-body');
  details.append(body);
  return { details, body };
}
function pairs(container: HTMLElement, values: [string, string][]): void {
  const list = el('dl', 'pairs');
  for (const [label, value] of values)
    list.append(el('dt', '', label), el('dd', 'mono', value));
  container.append(list);
}
function textPreview(value: string): string {
  return value.length > 2048
    ? `${value.slice(0, 2048)}… (preview truncated)`
    : value;
}
function rawPage(
  container: HTMLElement,
  value: Record<string, JsonValue> | JsonValue[],
  path: string,
  offset = 0,
): void {
  const keys = Object.keys(value);
  const nodes: HTMLElement[] = [];
  for (const [i, key] of keys.slice(offset, offset + 200).entries()) {
    const child = (value as Record<string, JsonValue>)[key];
    const entry = el('div', 'raw-entry');
    if (child !== null && typeof child === 'object') {
      const { details, body } = disclosure(
        `${key} — ${Array.isArray(child) ? 'Array' : 'Object'}`,
        `${path}-${offset + i}`,
      );
      let built = false;
      details.addEventListener('toggle', () => {
        if (details.open && !built) {
          built = true;
          rawPage(body, child, details.id);
        }
      });
      entry.append(details);
    } else {
      const scalar =
        typeof child === 'string'
          ? JSON.stringify(child.slice(0, 2048))
          : String(child);
      const truncated = typeof child === 'string' && child.length > 2048;
      entry.append(
        el('span', 'raw-key', key),
        el(
          'code',
          '',
          scalar.length > 2048 || truncated
            ? `${scalar.slice(0, 2048)}… (preview truncated)`
            : scalar,
        ),
      );
    }
    nodes.push(entry);
  }
  const pager = el('div', 'raw-pagination');
  const range = el(
    'p',
    'caption',
    `Fields ${keys.length ? offset + 1 : 0}–${Math.min(offset + 200, keys.length)} of ${keys.length}`,
  );
  range.setAttribute('role', 'status');
  pager.append(range);
  if (offset > 0)
    pager.append(
      button(
        'Show previous 200 fields',
        () => rawPage(container, value, path, Math.max(0, offset - 200)),
        'button quiet',
      ),
    );
  if (offset + 200 < keys.length)
    pager.append(
      button(
        'Show next 200 fields',
        () => rawPage(container, value, path, offset + 200),
        'button quiet',
      ),
    );
  container.replaceChildren(...nodes, pager);
}
function icon(
  container: HTMLElement,
  id: number | null,
  version: string | null | undefined,
): void {
  if (!id || !version) return;
  const node = el('span', 'item-icon');
  node.dataset.iconKey = iconKey(id, version);
  container.append(node);
}
export function renderIcons(root: HTMLElement, state: DemoState): void {
  for (const target of root.querySelectorAll<HTMLElement>('[data-icon-key]')) {
    const url = state.icons.get(target.dataset.iconKey ?? '');
    if (!url || target.childElementCount) continue;
    const image = el('img');
    image.alt = '';
    image.width = 32;
    image.height = 32;
    image.referrerPolicy = 'no-referrer';
    image.src = url;
    image.addEventListener(
      'error',
      () => {
        image.remove();
        target.textContent = '—';
      },
      { once: true },
    );
    target.append(image);
  }
}
function candidates(
  cell: HTMLTableCellElement,
  rows: EquipmentCandidate[],
  status: string,
  slot: string,
  version: string | null | undefined,
): void {
  const labels: Record<string, string> = {
    matched: 'Matched',
    notFound: 'No matching item',
    partial: 'Partial results',
    unavailable: 'Unavailable',
    cancelled: 'Cancelled',
  };
  cell.append(
    el(
      'span',
      `resolution-status ${status}`,
      labels[status] ?? 'Not requested',
    ),
  );
  const first = rows[0];
  if (!first) return;
  const primary = el('div', 'primary-item');
  icon(primary, first.iconId, version);
  primary.append(el('span', '', first.names.en ?? `Item ${first.itemId}`));
  cell.append(primary);
  const { details, body } = disclosure(
    `${rows.length} ${rows.length === 1 ? 'candidate' : 'candidates'}`,
    `candidates-${slot}`,
  );
  let offset = 0;
  const draw = () => {
    const list = el('ol', 'candidate-list');
    list.start = offset + 1;
    for (const row of rows.slice(offset, offset + 10)) {
      const item = el('li');
      item.append(
        el('strong', '', row.names.en ?? `Item ${row.itemId}`),
        el(
          'div',
          'mono',
          `Item ${row.itemId}${row.viaMainHand ? ' · via main hand' : ''}`,
        ),
      );
      pairs(item, [
        [
          'Dye channels',
          row.rules.dyeCount === null ? 'Unknown' : String(row.rules.dyeCount),
        ],
        [
          'Glamour',
          row.rules.glamourable === null
            ? 'Unknown'
            : row.rules.glamourable
              ? 'Allowed'
              : 'Restricted',
        ],
        [
          'Company',
          row.rules.grandCompany === null
            ? 'Unknown'
            : String(row.rules.grandCompany),
        ],
      ]);
      list.append(item);
    }
    body.replaceChildren(list);
    if (offset > 0)
      body.append(
        button(
          'Show previous 10 candidates',
          () => {
            offset -= 10;
            draw();
          },
          'button quiet',
        ),
      );
    if (offset + 10 < rows.length)
      body.append(
        button(
          'Show next 10 candidates',
          () => {
            offset += 10;
            draw();
          },
          'button quiet',
        ),
      );
  };
  details.addEventListener('toggle', () => {
    if (details.open && !body.childElementCount) draw();
  });
  cell.append(details);
}
let previousInspection: DemoState['inspection'] = null;
export function render(root: HTMLElement, session: DemoSession): void {
  const state = session.state;
  const opened =
    state.inspection === previousInspection
      ? [...root.querySelectorAll<HTMLDetailsElement>('details[open]')].map(
          (d) => d.id,
        )
      : [];
  previousInspection = state.inspection;
  const focus = document.activeElement?.id;
  const header = el('header', 'masthead');
  header.append(
    el('span', 'wordmark', 'ffxiv-chara'),
    el('span', 'demo-label', 'Library demo'),
  );
  const shell = el('div', 'shell');
  const rail = el('aside', 'rail');
  rail.setAttribute('aria-label', 'File controls');
  rail.append(el('h2', '', 'Character file'));
  const fileArea = el('div', 'file-area');
  const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  glyph.setAttribute('viewBox', '0 0 48 48');
  glyph.setAttribute('aria-hidden', 'true');
  glyph.classList.add('file-glyph');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M29 4H12a3 3 0 0 0-3 3v34a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3V14L29 4Zm0 0v10h10M24 35V20m-7 7 7-7 7 7',
  );
  glyph.append(path);
  const input = el('input', 'file-input');
  input.type = 'file';
  input.accept = '.chara';
  input.id = 'file-input';
  input.tabIndex = -1;
  input.setAttribute('aria-label', 'Character file');
  input.addEventListener('change', () => {
    const selected = input.files?.[0];
    if (selected) session.load(selected);
  });
  const choose = button(
    'Choose .chara file',
    () => input.click(),
    'button primary',
  );
  choose.id = 'choose-file';
  fileArea.append(glyph, choose, input, el('p', 'caption', 'Up to 8 MiB'));
  rail.append(fileArea);
  if (state.fileName) {
    rail.append(el('div', 'filename', state.fileName));
    const clear = button('Clear file', () => session.clear(), 'text-button');
    clear.id = 'clear-file';
    rail.append(clear);
  }
  const examples = el('div', 'examples');
  examples.append(el('h3', '', 'Try an example'));
  for (const [label, key] of [
    ['Anamnesis', 'anamnesis'],
    ['Ktisis', 'ktisis'],
    ['Brio', 'brio'],
  ] as const)
    examples.append(
      button(
        label,
        () => {
          void session.example(key);
        },
        'button quiet',
      ),
    );
  rail.append(
    examples,
    el(
      'p',
      'privacy',
      'Your file stays in this browser. Equipment lookup sends model IDs to XIVAPI only when you choose.',
    ),
  );
  const main = el('main', 'workspace');
  main.append(
    el('h1', '', 'Inspect a character file'),
    el('p', 'intro', 'Local inspection for Anamnesis, Ktisis and Brio.'),
  );
  const live = el('p', 'local-status', state.localStatus);
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  rail.append(live);
  if (state.error) {
    const alert = el('p', 'error', state.error);
    alert.setAttribute('role', 'alert');
    main.append(alert);
  }
  const inspection = state.inspection;
  if (!inspection) {
    const empty = el('section', 'empty');
    empty.append(
      el('h2', '', 'A file, not an upload.'),
      el(
        'p',
        '',
        'Choose a .chara file to inspect stored appearance and equipment. Synthetic examples are available on the left. No editing or image decoding is performed.',
      ),
    );
    main.append(empty);
  } else {
    const identity = el('section', 'identity');
    identity.dataset.testid = 'identity';
    identity.setAttribute('aria-label', 'Character information');
    identity.append(
      el(
        'h2',
        'identity-title',
        inspection.metadata.Nickname?.state === 'valid'
          ? textPreview(String(inspection.metadata.Nickname.value))
          : 'Character inspection',
      ),
    );
    const values = el('dl', 'identity-values');
    for (const [name, value] of [
      ['Race', inspection.identity.canonicalRace ?? 'Not stored'],
      ['Tribe', field(inspection.identity.tribe)],
      ['Gender', field(inspection.identity.gender)],
    ]) {
      const item = el('div');
      item.append(el('dt', '', name), el('dd', 'mono', value));
      values.append(item);
    }
    identity.append(values);
    main.append(identity);
    const appearance = el('section', 'appearance');
    appearance.append(
      el('h2', '', 'Appearance'),
      el(
        'p',
        'section-note',
        `Creator + shader palettes · Source ${state.appearance?.paletteMetadata?.gameVersion ?? (state.appearanceStatus === 'unavailable' ? 'unavailable' : 'loading')}`,
      ),
    );
    const grid = el('div', 'swatches');
    grid.dataset.testid = 'swatches';
    for (const [key, label] of slots) {
      const value = state.appearance?.slots[key];
      const tile = el('article', 'swatch');
      tile.dataset.testid = `swatch-${key}`;
      tile.append(el('h3', '', label));
      const display = el('div', 'swatch-display');
      const canvas = el('canvas');
      canvas.width = 48;
      canvas.height = 48;
      canvas.setAttribute(
        'aria-label',
        `${label}: ${value?.displayHex ?? 'no display color'}`,
      );
      canvas.setAttribute('role', 'img');
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle =
          value?.displayHex && /^#[A-F0-9]{6}$/.test(value.displayHex)
            ? value.displayHex
            : '#D5DCDE';
        context.fillRect(0, 0, 48, 48);
      }
      const text = el('div');
      text.append(
        el(
          'div',
          'mono',
          value?.displayHex ??
            (value?.interpretation === 'inactive'
              ? 'Inactive'
              : state.appearance
                ? 'Not available'
                : state.appearanceStatus === 'unavailable'
                  ? 'Unavailable'
                  : 'Loading…'),
        ),
        el(
          'p',
          'caption',
          !value
            ? state.appearanceStatus === 'unavailable'
              ? 'Evidence unavailable'
              : 'Loading evidence'
            : {
                palette: 'Creator palette',
                offGrid: 'Extended · off-grid',
                extendedOnly: 'Extended only',
                inactive: 'Inactive',
                unresolved: 'Unresolved',
              }[value.interpretation],
        ),
      );
      display.append(canvas, text);
      tile.append(display);
      const evidence = disclosure('Color evidence', `color-${key}`);
      if (value)
        pairs(evidence.body, [
          ['Stored index', field(value.storedIndex)],
          ['Creator', value.creatorHex ?? 'Not available'],
          ['Shader', value.shaderHex ?? 'Not available'],
          ['Extended', value.extendedHex ?? 'Not stored'],
          ['Extended active', String(value.extendedActive)],
          ['Reason', value.reason],
          ['Correction', value.correction ?? 'None'],
        ]);
      tile.append(evidence.details);
      grid.append(tile);
    }
    appearance.append(grid);
    main.append(appearance);
    const equipment = el('section', 'equipment');
    equipment.dataset.testid = 'equipment';
    const top = el('div', 'section-top');
    top.append(el('h2', '', 'Equipment'));
    const actions = el('div', 'actions');
    const resolve = button(
      'Resolve equipment',
      () => {
        void session.resolve();
      },
      'button primary',
    );
    resolve.id = 'resolve-equipment';
    resolve.disabled = state.reading || state.lookingUp;
    actions.append(resolve);
    if (state.lookingUp)
      actions.append(
        button('Cancel lookup', () => session.cancelLookup(), 'button quiet'),
      );
    top.append(actions);
    equipment.append(
      top,
      el('p', 'section-note', 'Optional lookup sends equipment IDs to XIVAPI.'),
    );
    if (state.lookupMessage) {
      const status = el('p', 'lookup-status', state.lookupMessage);
      status.setAttribute('role', 'status');
      equipment.append(status);
    }
    const wrap = el('div', 'table-wrap');
    const table = el('table');
    table.setAttribute('aria-label', 'Stored equipment and item candidates');
    const head = el('thead');
    const headings = el('tr');
    for (const text of ['Slot', 'Stored model', 'Dyes', 'Item candidates']) {
      const th = el('th', '', text);
      th.scope = 'col';
      headings.append(th);
    }
    head.append(headings);
    table.append(head);
    const body = el('tbody');
    for (const slot of EQUIPMENT_SLOTS) {
      const stored = inspection.equipment[slot];
      if (stored.status === 'absent') continue;
      const row = el('tr');
      const name = el('th', '', gearLabels[slot]);
      name.scope = 'row';
      row.append(name);
      row.append(
        el(
          'td',
          'mono',
          stored.model
            ? [stored.model.set, stored.model.base, stored.model.variant]
                .filter((v) => v !== undefined)
                .join(' / ')
            : stored.status,
        ),
      );
      const dyeCell = el('td', 'dye-channels');
      dyeCell.append(
        el('div', '', `1: ${dye(stored.dye1)}`),
        el('div', '', `2: ${dye(stored.dye2)}`),
      );
      row.append(dyeCell);
      const itemCell = el('td');
      const found = state.resolution?.items[slot];
      if (found)
        candidates(
          itemCell,
          found.candidates,
          found.status,
          slot,
          state.resolution?.upstream.items?.version,
        );
      else
        itemCell.textContent =
          stored.status === 'empty'
            ? 'Empty slot'
            : state.lookingUp
              ? 'Looking up…'
              : 'Not requested';
      row.append(itemCell);
      body.append(row);
    }
    if (inspection.facewear.state !== 'absent') {
      const row = el('tr');
      const name = el('th', '', 'Facewear');
      name.scope = 'row';
      row.append(
        name,
        el('td', 'mono', field(inspection.facewear)),
        el('td', '', '—'),
      );
      const item = el('td');
      const found = state.resolution?.facewear;
      const first = found?.candidates[0];
      if (found) {
        item.append(
          el(
            'span',
            '',
            found.status === 'matched'
              ? 'Matched'
              : found.status === 'notFound'
                ? 'No matching facewear'
                : found.status === 'partial'
                  ? 'Partial results'
                  : found.status === 'cancelled'
                    ? 'Cancelled'
                    : 'Unavailable',
          ),
        );
        if (first) {
          const primary = el('div', 'primary-item');
          icon(
            primary,
            first.iconId,
            state.resolution?.upstream.facewear?.version,
          );
          primary.append(
            el('span', '', first.names.en ?? `Glasses ${first.rowId}`),
          );
          item.append(primary);
        }
      } else
        item.textContent =
          inspection.facewear.value === 0
            ? 'Empty'
            : state.lookingUp
              ? 'Looking up…'
              : 'Not requested';
      row.append(item);
      body.append(row);
    }
    table.append(body);
    wrap.append(table);
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute(
      'aria-label',
      'Equipment table; scroll horizontally on small screens',
    );
    equipment.append(wrap, el('p', 'caption', 'Other slots were not saved.'));
    equipment.append(
      el(
        'p',
        'mobile-hint caption',
        'Scroll the table to view item candidates.',
      ),
    );
    if (state.resolution) {
      const evidence = el('p', 'lookup-evidence mono');
      evidence.dataset.testid = 'lookup-evidence';
      for (const [scope, identity] of Object.entries(state.resolution.upstream))
        if (identity)
          evidence.append(
            el(
              'span',
              '',
              `${scope}: ${identity.version ?? 'unknown version'} · ${identity.schema ?? 'unknown schema'}`,
            ),
          );
      equipment.append(evidence);
    }
    main.append(equipment);
    const raw = disclosure('Stored values', 'stored-details');
    raw.details.classList.add('stored');
    raw.body.dataset.testid = 'stored-values';
    raw.details
      .querySelector('summary')
      ?.replaceChildren(
        el('span', '', 'Stored values'),
        el(
          'span',
          'stored-hint caption',
          'View the admitted fields without changing the file.',
        ),
      );
    let rawBuilt = false;
    raw.details.addEventListener('toggle', () => {
      if (raw.details.open && !rawBuilt) {
        rawBuilt = true;
        rawPage(raw.body, inspection.document.fields, 'raw');
      }
    });
    main.append(raw.details);
    const diagnostics = el('section', 'diagnostics');
    diagnostics.append(el('h2', '', 'Diagnostics'));
    const issues = [
      ...inspection.issues,
      ...(state.appearance?.issues ?? []),
      ...(state.resolution?.issues ?? []),
    ];
    if (!issues.length)
      diagnostics.append(el('p', 'caption', 'No blocking issues.'));
    else {
      const details = disclosure(
        `${issues.length} diagnostics`,
        'diagnostics-list',
      );
      for (const issue of issues.slice(0, 64))
        details.body.append(
          el(
            'p',
            'caption',
            `${issue.code} · ${issue.path.join('.')} · ${issue.message}`,
          ),
        );
      if (issues.length > 64)
        details.body.append(
          el('p', 'caption', 'Additional diagnostics omitted.'),
        );
      diagnostics.append(details.details);
    }
    main.append(diagnostics);
  }
  shell.append(rail, main);
  root.replaceChildren(header, shell);
  renderIcons(root, state);
  for (const id of opened) {
    const node = document.getElementById(id);
    if (node instanceof HTMLDetailsElement) node.open = true;
  }
  if (focus) document.getElementById(focus)?.focus({ preventScroll: true });
}
