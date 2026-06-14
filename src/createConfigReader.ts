import { EnvToJsError } from './EnvToJsError.js';

export function createConfigReader<T extends Record<string, unknown>>(
  selector: string,
): <K extends keyof T>(key: K) => T[K] {
  let cache: T | null = null;

  function load(): T {
    if (cache !== null) return cache;

    const el = document.querySelector(selector);
    if (el === null) {
      throw new EnvToJsError(
        `element "${selector}" not found. Make sure a <script type="application/json"> tag matching this selector is present in your HTML.`,
      );
    }

    try {
      cache = JSON.parse(el.textContent) as T;
    } catch (err) {
      throw new EnvToJsError(
        `failed to parse JSON in element "${selector}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return cache;
  }

  return function get<K extends keyof T>(key: K): T[K] {
    return load()[key];
  };
}
