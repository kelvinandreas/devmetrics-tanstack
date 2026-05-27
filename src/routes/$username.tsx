import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useSuspenseQueries } from '@tanstack/react-query'
import { Suspense, useEffect, useState } from 'react'
import {
  MapPin,
  Building2,
  Link as LinkIcon,
  Calendar,
  Users,
  BookOpen,
  FileCode,
} from 'lucide-react'
import { userDetailQueryOptions } from '#/hooks/useUserDetail'
import { userAllReposQueryOptions } from '#/hooks/useUserAllRepos'
import { ErrorBoundary } from '#/components/ErrorBoundary'
import { ErrorAlert } from '#/components/ErrorAlert'
import type { GitHubUserDetail, GitHubRepo } from '#/types/github'
import { C } from '#/lib/tokens'
import { langColor } from '#/lib/langs'

export const Route = createFileRoute('/$username')({
  component: UserDetailLayout,
})

// ── Utilities ─────────────────────────────────────────────────────────────
function accountAge(createdAt: string) {
  const yrs =
    (Date.now() - new Date(createdAt).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  return yrs >= 1 ? `${yrs.toFixed(1)}y` : `${Math.floor(yrs * 12)}mo`
}

function joinedDate(createdAt: string) {
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function computeLanguages(repos: GitHubRepo[]) {
  const counts: Record<string, number> = {}
  for (const r of repos) {
    if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => ({
      name,
      pct: Math.round((n / total) * 100),
      color: langColor(name),
    }))
}

function computePeakDay(repos: { pushed_at: string }[]): string {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const r of repos) {
    if (r.pushed_at) counts[new Date(r.pushed_at).getDay()]++
  }
  const max = Math.max(...counts)
  return max === 0 ? 'N/A' : DAYS[counts.indexOf(max)]
}

// ── Animated counter ──────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (value === 0) {
      setN(0)
      return
    }
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(eased * value))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{n.toLocaleString()}</>
}

// ── Layout ────────────────────────────────────────────────────────────────
function UserDetailLayout() {
  const { username } = Route.useParams()

  return (
    <div
      className="min-h-screen font-mono"
      style={{ background: C.bg, color: C.fg }}
    >
      <style>{`
        .dm-tab {
          background: transparent; border: 0; border-radius: 0;
          padding: 10px 14px; font-family: inherit;
          font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
          color: ${C.fgDim}; cursor: pointer; position: relative;
          text-decoration: none; display: inline-block;
          transition: color 0.12s ease;
        }
        .dm-tab:hover { color: ${C.fgMuted}; }
        .dm-tab--active { color: ${C.fg}; }
        .dm-tab--active::after {
          content: ''; position: absolute;
          left: 8px; right: 8px; bottom: -1px; height: 2px;
          background: ${C.accent};
          box-shadow: 0 0 10px ${C.accentGlow};
        }
        .dm-kpi { transition: border-color 0.12s ease; }
        .dm-kpi:hover { border-color: ${C.borderStrong}; }
        .dm-meta-link { color: ${C.fgDim}; text-decoration: none; transition: color 0.12s; }
        .dm-meta-link:hover { color: ${C.accent}; }
        .dm-hero { display: grid; grid-template-columns: auto minmax(0,1fr); gap: 24px; align-items: center; padding: 28px; background: ${C.surface}; border: 1px solid ${C.borderSoft}; border-radius: 10px; margin-top: 28px; }
        @media (max-width: 500px) {
          .dm-hero { grid-template-columns: 1fr; gap: 14px; padding: 18px; }
          .dm-hero-avatar { width: 64px !important; height: 64px !important; border-radius: 8px !important; }
        }
        .dm-kpi-grid { display: grid; gap: 12px; }
        .dm-kpi-grid-4 { grid-template-columns: repeat(4, minmax(0,1fr)); }
        .dm-kpi-grid-4d { grid-template-columns: repeat(4, minmax(0,1fr)); }
        @media (max-width: 640px) {
          .dm-kpi-grid-4  { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .dm-kpi-grid-4d { grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
      `}</style>

      <div className="mx-auto max-w-[1280px] px-[clamp(16px,4vw,56px)]">
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="pt-7">
              <ErrorAlert
                title="Failed to load profile"
                message={error.message}
                onRetry={reset}
              />
            </div>
          )}
        >
          <Suspense fallback={<HeroSkeleton />}>
            <HeroContent username={username} />
          </Suspense>
        </ErrorBoundary>

        {/* Tab nav + child route */}
        <div className="mt-9">
          <SectionHead title="repositories.activity" />
          <div
            className="flex items-center gap-1 border-b mb-[14px]"
            style={{ borderColor: C.borderSoft }}
          >
            <Link
              to="/$username"
              params={{ username }}
              activeOptions={{ exact: true }}
              className="dm-tab"
              activeProps={{ className: 'dm-tab dm-tab--active' }}
            >
              REPOSITORIES
            </Link>
            <Link
              to="/$username/events"
              params={{ username }}
              className="dm-tab"
              activeProps={{ className: 'dm-tab dm-tab--active' }}
            >
              ACTIVITY
            </Link>
          </div>
          <Outlet />
        </div>

        <PageFooter />
      </div>
    </div>
  )
}

