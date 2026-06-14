import { createConfigReader, EnvToJsError } from '../src';

function injectScript(id: string, content: string): HTMLScriptElement {
  const el = document.createElement('script');
  el.type = 'application/json';
  el.id = id;
  el.textContent = content;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createConfigReader', () => {
  describe('happy path', () => {
    it('returns the correct value for a given key', () => {
      injectScript('rc-app', JSON.stringify({ apiUrl: 'https://api.example.com' }));
      const get = createConfigReader<{ apiUrl: string }>('#rc-app');
      expect(get('apiUrl')).toBe('https://api.example.com');
    });

    it('supports numeric and boolean values', () => {
      injectScript('rc-app', JSON.stringify({ timeout: 3000, debug: false }));
      const get = createConfigReader<{ timeout: number; debug: boolean }>('#rc-app');
      expect(get('timeout')).toBe(3000);
      expect(get('debug')).toBe(false);
    });

    it('supports nested objects', () => {
      injectScript('rc-app', JSON.stringify({ flags: { beta: true } }));
      const get = createConfigReader<{ flags: { beta: boolean } }>('#rc-app');
      expect(get('flags')).toEqual({ beta: true });
    });
  });

  describe('caching', () => {
    it('parses the JSON only once across multiple calls', () => {
      const el = injectScript('rc-app', JSON.stringify({ key: 'original' }));
      const get = createConfigReader<{ key: string }>('#rc-app');

      get('key');
      el.textContent = JSON.stringify({ key: 'mutated' });

      expect(get('key')).toBe('original');
    });

    it('cache is per instance, not shared across readers', () => {
      injectScript('rc-app', JSON.stringify({ key: 'app' }));
      injectScript('rc-map', JSON.stringify({ key: 'map' }));

      const getApp = createConfigReader<{ key: string }>('#rc-app');
      const getMap = createConfigReader<{ key: string }>('#rc-map');

      expect(getApp('key')).toBe('app');
      expect(getMap('key')).toBe('map');
    });
  });

  describe('error: element not found', () => {
    it('throws EnvToJsError', () => {
      const get = createConfigReader<{ key: string }>('#missing');
      expect(() => get('key')).toThrow(EnvToJsError);
    });

    it('message includes the selector', () => {
      const get = createConfigReader<{ key: string }>('#rc-global');
      expect(() => get('key')).toThrow(/#rc-global/);
    });

    it('message references the expected script tag so developers know what to add', () => {
      const get = createConfigReader<{ key: string }>('#rc-app');
      expect(() => get('key')).toThrow(/script type="application\/json"/);
    });

    it('throws on every call when the element is absent (no poisoned cache)', () => {
      const get = createConfigReader<{ key: string }>('#missing');
      expect(() => get('key')).toThrow(EnvToJsError);
      expect(() => get('key')).toThrow(EnvToJsError);
    });
  });

  describe('error: invalid JSON', () => {
    it('throws EnvToJsError', () => {
      injectScript('rc-app', 'not valid json {{{');
      const get = createConfigReader<{ key: string }>('#rc-app');
      expect(() => get('key')).toThrow(EnvToJsError);
    });

    it('message includes the selector', () => {
      injectScript('rc-app', 'invalid');
      const get = createConfigReader<{ key: string }>('#rc-app');
      expect(() => get('key')).toThrow(/#rc-app/);
    });

    it('message includes the parse error', () => {
      injectScript('rc-app', 'invalid');
      const get = createConfigReader<{ key: string }>('#rc-app');
      expect(() => get('key')).toThrow(/parse/i);
    });

    it('throws on every call when JSON is invalid (no poisoned cache)', () => {
      injectScript('rc-app', 'invalid');
      const get = createConfigReader<{ key: string }>('#rc-app');
      expect(() => get('key')).toThrow(EnvToJsError);
      expect(() => get('key')).toThrow(EnvToJsError);
    });
  });

  describe('multiple independent readers', () => {
    it('two readers on distinct elements work independently', () => {
      injectScript('rc-app', JSON.stringify({ appKey: 'app-value' }));
      injectScript('rc-map', JSON.stringify({ mapKey: 'map-value' }));

      const getApp = createConfigReader<{ appKey: string }>('#rc-app');
      const getMap = createConfigReader<{ mapKey: string }>('#rc-map');

      expect(getApp('appKey')).toBe('app-value');
      expect(getMap('mapKey')).toBe('map-value');
    });

    it('one reader failing does not affect the other', () => {
      injectScript('rc-app', JSON.stringify({ key: 'ok' }));

      const getApp = createConfigReader<{ key: string }>('#rc-app');
      const getMissing = createConfigReader<{ key: string }>('#rc-missing');

      expect(getApp('key')).toBe('ok');
      expect(() => getMissing('key')).toThrow(EnvToJsError);
    });
  });
});
