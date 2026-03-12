# GitHub Copilot Instructions for po-map Project

## Project Overview
- **Type**: Vue 3 + TypeScript project with multiple map technologies integration
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Key Dependencies**: Vue 3, Vue Router, Pinia, Mapbox GL, Cesium, OpenLayers, Three.js, WebGL

## Architecture
- **Layout System**: Main layout with sidebar and content areas (`src/layout/`)
- **Routing**: Nested routes with map-related views organized in `src/router/mapRoutes.ts`
- **WebGL Implementation**: Custom utilities in `src/lib/webGL/`
- **Map Libraries Integration**: Separate views for each map technology in `src/views/`

## Development Workflows
- **Development Server**: `pnpm dev`
- **Build**: `pnpm build`
- **Testing**: `pnpm test:unit` (Vitest), `pnpm test:e2e` (Playwright)
- **Linting**: `pnpm lint` (ESLint + Oxlint)
- **Formatting**: `pnpm format` (Prettier)

## Code Patterns
- **Vue 3 Composition API**: Uses `<script setup>` syntax
- **TypeScript**: Full type safety throughout the codebase
- **WebGL Utilities**: Helper functions in `src/lib/webGL/gl-help.ts`
- **Modular Routes**: Route configuration split into main and map-specific routes
- **Component Organization**: Views organized by map technology

## Key Files to Reference
- **Entry Point**: `src/main.ts`
- **Router**: `src/router/index.ts`, `src/router/mapRoutes.ts`
- **WebGL Utils**: `src/lib/webGL/gl-help.ts`
- **Example WebGL Implementation**: `src/views/webgl/webgl-points.vue`
- **Layout**: `src/layout/index.vue`

## Integration Points
- **Map Libraries**: Each map technology has dedicated views and components
- **WebGL**: Custom implementation with shader programs and helper functions
- **UI Components**: PrimeVue integration for consistent UI elements
- **Internationalization**: Vue I18n setup for multi-language support

## Project-Specific Conventions
- **View Organization**: Map-related views grouped by technology
- **WebGL Usage**: Custom helper functions for shader creation and drawing
- **Route Configuration**: Nested routes with layout-based navigation
- **TypeScript Usage**: Strict typing for all components and utilities

## External Dependencies
- **Map Libraries**: Mapbox GL, Cesium, OpenLayers, Three.js
- **WebGL Tools**: twgl.js, gl-matrix
- **UI**: PrimeVue, PrimeUIX Themes
- **Animation**: GSAP
- **Color**: chroma-js

## Answer Guidelines
- Please always answer in Chinese.

## Core Responsibilities
- Provide high-quality and secure code suggestions
- Adhere to the latest programming best practices
- The code must include clear comments
## Output Standards
- Code blocks must specify the language type
- Provide complete runnable examples
- Important concepts should be marked in bold
## Technical Preferences
- Strong preference for modern syntax (ES6+/TypeScript)
- Consider performance and maintainability
- Follow SOLID principles
## Safety Alert
- Alert about potential security risks
- Avoid hard-coding sensitive information
- Recommend secure coding practices

The instructions will be concise, actionable, and focused on helping AI agents understand the codebase structure, development workflows, and key patterns to be immediately productive.