// ── Section head ──────────────────────────────────────────────────────────
function SectionHead({ title }: { title: string }) {
  return (
    <div className="mb-[14px]">
      <div
        className="flex items-baseline gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase"
        style={{ color: C.fgMuted }}
      >
        <span className="font-bold" style={{ color: C.accent }}>
          $
        </span>
        {title}
      </div>
    </div>
  )
}

// ── Hero content ──────────────────────────────────────────────────────────
function HeroContent({ username }: { username: string }) {
  const [{ data: user }, { data: allRepos }] = useSuspenseQueries({
    queries: [
      userDetailQueryOptions(username),
      userAllReposQueryOptions(username),
    ],
  })

  const totalStars = allRepos.reduce((s, r) => s + r.stargazers_count, 0)
  const langs = computeLanguages(allRepos)
  const topLang = langs[0]?.name ?? 'N/A'
  const peakDay = computePeakDay(allRepos)

  const blogHref =
    user.blog && !/^https?:\/\//.test(user.blog)
      ? `https://${user.blog}`
      : (user.blog ?? undefined)

  return (
    <>
      {/* Hero card — full width */}
      <div className="dm-hero">
        {/* Avatar */}
        <div
          className="dm-hero-avatar size-[116px] shrink-0 rounded-[10px] overflow-hidden border"
          style={{ borderColor: C.borderStrong, background: C.surface2 }}
        >
          <img
            src={user.avatar_url}
            alt={user.login}
            className="size-full object-cover block"
          />
        </div>

        {/* Identity */}
        <div className="min-w-0">
          <div
            className="text-[11px] mb-[6px] tracking-[0.06em]"
            style={{ color: C.fgDim }}
          >
            <span style={{ color: C.accent }}>›</span> users.find(@{user.login})
          </div>
          <div className="flex items-baseline gap-[14px] flex-wrap">
            <h1
              className="font-extrabold tracking-[-0.02em] leading-[1.05] m-0"
              style={{ fontSize: 'clamp(24px, 4vw, 38px)', color: C.fg }}
            >
              {user.name ?? user.login}
            </h1>
            <span
              className="text-sm font-medium shrink-0"
              style={{ color: C.fgDim }}
            >
              @
              <b className="font-semibold" style={{ color: C.accent }}>
                {user.login}
              </b>
            </span>
          </div>

          {user.bio && (
            <p
              className="text-sm mt-3 mb-[14px] max-w-[60ch] leading-[1.6]"
              style={{ color: C.fgMuted }}
            >
              {user.bio}
            </p>
          )}

          <div
            className="flex flex-wrap gap-x-4 gap-y-[6px] text-xs"
            style={{ color: C.fgDim }}
          >
            {user.company && (
              <span className="inline-flex items-center gap-[6px]">
                <Building2 size={13} className="opacity-80" />
                {user.company.replace(/^@/, '')}
              </span>
            )}
            {user.location && (
              <span className="inline-flex items-center gap-[6px]">
                <MapPin size={13} className="opacity-80" />
                {user.location}
              </span>
            )}
            <span className="inline-flex items-center gap-[6px]">
              <Calendar size={13} className="opacity-80" />
              joined {joinedDate(user.created_at)}
            </span>
            {user.blog && (
              <a
                href={blogHref}
                target="_blank"
                rel="noopener noreferrer"
                className="dm-meta-link inline-flex items-center gap-[6px]"
              >
                <LinkIcon size={13} className="opacity-80" />
                {user.blog.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <KPISection
        user={user}
        totalStars={totalStars}
        repoCount={allRepos.length}
        topLang={topLang}
        peakDay={peakDay}
      />

      {/* Language breakdown */}
      {langs.length > 0 && (
        <LanguageBreakdown langs={langs} repoCount={allRepos.length} />
      )}
    </>
  )
}

// ── KPI strip ─────────────────────────────────────────────────────────────
function KPISection({
  user,
  totalStars,
  repoCount,
  topLang,
  peakDay,
}: {
  user: GitHubUserDetail
  totalStars: number
  repoCount: number
  topLang: string
  peakDay: string
}) {
  const kpis = [
    {
      label: 'PUBLIC REPOS',
      icon: <BookOpen size={11} />,
      value: user.public_repos,
      trend: 'total public',
    },
    {
      label: 'FOLLOWERS',
      icon: <Users size={11} />,
      value: user.followers,
      trend: 'GitHub followers',
    },
    {
      label: 'FOLLOWING',
      icon: <Users size={11} />,
      value: user.following,
      trend: 'GitHub following',
    },
    {
      label: 'PUBLIC GISTS',
      icon: <FileCode size={11} />,
      value: user.public_gists,
      trend: 'total gists',
    },
  ]

  const derived = [
    {
      label: 'TOTAL STARS',
      value: totalStars.toLocaleString(),
      sub: `across ${repoCount} repos`,
    },
    {
      label: 'TOP LANGUAGE',
      value: topLang,
      sub: 'by repo count',
      color: langColor(topLang),
    },
    {
      label: 'ACCOUNT AGE',
      value: accountAge(user.created_at),
      sub: `since ${joinedDate(user.created_at)}`,
    },
    {
      label: 'PEAK DAY',
      value: peakDay,
      sub: 'by push activity',
    },
  ]

  return (
    <div className="mt-9">
      <SectionHead title="profile.stats" />

      <div className="dm-kpi-grid dm-kpi-grid-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="dm-kpi p-[18px] rounded-[10px] overflow-hidden border"
            style={{ background: C.surface, borderColor: C.borderSoft }}
          >
            <div
              className="text-[10px] font-semibold tracking-[0.14em] uppercase flex items-center gap-[6px]"
              style={{ color: C.fgDim }}
            >
              {k.icon} {k.label}
            </div>
            <div
              className="font-extrabold leading-[1.05] mt-[10px] tracking-[-0.02em]"
              style={{
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <AnimatedNumber value={k.value} />
            </div>
            <div className="mt-[6px] text-[11px]" style={{ color: C.fgMuted }}>
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="dm-kpi-grid dm-kpi-grid-4d mt-3">
        {derived.map((d) => (
          <div
            key={d.label}
            className="flex flex-col gap-1 px-4 py-[14px] rounded-[10px] border"
            style={{ background: C.surface, borderColor: C.borderSoft }}
          >
            <div
              className="text-[10px] font-medium tracking-[0.1em] uppercase"
              style={{ color: C.fgDim }}
            >
              {d.label}
            </div>
            <div
              className="text-base font-bold flex items-center gap-[6px]"
              style={{ color: d.color ?? C.fg }}
            >
              {d.value}
              <small
                className="text-[11px] font-normal"
                style={{ color: C.fgDim }}
              >
                {d.sub}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Language breakdown (full width) ───────────────────────────────────────
function LanguageBreakdown({
  langs,
  repoCount,
}: {
  langs: { name: string; pct: number; color: string }[]
  repoCount: number
}) {
  return (
    <div className="mt-9">
      <SectionHead title="languages.breakdown" />
      <div
        className="rounded-[10px] border p-[22px]"
        style={{ background: C.surface, borderColor: C.borderSoft }}
      >
        <div
          className="flex items-center gap-2 mb-3 text-[11px]"
          style={{ color: C.fgFaint }}
        >
          {langs.length} language{langs.length !== 1 ? 's' : ''} detected across{' '}
          {repoCount} repos
        </div>
        <div
          className="flex h-[10px] rounded-full overflow-hidden mb-4"
          style={{ background: C.surface2 }}
        >
          {langs.map((l) => (
            <div
              key={l.name}
              style={{ background: l.color, width: `${l.pct}%` }}
              title={`${l.name} · ${l.pct}%`}
            />
          ))}
        </div>
        <ul
          className="grid text-xs list-none p-0 m-0"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '8px 20px',
          }}
        >
          {langs.map((l) => (
            <li
              key={l.name}
              className="flex items-center gap-2"
              style={{ color: C.fgMuted }}
            >
              <span
                className="size-[9px] rounded-[2px] shrink-0 inline-block"
                style={{ background: l.color }}
              />
              <b className="font-semibold" style={{ color: C.fg }}>
                {l.name}
              </b>
              <span
                className="ml-auto"
                style={{ color: C.fgFaint, fontVariantNumeric: 'tabular-nums' }}
              >
                {l.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Hero skeleton ─────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="mt-7">
      <div className="dm-hero">
        <div
          className="animate-pulse dm-hero-avatar size-[116px] rounded-[10px]"
          style={{ background: C.surface2 }}
        />
        <div className="flex flex-col gap-3 pt-1">
          <div
            className="animate-pulse h-9 w-[40%] rounded-[6px]"
            style={{ background: C.surface2 }}
          />
          <div
            className="animate-pulse h-[14px] w-[70%] rounded-[4px]"
            style={{ background: C.surface2 }}
          />
          <div
            className="animate-pulse h-3 w-[55%] rounded-[4px]"
            style={{ background: C.surface2 }}
          />
        </div>
      </div>
      <div className="dm-kpi-grid dm-kpi-grid-4 mt-9">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-[110px] rounded-[10px] border"
            style={{ background: C.surface, borderColor: C.borderSoft }}
          />
        ))}
      </div>
      <div className="dm-kpi-grid dm-kpi-grid-4d mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-[60px] rounded-[10px] border"
            style={{ background: C.surface, borderColor: C.borderSoft }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────
function PageFooter() {
  return (
    <footer
      className="mt-14 pb-14 pt-7 border-t text-center text-[11px] tracking-[0.04em]"
      style={{ borderColor: C.borderSoft, color: C.fgFaint }}
    >
      Made with ☕︎ by{' '}
      <a
        href="https://github.com/kelvinandreas"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
        style={{ color: C.accent }}
      >
        kelvinandreas
      </a>
    </footer>
  )
}
