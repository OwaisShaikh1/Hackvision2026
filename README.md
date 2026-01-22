# Hackvision2026 SDK (JavaScript)

This repository contains the JavaScript SDK for Hackvision2026.

## Quickstart

```javascript
import { SmartOffline } from "./src/index.js";

SmartOffline.init({
  pages: ["/dashboard", "/profile"],
  apis: ["/api/user", "/api/data"],
  debug: true,
});
```

See `examples/` for a runnable example.

## Priority Tuning Options

You can fine-tune how the SDK decides caching priority:

| Option              | Type                                      | Default       | Description                                                                 |
|---------------------|-------------------------------------------|---------------|-----------------------------------------------------------------------------|
| `frequencyThreshold`| `number`                                  | `3`           | Number of accesses before a resource is considered "frequent"               |
| `recencyThreshold`  | `number` (ms)                             | `86400000` (24h) | Milliseconds within which a resource is considered "recent"              |
| `maxResourceSize`   | `number` (bytes)                          | `Infinity`    | Max bytes to cache per resource; larger resources are skipped               |
| `networkQuality`    | `'auto'` \| `'fast'` \| `'slow'`          | `'auto'`      | Affects caching aggressiveness; `'auto'` uses Network Information API       |
| `significance`      | `{ [urlPattern: string]: 'high' \| 'normal' \| 'low' }` | `{}`   | Manual priority overrides per URL pattern                                   |

### Example with all options

```javascript
SmartOffline.init({
  pages: ["/dashboard"],
  apis: ["/api/"],
  debug: true,

  // Priority tuning
  frequencyThreshold: 5,         // require 5 accesses to be "frequent"
  recencyThreshold: 12 * 60 * 60 * 1000, // 12 hours
  maxResourceSize: 500 * 1024,   // skip caching resources > 500 KB
  networkQuality: "auto",        // or 'fast' / 'slow'
  significance: {
    "/api/critical": "high",     // always high priority
    "/api/analytics": "low",     // always low priority
  },
});
```

## Installation

### From npm (after publishing)

```bash
npm install @soham20/smart-offline-sdk
```

### Directly from GitHub

```bash
npm install git+https://github.com/OwaisShaikh1/Hackvision2026.git
```
