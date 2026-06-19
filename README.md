# @elfennol/env-to-js

Read runtime config injected as `<script type="application/json">` tags, with full TypeScript typing.

Designed to work with [`elfennol/env-to-js-symfony-bundle`](https://github.com/elfennol/env-to-js-symfony-bundle), but usable with any backend that injects JSON script tags.

## Installation

```bash
npm install @elfennol/env-to-js
```

## Usage

```ts
import { createConfigReader } from '@elfennol/env-to-js';

type AppConfig = {
  apiBaseUrl: string;
  cdnBaseUrl: string;
};

const getAppConfig = createConfigReader<AppConfig>('#rc-app');

getAppConfig('apiBaseUrl');  // string
getAppConfig('cdnBaseUrl');  // string
```

The selector passed to `createConfigReader` must match the `id` attribute of the injected `<script>` tag:

```html
<script type="application/json" id="rc-app">{"apiBaseUrl":"https://api.example.com"}</script>
```

## API

### `createConfigReader<T>(selector)`

Returns a typed getter function for the config block identified by `selector`.

- Parses the JSON on the first key access, then caches the result for the lifetime of the reader instance.
- Multiple readers are fully independent — each has its own cache.

```ts
const getAppConfig = createConfigReader<AppConfig>('#rc-app');
const getMapConfig = createConfigReader<MapConfig>('#rc-map');
```

### `EnvToJsError`

Thrown when the element is not found or the JSON is invalid. The message is actionable:

```
EnvToJsError: element "#rc-app" not found. Make sure a <script type="application/json"> tag matching this selector is present in your HTML.
EnvToJsError: failed to parse JSON in element "#rc-app": Unexpected token
```

These are configuration errors — they indicate a missing or malformed script tag, not a runtime condition to recover from. Let them bubble up so they are visible immediately.

For advanced use cases (centralised logging, error monitoring), `instanceof EnvToJsError` lets you distinguish them from other errors:

```ts
import { createConfigReader, EnvToJsError } from '@elfennol/env-to-js';

window.addEventListener('error', (event) => {
  if (event.error instanceof EnvToJsError) {
    reportToMonitoring(event.error.message);
  }
});
```

## With the Symfony bundle

Once [`elfennol/env-to-js-symfony-bundle`](https://github.com/elfennol/env-to-js-symfony-bundle) is installed and `env_to_js_scripts()` is added to your base template, the bundle injects a `<script>` tag per provider on each request:

```html
<script type="application/json" id="rc-app">{"apiBaseUrl":"https://api.example.com"}</script>
```

Read it in TypeScript:

```ts
import { createConfigReader } from '@elfennol/env-to-js';

const getAppConfig = createConfigReader<{ apiBaseUrl: string }>('#rc-app');

fetch(getAppConfig('apiBaseUrl') + '/users');
```

## Requirements

- TypeScript >= 5.0
- Zero dependencies
- Compatible with any bundler (Vite, Webpack, esbuild, Rollup) and vanilla JS

## Development

```bash
npm run qa            # lint + typecheck + test
npm run lint          # ESLint only
npm run typecheck     # TypeScript type check only
npm test              # jest only
```

## License

MIT
