# TicTacStick Quote Engine v2.0

Modern PWA quote engine built with Quasar Framework, Vue 3, and TypeScript.

## Features

- 🎯 Professional quoting for window and pressure cleaning
- 📱 Mobile-first, offline-capable PWA
- 🌙 Dark mode support
- 💾 Local storage with sync capabilities
- 📊 Accurate calculations using shared calculation engine
- 🔒 TypeScript for type safety

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **UI Library**: Quasar Framework v2
- **State Management**: Pinia
- **Language**: TypeScript
- **Build Tool**: Vite
- **PWA**: Workbox

## Development

### Prerequisites

- Node.js 20+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
# Standard web build
npm run build

# PWA build
npm run build:pwa

# Native builds (requires Xcode/Android Studio)
npm run build:capacitor
```

### Run Tests

```bash
npm run test
```

## Project Structure

```
apps/quote-engine/
├── src/
│   ├── boot/              # Quasar boot files
│   ├── components/        # Vue components
│   │   └── QuoteBuilder/  # Quote builder components
│   ├── composables/       # Vue composables
│   ├── layouts/           # App layouts
│   ├── pages/             # Route pages
│   ├── router/            # Vue Router config
│   ├── stores/            # Pinia stores
│   └── css/               # Global styles
├── public/                # Static assets
├── src-pwa/               # PWA service worker
└── src-capacitor/         # Capacitor config
```

## Shared Packages

This app uses shared packages from the monorepo:

- `@tictacstick/calculation-engine` - Core calculation logic
- `@tictacstick/ui` - Shared UI components (planned)

## Migration from v1.x

This is a complete rebuild. The v1.x app remains available in the `/v1/` directory for backward compatibility. Key differences:

| Feature | v1.x | v2.0 |
|---------|------|------|
| Framework | Vanilla JS | Vue 3 + Quasar |
| Language | ES5 | TypeScript |
| State | Global `APP` object | Pinia stores |
| Styling | Custom CSS | Quasar + SCSS |
| Build | None (direct load) | Vite |
| Testing | Playwright only | Vitest + Playwright |

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT © 925 Pressure Glass
