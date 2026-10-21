function check(value: unknown, label: string): asserts value {
  if (!value) throw new Error(`Runtime smoke: ${label}`);
}

/** The same installed-package probe runs in Node, browsers, and workerd. */
export async function smoke() {
  let unexpectedNetwork = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    unexpectedNetwork++;
    throw new Error('Unexpected native fetch');
  };
  try {
    const [main, palettes, appearance, dyes, xivapi] = await Promise.all([
      import('xivcharakit'),
      import('xivcharakit/palettes'),
      import('xivcharakit/appearance'),
      import('xivcharakit/dyes'),
      import('xivcharakit/xivapi'),
    ]);
    const input =
      '{"Tribe":"Midlander","Gender":"Masculine","LEyeColor":0,"Body":{"ModelBase":361,"ModelVariant":5,"DyeId":3,"DyeId2":0},"Base64Image":"OMITTED","__proto__":{"safe":true}}';
    const document = main.readChara(new TextEncoder().encode(input));
    check(Object.getPrototypeOf(document.fields) === null, 'inert document');
    check(!('Base64Image' in document.fields), 'image omission');
    const inspected = main.inspectChara(document);
    check(inspected.identity.canonicalRace === 'Hyur', 'identity');
    const model = inspected.equipment.Body.model;
    check(model && main.modelKey(model) === '328041', 'model arithmetic');
    check(inspected.equipment.Body.dye1.value === 3, 'stored dye');
    const provider = palettes.createDefaultPaletteProvider();
    check(
      (await provider.getColor({ table: 'shader', palette: 'eyes', index: 0 }))
        ?.hex === '#F7F7F7',
      'lazy palette',
    );
    const interpreted = await appearance.resolveAppearance(inspected, {
      palettes: provider,
    });
    check(interpreted.slots.leftEye.displayHex === '#F7F7F7', 'appearance');
    check(
      (await dyes.createDyeNameResolver().resolve([])).status === 'complete',
      'empty dye lookup',
    );
    const idleClient = xivapi.createXivapiClient();
    const idleResolver = xivapi.createXivapiResolver();
    check(
      (await idleClient.searchItems([])).status === 'complete',
      'empty transport',
    );
    check(
      Object.keys((await idleResolver.resolve({ models: [] })).items).length ===
        0,
      'empty resolver',
    );
    const version = '0123456789abcdef';
    const schema = `exdschema@2:rev:${'a'.repeat(40)}`;
    const requests: string[] = [];
    let dyeRequests = 0;
    const dyeResolver = dyes.createDyeNameResolver({
      version,
      schema,
      languages: ['en'],
      fetch: async (input, init) => {
        const url = new URL(String(input));
        check(
          url.pathname === '/api/sheet/Stain' &&
            url.searchParams.get('rows') === '3',
          'Stain-only request',
        );
        check(init?.credentials === 'omit', 'dye credentials omitted');
        dyeRequests++;
        return new Response(
          JSON.stringify({
            version,
            schema,
            rows: [{ row_id: 3, fields: { 'Name@lang(en)': 'Synthetic dye' } }],
          }),
        );
      },
    });
    const dyeResult = await dyeResolver.resolve([3]);
    check(dyeResult.rows[0]?.names.en === 'Synthetic dye', 'mocked dye name');
    await dyeResolver.resolve([3, 3]);
    check(dyeRequests === 1, 'cached dye lookup');
    const resolver = xivapi.createXivapiResolver({
      version,
      cache: xivapi.createMemoryCache(),
      fetch: async (input, init) => {
        const url = new URL(String(input));
        check(url.origin === 'https://v2.xivapi.com', 'fixed API origin');
        check(
          init?.credentials === 'omit' && init.referrerPolicy === 'no-referrer',
          'minimal transport',
        );
        check(
          url.pathname === '/api/search' ||
            url.pathname === '/api/sheet/Glasses',
          'fixed API paths',
        );
        if (url.pathname === '/api/search')
          check(
            url.searchParams.get('query')?.includes('328041'),
            'equipment-only query',
          );
        requests.push(url.pathname);
        return new Response(
          JSON.stringify({
            version,
            schema,
            [url.pathname === '/api/search' ? 'results' : 'rows']: [],
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      },
    });
    const result = await resolver.resolve({ models: [model], glassesId: 12 });
    check(
      result.items.Body?.status === 'notFound' &&
        result.facewear?.status === 'notFound',
      'mocked item/facewear resolution',
    );
    check(
      result.upstream.items?.version === version &&
        result.upstream.facewear?.schema === schema,
      'upstream evidence',
    );
    check(requests.length === 2, 'bounded mocked requests');
    check(
      unexpectedNetwork === 0,
      'zero native network on imports and local operations',
    );
    return {
      entries: 5,
      identity: 'Hyur',
      model: '328041',
      eye: '#F7F7F7',
      dye: 'Synthetic dye',
      mockedRequests: requests.length,
      unexpectedNetwork,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}
