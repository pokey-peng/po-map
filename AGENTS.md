# AGENTS.md

This file orients agentic coding tools for this repository. It consolidates
commands, configs, and style guidance based on in-repo sources.

## Quick facts

- Package manager: **pnpm** (`package.json` has `packageManager: pnpm@10.14.0`).
- Framework: **Vue 3 + TypeScript** with **Vite**.
- Testing: **Vitest** (unit) and **Playwright** (e2e).
- Formatting: **Prettier** + **EditorConfig**.

## Commands (copy/paste)

### Install

- `pnpm install`

### Dev server

- `pnpm dev` (Vite dev server)

### Build + type-check

- `pnpm build` (runs `run-p type-check "build-only {@}" --`)
- `pnpm type-check` (`vue-tsc --build`)
- `pnpm build-only` (`vite build`)

### Preview

- `pnpm preview`

### Lint + format

- `pnpm lint` (runs `lint:oxlint` and `lint:eslint`)
- `pnpm run lint:eslint` (ESLint)
- `pnpm run lint:eslint -- src/components/HelloWorld.vue` (lint single file)
- `pnpm run lint:oxlint` (Oxlint)
- `pnpm run lint:oxlint -- src/components/HelloWorld.vue` (lint single file)
- `pnpm format` (Prettier on `src/`)

### Unit tests (Vitest)

- `pnpm test:unit`
- Single file: `pnpm vitest src/components/__tests__/HelloWorld.spec.ts`
- Single file via script: `pnpm run test:unit -- src/components/__tests__/HelloWorld.spec.ts`
- By test name: `pnpm run test:unit -- -t "renders properly"`

### E2E tests (Playwright)

- `pnpm test:e2e`
- Single file: `pnpm test:e2e e2e/vue.spec.ts`
- Project: `pnpm test:e2e --project=chromium`
- Debug: `pnpm test:e2e --debug`

> Playwright config starts a dev/preview server using `npm run dev` or
> `npm run preview` depending on CI (see `playwright.config.ts`). The ports
> are 5173 (dev) or 4173 (preview).

## Tooling/config files

- `package.json` (scripts)
- `vite.config.ts` (Vite build/dev, alias, plugins)
- `vitest.config.ts` (Vitest environment, excludes, root)
- `playwright.config.ts` (testDir, projects, webServer)
- `eslint.config.ts` (Vue + TS + Vitest + Playwright + Oxlint)
- `.prettierrc.json` (formatting rules)
- `.editorconfig` (indent/line endings)
- `tsconfig.*.json` (TypeScript project refs and app/vitest/node configs)

## Code style guidelines (evidence-based)

### Formatting

- **No semicolons**; **single quotes**; **print width 100**.
  - Source: `.prettierrc.json`.
- **2-space indentation**, **LF line endings**, **trim trailing whitespace**,
  **insert final newline**.
  - Source: `.editorconfig`.

### Linting conventions

- ESLint is configured with Vue + TypeScript configs and integrates Vitest,
  Playwright, Oxlint; Prettier handles formatting.
  - Source: `eslint.config.ts`.
- Project rules: `no-console` is **off**, `no-debugger` is **warn**,
  `vue/multi-word-component-names` is **off**.

### TypeScript + Vue conventions

- Vue SFCs use `<script setup lang="ts">`.
- TypeScript is used across `src/**` and `.vue` files.
- Alias `@` maps to `./src` for internal imports.
  - Source: `tsconfig.app.json`, `vite.config.ts`.

### Imports

- Prefer `@/` alias for internal modules (e.g., `@/lib/webGL/gl-help`).
- Auto-import is configured for `vue`, `vue-router`, `pinia`, `vue-i18n`,
  `@vueuse/core`, and PrimeVue components.
  - Source: `vite.config.ts` (AutoImport + Components).

### Naming

- **Components**: PascalCase filenames and component names.
- **Functions/variables**: camelCase.
- **Types/interfaces**: PascalCase.
  - Evidence: `src/components/HelloWorld.vue`, `src/lib/webGL/gl-help.ts`,
    `src/hooks/useWebGL.ts`.

### Error handling patterns

- Throw `Error` for fatal precondition failures (e.g., missing canvas/context).
- Use `console.error` for diagnostics (shader compile/link logs).
- For async operations, reject/throw on failure (e.g., `fetch` response check).
  - Evidence: `src/views/webgl/webgl-points.vue`,
    `src/lib/webGL/gl-help.ts`, `src/utils/index.ts`.

## Project architecture summary (from Copilot instructions)

Source: `.github/copilot-instructions.md` (apply these rules).

- **Layout**: `src/layout/` contains main layout with sidebar and content.
- **Routing**: `src/router/index.ts` and `src/router/mapRoutes.ts`.
- **WebGL utilities**: `src/lib/webGL/` (helpers, shaders, matrix tools).
- **Views**: Map-related views are organized by technology in `src/views/`.
- **State**: Pinia store usage in `src/stores/`.
- **UI**: PrimeVue + PrimeUIX themes.
- **i18n**: Vue I18n configured in `src/main.ts`.

## Key files to reference

- `src/main.ts` (app initialization)
- `src/layout/index.vue` (main layout)
- `src/router/index.ts` and `src/router/mapRoutes.ts`
- `src/lib/webGL/gl-help.ts` (WebGL helpers)
- `src/views/webgl/webgl-points.vue` (example WebGL view)

## Testing notes

- Unit tests live under `src/**/__tests__/*` (Vitest config).
- E2E tests live under `e2e/` (Playwright config `testDir`).
- `vitest.config.ts` excludes `e2e/**` from unit runs.

## Contribution checklist (agents)

1. Follow Prettier + EditorConfig rules before committing changes.
2. Prefer `@/` alias for internal imports.
3. Keep Vue SFCs in `<script setup lang="ts">` style.
4. Run `pnpm lint`, `pnpm test:unit`, and `pnpm build` after changes.
5. For E2E changes, run `pnpm test:e2e`.

## Answer Guidelines

- Please Always answer in Chinese.
