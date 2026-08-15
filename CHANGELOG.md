# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-08-15

### Fixed

- `plan create` crashed with `ENOENT` when the `plans/` directory did not exist yet.

### Changed

- Enriched the `plan create` body template with sub-section headings (Context / Goals / Design / Tasks / Risks / References) and checkbox/dependency stubs for detailed plan authoring.

## [0.1.1] - 2026-08-15

### Changed

- **Breaking**: Store directory renamed from `qtk/` to `.qtk/`.
- **Breaking**: Config file renamed from `config.yml` to `config.yaml`.
- **Breaking**: Internal meta directory renamed from `.qtk/` to `.meta/`.
  - Existing 0.1.0 users need to run `qtk init` again after upgrading.
- `counter.json` is now tracked in git; only `*.lock` files are gitignored.

### Added

- qtk CLI comprehensive skill guide.
- Dogfooding ADRs and issues in the repository store.

### Removed

- `skills/` directory (moved to [masinc/skills](https://github.com/masinc/skills) repo).

## [0.1.0] - 2026-08-14

### Added

- Initial release.
- Commands: `init`, `issue`, `adr`, `spec`, `plan`, `tags`, `search`, `graph`, `web`, `migrate-adr`.
- Atomic file-based ID counter with locking.
- Claim/lease mechanism for parallel work.
- Web UI / Kanban.
- Dependency graph with cycle detection.

[0.1.2]: https://github.com/masinc/qtk/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/masinc/qtk/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/masinc/qtk/releases/tag/v0.1.0