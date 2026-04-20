# GitHub Copilot Instructions for po-map Project

## Project Overview
- **Type**: Vue 3 + TypeScript project with multiple map technologies integration
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Key Dependencies**: Vue 3, Vue Router, Pinia, Mapbox GL, Cesium, OpenLayers, Three.js, WebGL, ArcGIS API for JavaScript, Unocss

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
- **Vue 3 Composition API**: Uses `<script setup>` syntax throughout components
- **TypeScript**: Full type safety for all components and utilities
- **WebGL Utilities**: Helper functions in `src/lib/webGL/gl-help.ts` for shader creation and drawing
- **Modular Routes**: Route configuration split into main and map-specific routes
- **Component Organization**: Views organized by map technology

## Key Files to Reference
- **Entry Point**: `src/main.ts` - Application initialization with Vue, Pinia, Router, and PrimeVue
- **Router**: `src/router/index.ts` - Main route configuration, `src/router/mapRoutes.ts` - Map-specific routes
- **WebGL Utils**: `src/lib/webGL/gl-help.ts` - Helper functions for WebGL operations
- **Example WebGL Implementation**: `src/views/webgl/webgl-points.vue` - Interactive point drawing
- **Layout**: `src/layout/index.vue` - Main application layout with sidebar

## Integration Points
- **Map Libraries**: Each map technology has dedicated views and components
- **WebGL**: Custom implementation with shader programs and helper functions
- **UI Components**: PrimeVue integration for consistent UI elements
- **Internationalization**: Vue I18n setup for multi-language support

## Project-Specific Conventions
- **View Organization**: Map-related views grouped by technology (mapbox, webgl, threejs, cesium, ol)
- **WebGL Usage**: Custom helper functions for shader creation, buffer management, and drawing operations
- **Route Configuration**: Nested routes with layout-based navigation structure
- **TypeScript Usage**: Strict typing for all components, utilities, and function parameters
- **Styling**: Unocss for utility-first CSS, Use utility classes for layout and styling, then override with custom CSS when necessary

## External Dependencies
- **Map Libraries**: Mapbox GL, Cesium, OpenLayers, Three.js
- **WebGL Tools**: twgl.js, gl-matrix
- **UI Components**: PrimeVue, PrimeUIX Themes
- **Animation**: GSAP
- **Color**: chroma-js
- **State Management**: Pinia
- **Internationalization**: Vue I18n

## Development Tips
- **Use TypeScript**: Leverage the full type system for better code completion and error checking
- **WebGL Helpers**: Use the custom WebGL utilities for consistent shader creation and drawing
- **Route Organization**: Follow the existing pattern for adding new map-related routes
- **Component Structure**: Keep map-specific components organized by technology
- **Testing**: Write unit tests for utilities and e2e tests for critical user flows

## Troubleshooting
- **WebGL Issues**: Check shader compilation errors in the browser console
- **Map Library Integration**: Ensure proper CSS imports and initialization for each map library
- **Cesium**: Verify the `CESIUM_BASE_URL` is correctly set
- **TypeScript Errors**: Run `pnpm type-check` to identify and fix type issues
- **Linting**: Use `pnpm lint` to maintain code quality and consistency

## Git Conventions
- **Commit Messages**: Use clear and descriptive commit messages following the Conventional Commits format;Alawys write commit messages in Chinese for better collaboration and understanding across the team.
