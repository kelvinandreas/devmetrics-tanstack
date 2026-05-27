import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search, CornerDownLeft, User, Building2 } from 'lucide-react'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useUserSearch } from '#/hooks/useUserSearch'
import { userDetailQueryOptions } from '#/hooks/useUserDetail'
import { ErrorBoundary } from '#/components/ErrorBoundary'
import { ErrorAlert } from '#/components/ErrorAlert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { GitHubUser } from '#/types/github'

export const Route = createFileRoute('/')({ component: HomePage })

const POPULAR = [
  'kelvinandreas',
  'tannerlinsley',
  'tanstack',
  'shadcn',
  'tailwindlabs',
]

// Commit-map grid: 11×11 cells, 2px gap → 13px tile, monochrome
const GRID_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13'%3E%3Crect x='1' y='1' width='10' height='10' rx='2' fill='%23111111'/%3E%3C/svg%3E")`

// ── Home page ──────────────────────────────────────────────────────────────
function HomePage() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(input.trim()), 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input])

  const isFetching =
    useIsFetching({ queryKey: ['users', 'search', query] }) > 0 &&
    query.length >= 2
  const hasResults = query.length >= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = input.trim()
    if (val) navigate({ to: '/$username', params: { username: val } })
  }

  return (
    <>
      {/* Grid background */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 bg-repeat"
        style={{
          backgroundColor: '#080808',
          backgroundImage: GRID_BG,
          backgroundSize: '13px 13px',
        }}
      />

      {/* Page — overflow-x hidden prevents any child from causing horizontal scroll */}
      <div
        className={`relative z-[1] min-h-screen overflow-x-hidden flex flex-col items-center font-sans ${
          hasResults ? 'justify-start pt-12 pb-20' : 'justify-center py-[60px]'
        }`}
      >
        {/* Hero + search */}
        <div className="w-full max-w-[560px] flex flex-col items-center px-4">
          {/* Logo — fluid size so it never overflows on mobile */}
          <h1
            className="m-0 font-display font-extrabold tracking-[-0.02em] leading-none transition-[font-size] duration-300 select-none whitespace-nowrap"
            style={{
              fontSize: hasResults ? 24 : 'clamp(28px, 8vw, 72px)',
              color: '#efefef',
            }}
          >
            dev<span style={{ color: '#00e5ff' }}>.metrics</span>
          </h1>

          {/* Tagline */}
          {!hasResults && (
            <p
              className="mt-4 mb-0 text-sm text-center leading-[1.7] font-normal"
              style={{ color: '#555' }}
            >
              Search any GitHub{' '}
              <span className="font-medium" style={{ color: '#888' }}>
                user
              </span>{' '}
              or{' '}
              <span className="font-medium" style={{ color: '#888' }}>
                org
              </span>{' '}
              — see languages, top repos, and activity.
            </p>
          )}

          {/* Search */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 w-full flex items-center bg-[#111] border border-[#222] rounded-[10px] overflow-hidden transition-[border-color] duration-150 focus-within:border-[rgba(0,229,255,0.4)]"
          >
            <span
              className="pl-[14px] pr-1 font-mono text-[13px] font-semibold select-none shrink-0"
              style={{ color: '#00e5ff' }}
            >
              $
            </span>

            <Search
              size={13}
              className="shrink-0 mx-2"
              style={{ color: '#3a3a3a' }}
            />

            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search users or orgs…"
              autoFocus
              className="flex-1 min-w-0 border-none bg-transparent py-[13px] text-sm font-sans h-auto rounded-none focus-visible:ring-0 focus-visible:border-none"
            />

            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 mr-1"
              style={{ color: isFetching ? '#00e5ff' : '#3a3a3a' }}
            >
              {isFetching ? <Spinner /> : <CornerDownLeft size={14} />}
            </Button>
          </form>

          {/* Popular */}
          {!hasResults && (
            <div className="mt-5 w-full flex items-center flex-wrap gap-2 justify-center">
              <span className="text-[11px]" style={{ color: '#333' }}>
                popular →
              </span>
              {POPULAR.map((login) => (
                <PopularChip key={login} login={login} />
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {hasResults && (
          <div className="w-full max-w-[900px] px-4 pt-6">
            <ErrorBoundary
              key={query}
              fallback={(error, reset) => (
                <ErrorAlert
                  title="Search failed"
                  message={error.message}
                  onRetry={reset}
                />
              )}
            >
              <Suspense fallback={<SkeletonGrid />}>
                <SearchResults query={query} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </>
  )
}

// ── Popular chip ──────────────────────────────────────────────────────────
function PopularChip({ login }: { login: string }) {
  const queryClient = useQueryClient()
  return (
    <Link
      to="/$username"
      params={{ username: login }}
      className="inline-flex items-center gap-[6px] pl-[5px] pr-[10px] py-1 bg-[rgba(255,255,255,0.03)] border border-[#1e1e1e] rounded-full no-underline text-xs font-sans"
      style={{ color: '#555', transition: 'border-color 0.12s, color 0.12s' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'
        e.currentTarget.style.color = '#ccc'
        queryClient.prefetchQuery(userDetailQueryOptions(login))
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e1e1e'
        e.currentTarget.style.color = '#555'
      }}
    >
      <img
        src={`https://avatars.githubusercontent.com/${login}?s=32`}
        alt={login}
        width={18}
        height={18}
        className="rounded-full object-cover shrink-0"
      />
      {login}
    </Link>
  )
}

// ── Search results ────────────────────────────────────────────────────────
function SearchResults({ query }: { query: string }) {
  const { data } = useUserSearch(query)
  if (data.items.length === 0) return <EmptyState query={query} />
  return (
    <>
      <p
        className="m-0 mb-3 text-[11px] tracking-[0.06em] uppercase font-mono"
        style={{ color: '#333' }}
      >
        {data.total_count.toLocaleString()} results
        {data.incomplete_results && ' · partial'}
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
      >
        {data.items.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </>
  )
}

function UserCard({ user }: { user: GitHubUser }) {
  const isOrg = user.type === 'Organization'
  const queryClient = useQueryClient()
  return (
    <Card
      size="sm"
      className="flex-row items-center gap-[11px] px-[13px] py-[11px] rounded-[8px] ring-[#1e1e1e] transition-[box-shadow] duration-[120ms] hover:ring-[rgba(0,229,255,0.2)] cursor-pointer"
      onMouseEnter={() => {
        queryClient.prefetchQuery(userDetailQueryOptions(user.login))
      }}
    >
      <Link
        to="/$username"
        params={{ username: user.login }}
        className="flex items-center gap-[11px] no-underline w-full"
        style={{ color: '#e8e8e8' }}
      >
        <img
          src={user.avatar_url}
          alt={user.login}
          width={34}
          height={34}
          className="rounded-[6px] object-cover shrink-0 border border-[#222]"
        />
        <div className="min-w-0">
          <p
            className="m-0 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: '#e8e8e8' }}
          >
            {user.login}
          </p>
          <div
            className="flex items-center gap-1 mt-[2px] text-[11px]"
            style={{ color: '#444' }}
          >
            {isOrg ? <Building2 size={9} /> : <User size={9} />}
            {user.type}
          </div>
        </div>
      </Link>
    </Card>
  )
}

function SkeletonGrid() {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[58px] rounded-[8px]" />
      ))}
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <p className="m-0 text-sm" style={{ color: '#444' }}>
        No results for "{query}"
      </p>
      <p className="mt-[6px] mb-0 text-xs" style={{ color: '#2a2a2a' }}>
        Try a different name.
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin size-[14px]"
      style={{ color: '#00e5ff' }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />
      <path
        fill="currentColor"
        opacity="0.8"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}
