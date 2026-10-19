# ffxiv-chara

A planned open source TypeScript library for reading and inspecting Final Fantasy XIV `.chara` files used by Anamnesis, Ktisis, and Brio.

**Status: planning only.** Implementation has not started. This repository currently contains the implementation plan and this README.

The proposed MVP includes:

- Typed inspection of character appearance, equipment, dye channels, and facewear.
- Appearance swatches backed by versioned creator and shader palettes.
- Optional XIVAPI equipment resolution with matching candidates and explicit failure states.
- A small website demonstrating the library's public API with local files and anonymized examples.

Editing and writing `.chara` files are deferred to a later version. No package has been published and no demo has been deployed.

See the [MVP implementation plan](docs/plans/2026-10-19-chara-library-mvp.md) for scope, proposed interfaces, tasks, validation, and the resume checklist. Committing or reviewing the plan does not authorize implementation; that requires explicit direction.
