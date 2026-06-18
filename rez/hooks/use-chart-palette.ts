import { useLayoutEffect, useState } from 'react';

/** Reads a shadcn-style HSL triple from CSS, e.g. `--primary: 270 60% 40%` → `hsl(270 60% 40%)`. */
function cssHsl(varName: `--${string}`): string {
  if (typeof document === 'undefined') return '';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return '';
  return raw.startsWith('hsl(') ? raw : `hsl(${raw})`;
}

function withAlpha(hsl: string, alpha: number): string {
  if (!hsl) return '';
  return hsl.replace(/\)\s*$/, ` / ${alpha})`);
}

export type ChartPalette = {
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  yellow: string;
  yellowSoft: string;
  mutedForeground: string;
  border: string;
  card: string;
  cardForeground: string;
};

const FALLBACK_LIGHT: ChartPalette = {
  primary: 'hsl(270 60% 40%)',
  primarySoft: 'hsl(270 60% 40% / 0.35)',
  accent: 'hsl(25 95% 53%)',
  accentSoft: 'hsl(25 95% 53% / 0.35)',
  success: 'hsl(145 65% 42%)',
  successSoft: 'hsl(145 65% 42% / 0.35)',
  yellow: 'hsl(45 93% 55%)',
  yellowSoft: 'hsl(45 93% 55% / 0.35)',
  mutedForeground: 'hsl(270 15% 45%)',
  border: 'hsl(270 20% 90%)',
  card: 'hsl(0 0% 100%)',
  cardForeground: 'hsl(270 50% 15%)',
};

export function useChartPalette(): ChartPalette {
  const [palette, setPalette] = useState<ChartPalette>(FALLBACK_LIGHT);

  useLayoutEffect(() => {
    const refresh = () => {
      const primary = cssHsl('--primary');
      const accent = cssHsl('--accent');
      const success = cssHsl('--success');
      const yellow = cssHsl('--yellow');
      const mutedForeground = cssHsl('--muted-foreground');
      const border = cssHsl('--border');
      const card = cssHsl('--card');
      const cardForeground = cssHsl('--card-foreground');

      setPalette({
        primary: primary || FALLBACK_LIGHT.primary,
        primarySoft: primary ? withAlpha(primary, 0.35) : FALLBACK_LIGHT.primarySoft,
        accent: accent || FALLBACK_LIGHT.accent,
        accentSoft: accent ? withAlpha(accent, 0.35) : FALLBACK_LIGHT.accentSoft,
        success: success || FALLBACK_LIGHT.success,
        successSoft: success ? withAlpha(success, 0.35) : FALLBACK_LIGHT.successSoft,
        yellow: yellow || FALLBACK_LIGHT.yellow,
        yellowSoft: yellow ? withAlpha(yellow, 0.35) : FALLBACK_LIGHT.yellowSoft,
        mutedForeground: mutedForeground || FALLBACK_LIGHT.mutedForeground,
        border: border || FALLBACK_LIGHT.border,
        card: card || FALLBACK_LIGHT.card,
        cardForeground: cardForeground || FALLBACK_LIGHT.cardForeground,
      });
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return palette;
}
