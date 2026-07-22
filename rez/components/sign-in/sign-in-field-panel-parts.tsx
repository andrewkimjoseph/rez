"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SignInFieldPanelData } from '@/services/fetchSignInFieldPanelData';

type TaskTypeTag = { label: string; className: string };
const STAT_ANIMATION_MS = 900;
const FEED_STAGGER_MS = 80;
const SESSION_COUNTUP_KEY = 'signInFieldPanelCountUpPlayed';

export function getTaskTypeTag(taskType: string | null): TaskTypeTag {
  switch (taskType) {
    case 'answerPoll':
    case 'poll':
      return { label: 'POLL', className: 'rez-tag-violet' };
    case 'fillAForm':
      return { label: 'FORM', className: 'rez-tag-orange' };
    case 'checkOutApp':
      return { label: 'APP', className: 'rez-tag-orange' };
    case 'doVideoInterview':
      return { label: 'VID', className: 'rez-tag-pink' };
    default:
      return { label: 'OTH', className: 'rez-tag-pink' };
  }
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mediaQuery.matches);
    update();

    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return reduced;
}

function useAnimatedStats(data: SignInFieldPanelData): SignInFieldPanelData {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animatedStats, setAnimatedStats] = useState(() => ({
    uniqueRespondents: data.uniqueRespondents,
    tasksCreated: data.tasksCreated,
    countriesCovered: data.countriesCovered,
  }));
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) return;

    if (prefersReducedMotion) {
      setAnimatedStats({
        uniqueRespondents: data.uniqueRespondents,
        tasksCreated: data.tasksCreated,
        countriesCovered: data.countriesCovered,
      });
      playedRef.current = true;
      return;
    }

    if (typeof window !== 'undefined') {
      const alreadyPlayed = window.sessionStorage.getItem(SESSION_COUNTUP_KEY) === 'true';
      if (alreadyPlayed) {
        setAnimatedStats({
          uniqueRespondents: data.uniqueRespondents,
          tasksCreated: data.tasksCreated,
          countriesCovered: data.countriesCovered,
        });
        playedRef.current = true;
        return;
      }
    }

    let rafId = 0;
    const start = performance.now();
    const target = {
      uniqueRespondents: data.uniqueRespondents,
      tasksCreated: data.tasksCreated,
      countriesCovered: data.countriesCovered,
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / STAT_ANIMATION_MS);
      const eased = easeOutCubic(progress);

      setAnimatedStats({
        uniqueRespondents: Math.round(target.uniqueRespondents * eased),
        tasksCreated: Math.round(target.tasksCreated * eased),
        countriesCovered: Math.round(target.countriesCovered * eased),
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(SESSION_COUNTUP_KEY, 'true');
        }
        playedRef.current = true;
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [data.countriesCovered, data.tasksCreated, data.uniqueRespondents, prefersReducedMotion]);

  return {
    ...data,
    uniqueRespondents: animatedStats.uniqueRespondents,
    tasksCreated: animatedStats.tasksCreated,
    countriesCovered: animatedStats.countriesCovered,
  };
}

export function formatRelativeRefreshTime(isoDate: string): string {
  const refreshedAt = new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.round((Date.now() - refreshedAt) / 60000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

export function formatTicketId(date = new Date(), countryCode?: string | null): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateCode = `${yy}${mm}${dd}`;
  const normalizedCountryCode = countryCode?.trim().toUpperCase();
  if (normalizedCountryCode && /^[A-Z]{2}$/.test(normalizedCountryCode)) {
    return `${normalizedCountryCode}·${dateCode}`;
  }
  return dateCode;
}

export type FieldPanelContentProps = {
  data: SignInFieldPanelData;
  maxRows: number;
};

export function FieldPanelStats({ data }: { data: SignInFieldPanelData }) {
  const animatedData = useAnimatedStats(data);

  return (
    <div className="sign-in-stats-grid grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-10">
      <div className="sign-in-stat-tile sign-in-stat-tile--pink">
        <div className="sign-in-stat-num sign-in-stat-num--pink">
          {animatedData.uniqueRespondents.toLocaleString()}
        </div>
        <div className="sign-in-stat-label">Verified respondents</div>
      </div>
      <div className="sign-in-stat-tile sign-in-stat-tile--orange">
        <div className="sign-in-stat-num sign-in-stat-num--orange">{animatedData.tasksCreated.toLocaleString()}</div>
        <div className="sign-in-stat-label">Tasks created</div>
      </div>
      <div className="sign-in-stat-tile sign-in-stat-tile--violet">
        <div className="sign-in-stat-num sign-in-stat-num--violet">{animatedData.countriesCovered.toLocaleString()}</div>
        <div className="sign-in-stat-label">Countries covered</div>
      </div>
    </div>
  );
}

export function FieldPanelFeed({ data, maxRows }: FieldPanelContentProps) {
  const rows = data.recentResponses.slice(0, maxRows);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <>
      <div className="sign-in-section-label mb-3.5">
        Recent responses
      </div>
      <div className="sign-in-feed-grid flex flex-col gap-px rounded-xl overflow-hidden mb-auto">
        {rows.length === 0 ? (
          <div className="sign-in-feed-row px-[18px] py-3.5 text-sm text-[color:var(--sidebar-muted)]">
            No poll responses yet.
          </div>
        ) : (
          rows.map((row, index) => {
            const tag = getTaskTypeTag(row.taskType);
            return (
              <div
                key={`${row.answeredAt}-${index}`}
                className={`sign-in-feed-row px-[18px] py-3.5 flex items-center justify-between gap-3 ${
                  prefersReducedMotion ? '' : 'sign-in-feed-row-enter'
                }`}
                style={prefersReducedMotion ? undefined : { animationDelay: `${index * FEED_STAGGER_MS}ms` }}
              >
                <div className="text-sm min-w-0">
                  <span
                    className={`inline-block text-[10px] tracking-wide font-medium px-[7px] py-0.5 rounded mr-2.5 ${tag.className}`}
                  >
                    {tag.label}
                  </span>
                  <span className="truncate">{row.taskTitle}</span>
                </div>
                <div className="sign-in-feed-location whitespace-nowrap shrink-0">
                  {row.location ?? '—'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

export function FieldPanelFooter({ data }: { data: SignInFieldPanelData }) {
  return (
    <div className="sign-in-panel-footer mt-7">
      Panel refreshed{' '}
      <span className="sign-in-panel-footer-highlight">{formatRelativeRefreshTime(data.refreshedAt)}</span>
      {' · '}sourced from live Canvassing tasks
    </div>
  );
}

export function FieldPanelHeader() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const liveDotClassName = useMemo(
    () => `sign-in-live-dot${prefersReducedMotion ? '' : ' sign-in-live-dot-pulse'}`,
    [prefersReducedMotion],
  );

  return (
    <div className="flex justify-between items-start mb-8">
      <h3 className="font-[family-name:var(--font-fraunces)] font-medium text-xl">Live from the field</h3>
      <div className="sign-in-live-badge flex items-center">
        <span className={liveDotClassName} aria-hidden />
        <span className="sign-in-live-badge-label">
          Updating
        </span>
      </div>
    </div>
  );
}
