export type TextSpeedKey = 'instant' | 'fast' | 'normal' | 'slow';

export type UiSettings = {
  fontSize: number;
  lineHeight: number;
  textSpeed: TextSpeedKey;
  bgmVolume: number;
  sfxVolume: number;
  darkMode: boolean;
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  fontSize: 17,
  lineHeight: 1.55,
  textSpeed: 'normal',
  bgmVolume: 70,
  sfxVolume: 70,
  darkMode: false,
};

export const FONT_SIZE_OPTIONS = [15, 16, 17, 18, 19, 20] as const;
export const LINE_HEIGHT_OPTIONS = [1.35, 1.45, 1.55, 1.65, 1.75] as const;
export const TEXT_SPEED_OPTIONS = [
  { key: 'instant', label: '즉시', delayMs: 0 },
  { key: 'fast', label: '빠름', delayMs: 12 },
  { key: 'normal', label: '보통', delayMs: 24 },
  { key: 'slow', label: '느림', delayMs: 40 },
] as const;

export const UI_SETTINGS_STORAGE_KEY = 'carthage.uiSettings.v1';

const textSpeedKeys = TEXT_SPEED_OPTIONS.map((option) => option.key);

function isNumberInOptions(value: unknown, options: readonly number[]): value is number {
  return typeof value === 'number' && options.includes(value);
}

function clampVolume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeUiSettings(value: unknown): UiSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_UI_SETTINGS };
  const candidate = value as Partial<UiSettings>;

  return {
    fontSize: isNumberInOptions(candidate.fontSize, FONT_SIZE_OPTIONS) ? candidate.fontSize : DEFAULT_UI_SETTINGS.fontSize,
    lineHeight: isNumberInOptions(candidate.lineHeight, LINE_HEIGHT_OPTIONS) ? candidate.lineHeight : DEFAULT_UI_SETTINGS.lineHeight,
    textSpeed: typeof candidate.textSpeed === 'string' && textSpeedKeys.includes(candidate.textSpeed as TextSpeedKey)
      ? candidate.textSpeed as TextSpeedKey
      : DEFAULT_UI_SETTINGS.textSpeed,
    bgmVolume: clampVolume(candidate.bgmVolume, DEFAULT_UI_SETTINGS.bgmVolume),
    sfxVolume: clampVolume(candidate.sfxVolume, DEFAULT_UI_SETTINGS.sfxVolume),
    darkMode: typeof candidate.darkMode === 'boolean' ? candidate.darkMode : DEFAULT_UI_SETTINGS.darkMode,
  };
}

export function loadUiSettings(): UiSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_UI_SETTINGS };
  try {
    const raw = window.localStorage.getItem(UI_SETTINGS_STORAGE_KEY);
    return raw ? normalizeUiSettings(JSON.parse(raw)) : { ...DEFAULT_UI_SETTINGS };
  } catch {
    return { ...DEFAULT_UI_SETTINGS };
  }
}

export function saveUiSettings(settings: UiSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeUiSettings(settings)));
  } catch {
    // Storage can be unavailable in private browsing or restricted webviews.
  }
}

export function getTextSpeedDelay(textSpeed: TextSpeedKey): number {
  return TEXT_SPEED_OPTIONS.find((option) => option.key === textSpeed)?.delayMs ?? TEXT_SPEED_OPTIONS[2].delayMs;
}
