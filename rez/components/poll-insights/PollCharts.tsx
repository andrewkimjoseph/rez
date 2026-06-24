'use client';

import type { ReactNode } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { CircleFlag } from 'react-circle-flags';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useChartPalette, type ChartPalette } from '@/hooks/use-chart-palette';
import { getCountryCode, getCountryEmoji } from '@/lib/country-display';
import { withPercentages, type ChartDatum, type ChartDatumWithPct } from '@/lib/poll-insights';

const chartConfig = {
  value: { label: 'Responses' },
} satisfies ChartConfig;

const PIE_COLORS = [
  '#5C29A3',
  '#f857a6',
  '#ff9966',
  '#4ade80',
  '#60a5fa',
  '#facc15',
];

function rowColor(palette: ChartPalette, index: number): string {
  return index === 0 ? palette.primary : PIE_COLORS[index % PIE_COLORS.length];
}

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function ProgressRows({
  data,
  renderLeading,
  showColorDots = false,
}: {
  data: ChartDatumWithPct[];
  renderLeading?: (row: ChartDatumWithPct, index: number) => ReactNode;
  showColorDots?: boolean;
}) {
  const palette = useChartPalette();

  return (
    <div className="space-y-3.5">
      {data.map((row, index) => {
        const color = rowColor(palette, index);
        return (
          <div
            key={row.label}
            className={row.value === 0 ? 'opacity-50' : undefined}
          >
            <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
              <span className="flex items-center gap-2 min-w-0 text-foreground leading-snug">
                {renderLeading?.(row, index) ??
                  (showColorDots ? <ColorDot color={color} /> : null)}
                <span className="truncate">{row.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground text-xs">
                {row.value} ({row.pct}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${row.pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type PollResultsChartProps = {
  data: ChartDatum[];
};

export function PollResultsChart({ data }: PollResultsChartProps) {
  const withPct = withPercentages(data);

  if (withPct.length === 0) {
    return <p className="text-sm text-muted-foreground">No responses yet.</p>;
  }

  return <ProgressRows data={withPct} showColorDots />;
}

type GenderDonutChartProps = {
  data: ChartDatum[];
};

export function GenderDonutChart({ data }: GenderDonutChartProps) {
  const palette = useChartPalette();
  const withPct = withPercentages(data);
  const total = data.reduce((sum, row) => sum + row.value, 0);

  if (withPct.length === 0) {
    return <p className="text-sm text-muted-foreground">No responses yet.</p>;
  }

  if (withPct.length <= 2) {
    return (
      <ProgressRows
        data={withPct}
        renderLeading={(_row, index) => (
          <ColorDot color={rowColor(palette, index)} />
        )}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChartContainer config={chartConfig} className="h-[160px] w-[160px] shrink-0 aspect-auto mx-auto sm:mx-0">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => {
                  const row = item.payload as ChartDatumWithPct;
                  return `${value} (${row.pct}%)`;
                }}
              />
            }
          />
          <Pie
            data={withPct}
            dataKey="value"
            nameKey="label"
            innerRadius={42}
            outerRadius={68}
            strokeWidth={2}
          >
            {withPct.map((_, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-base font-semibold"
          >
            {total}
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[9px]"
          >
            total
          </text>
        </PieChart>
      </ChartContainer>

      <ul className="flex-1 space-y-2 min-w-0">
        {withPct.map((row, index) => (
          <li key={row.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <ColorDot color={rowColor(palette, index)} />
              <span className="truncate">{row.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground text-xs">
              {row.value} ({row.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CountryHorizontalChartProps = {
  data: ChartDatum[];
};

function CountryFlag({ label }: { label: string }) {
  const code = getCountryCode(label);
  if (code) {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
        <CircleFlag countryCode={code} height={20} />
      </span>
    );
  }
  return <span className="text-base leading-none shrink-0">{getCountryEmoji(label)}</span>;
}

export function CountryHorizontalChart({ data }: CountryHorizontalChartProps) {
  const withPct = withPercentages(data);

  if (withPct.length === 0) {
    return <p className="text-sm text-muted-foreground">No responses yet.</p>;
  }

  return (
    <ProgressRows
      data={withPct}
      renderLeading={(row) => <CountryFlag label={row.label} />}
    />
  );
}

type AgeOrderedChartProps = {
  data: ChartDatum[];
};

export function AgeOrderedChart({ data }: AgeOrderedChartProps) {
  const withPct = withPercentages(data).filter((row) => row.value > 0);

  if (withPct.length === 0) {
    return <p className="text-sm text-muted-foreground">No responses yet.</p>;
  }

  return <ProgressRows data={withPct} showColorDots />;
}
