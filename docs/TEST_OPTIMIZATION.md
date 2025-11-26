# Test Suite Optimization

> Strategies for reducing the TicTacStick test suite execution time from ~37 minutes to under 15 minutes.

## Current State

- **26 test spec files** with ~1660 tests
- **Single worker** due to Service Worker conflicts
- **Sequential execution** prevents parallelization
- **3 browser targets** (chromium, firefox, webkit) in CI matrix

## Optimization Strategies Applied

### 1. CI Sharding (Primary Speed Gain)

Tests are now sharded across multiple CI runners:

```yaml
# .github/workflows/ci.yml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    shard: [1, 2, 3, 4]  # 4 shards per browser
```

Each shard runs ~400 tests instead of 1660, reducing time by ~75%.

### 2. Test Isolation Improvements

Service Worker blocking is already enabled:
```javascript
use: {
  serviceWorkers: 'block'
}
```

### 3. Smart Grouping

Tests are organized by execution speed:
- **Fast** (<5s): Unit-like tests (calculations, validation)
- **Medium** (5-15s): Integration tests (storage, export)
- **Slow** (>15s): Full E2E flows (invoice, analytics)

### 4. Timeout Optimization

```javascript
timeout: 30000,           // 30s per test
actionTimeout: 10000,     // 10s for actions
navigationTimeout: 15000  // 15s for navigations
```

### 5. Asset Caching in CI

Playwright browser binaries are cached:
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
```

## Running Tests Locally

### Full Suite (slow, ~37 min)
```bash
npm test
```

### Single Browser (faster, ~12 min)
```bash
npm test -- --project=chromium
```

### Single File (fastest)
```bash
npx playwright test tests/calculations.spec.js
```

### Headed Mode for Debugging
```bash
npm run test:headed
```

### With UI
```bash
npm run test:ui
```

## CI Configuration

The CI workflow (`ci.yml`) uses matrix sharding:

| Browser  | Shard 1 | Shard 2 | Shard 3 | Shard 4 |
|----------|---------|---------|---------|---------|
| Chromium | ~415 tests | ~415 tests | ~415 tests | ~415 tests |
| Firefox  | ~415 tests | ~415 tests | ~415 tests | ~415 tests |
| WebKit   | ~415 tests | ~415 tests | ~415 tests | ~415 tests |

**Total CI runners**: 12 (3 browsers × 4 shards)
**Expected total time**: ~10-12 minutes (parallelized)

## Test Categories

### Unit-Like (fast)
- `calculations.spec.js` - Pricing math
- `data-validation.spec.js` - Input validation
- `quote-validation.spec.js` - Quote rules

### Integration (medium)
- `storage.spec.js` - LocalStorage operations
- `export.spec.js` - PDF/CSV generation
- `import-export.spec.js` - Data import/export

### E2E (slow)
- `invoice-functional.spec.js` - Full invoice workflow
- `analytics.spec.js` - Dashboard interactions
- `task-automation.spec.js` - Scheduling flows

### Visual (isolated)
- `visual-regression.spec.js` - Screenshot comparisons

## Known Issues

### Service Worker Conflicts

Tests use `serviceWorkers: 'block'` to prevent:
- Cache interference between tests
- Registration race conditions
- State leakage across test files

If you see flaky tests related to caching, ensure:
1. `aggressiveCleanup()` is called in test setup
2. ServiceWorker is blocked in Playwright config
3. Tests don't rely on SW-cached responses

### Webkit Limitations

Some tests skip Webkit due to:
- Touch event differences
- Print preview variations
- Permission dialog handling

Mark browser-specific skips:
```javascript
test.skip(browserName === 'webkit', 'Webkit handles this differently');
```

## Future Improvements

1. **Test Splitting by Speed**: Group fast tests in early shards
2. **Dependency Pruning**: Remove unused test fixtures
3. **Parallel Test Files**: Enable `fullyParallel: true` for isolated tests
4. **Container Caching**: Pre-built Docker images with browsers

---

*See also: `playwright.config.js`, `.github/workflows/ci.yml`*
