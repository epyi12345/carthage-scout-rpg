declare module 'react' {
  export const StrictMode: (props: { children?: unknown }) => unknown;
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((current: T) => T)) => void];
  export type ChangeEvent<T = Element> = { target: T };
}

declare module 'react-dom/client' {
  export function createRoot(element: Element): { render(children: unknown): void };
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

declare module '*.css';

declare namespace JSX {
  interface IntrinsicAttributes { key?: string | number; }
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
