import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  GitCommit,
  Star,
  GitFork,
  GitPullRequest,
  AlertCircle,
  Package,
  Loader2,
  Plus,
} from 'lucide-react'
import { useUserEvents } from '#/hooks/useUserEvents'
import { C } from '#/lib/tokens'
import { ErrorAlert } from '#/components/ErrorAlert'
import type { GitHubEvent } from '#/types/github'

export const Route = createFileRoute('/$username/events')({
  component: EventsTab,
})

// Per-event-type colors (matching the design)
const KIND_COLORS: Record<string, string> = {
  push: C.accent,
  pr: 'oklch(0.78 0.13 305)',
  issue: 'oklch(0.82 0.16 75)',
  create: 'oklch(0.82 0.16 145)',
  star: 'oklch(0.85 0.14 85)',
  fork: 'oklch(0.74 0.10 240)',
  other: C.fgDim,
}

function eventKind(type: string): string {
  switch (type) {
    case 'PushEvent':
      return 'push'
    case 'PullRequestEvent':
      return 'pr'
    case 'IssuesEvent':
      return 'issue'
    case 'CreateEvent':
      return 'create'
    case 'DeleteEvent':
      return 'create'
    case 'WatchEvent':
      return 'star'
    case 'ForkEvent':
      return 'fork'
    default:
      return 'other'
  }
}

function kindIcon(kind: string, size = 11): ReactNode {
  switch (kind) {
    case 'push':
      return <GitCommit size={size} />
    case 'pr':
      return <GitPullRequest size={size} />
    case 'issue':
      return <AlertCircle size={size} />
    case 'create':
      return <Plus size={size} />
    case 'star':
      return <Star size={size} />
    case 'fork':
      return <GitFork size={size} />
    default:
      return <Package size={size} />
  }
}

function EventsTab() {
  const { username } = Route.useParams()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
    refetch,
  } = useUserEvents(username)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage)
          fetchNextPage()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isError) {
    return (
      <ErrorAlert
        title="Failed to load activity"
        message={(error as Error).message}
        onRetry={() => refetch()}
      />
    )
  }

  const events = data?.pages.flat() ?? []

  if (events.length === 0 && !isFetchingNextPage) {
    return (
      <div className="py-10 text-center text-[13px]" style={{ color: C.fgDim }}>
        No public activity.
      </div>
    )
  }

  return (
    <div
      className="rounded-[10px] py-1 max-h-[600px] overflow-y-auto border"
      style={{
        background: C.surface,
        borderColor: C.borderSoft,
        scrollbarWidth: 'thin',
        scrollbarColor: `${C.border} transparent`,
      }}
    >
      {events.map((event, i) => (
        <EventRow
          key={event.id}
          event={event}
          isLast={i === events.length - 1}
        />
      ))}

      <div ref={sentinelRef} />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2
            size={16}
            className="animate-spin"
            style={{ color: C.fgDim }}
          />
        </div>
      )}

      {!hasNextPage && events.length > 0 && (
        <p
          className="py-4 text-center text-[11px] tracking-[0.08em] uppercase"
          style={{ color: C.fgFaint }}
        >
          End of activity
        </p>
      )}
    </div>
  )
}

function EventRow({ event, isLast }: { event: GitHubEvent; isLast: boolean }) {
  const { label, commitMsg } = describeEvent(event)
  const kind = eventKind(event.type)
  const kindColor = KIND_COLORS[kind] ?? KIND_COLORS.other
  const repoName = event.repo.name
  const repoUrl = `https://github.com/${repoName}`
  const relTime = relativeTime(event.created_at)

  return (
    <div
      className="grid items-start gap-[10px] px-4 py-3"
      style={{
        gridTemplateColumns: '28px 1fr auto',
        borderBottom: isLast ? 'none' : `1px solid ${C.borderSoft}`,
      }}
    >
      {/* Colored event icon */}
      <div
        className="grid place-items-center mt-px shrink-0 size-[22px] rounded-[5px] border"
        style={{
          background: C.surface2,
          borderColor: kindColor,
          color: kindColor,
        }}
      >
        {kindIcon(kind)}
      </div>

      {/* Body */}
      <div className="min-w-0">
        <div
          className="text-[12.5px] leading-[1.5]"
          style={{ color: C.fgMuted }}
        >
          <b className="font-semibold" style={{ color: C.fg }}>
            {label}{' '}
          </b>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium no-underline"
            style={{ color: C.accent }}
          >
            {repoName}
          </a>
        </div>
        {commitMsg && (
          <div
            className="text-[11px] mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: C.fgDim }}
          >
            › {commitMsg}
          </div>
        )}
      </div>

      {/* Time */}
      <div
        className="text-[11px] text-right whitespace-nowrap pt-[2px]"
        style={{ color: C.fgFaint }}
      >
        {relTime}
      </div>
    </div>
  )
}

function describeEvent(event: GitHubEvent): {
  label: string
  commitMsg?: string
} {
  switch (event.type) {
    case 'PushEvent': {
      const commits = (event.payload.commits as unknown[] | undefined) ?? []
      const last = (
        commits[commits.length - 1] as { message?: string } | undefined
      )?.message
      return {
        label: `Pushed ${commits.length} commit${commits.length !== 1 ? 's' : ''} to`,
        commitMsg: last,
      }
    }
    case 'WatchEvent':
      return { label: 'Starred' }
    case 'ForkEvent':
      return { label: 'Forked' }
    case 'PullRequestEvent': {
      const action = event.payload.action as string | undefined
      const num = (
        event.payload.pull_request as { number?: number } | undefined
      )?.number
      return {
        label: `${capitalize(action ?? 'opened')} pull request${num ? ` #${num}` : ''} in`,
      }
    }
    case 'IssuesEvent': {
      const action = event.payload.action as string | undefined
      const num = (event.payload.issue as { number?: number } | undefined)
        ?.number
      return {
        label: `${capitalize(action ?? 'opened')} issue${num ? ` #${num}` : ''} in`,
      }
    }
    case 'CreateEvent': {
      const refType = event.payload.ref_type as string | undefined
      const ref = event.payload.ref as string | undefined
      return {
        label: `Created ${refType ?? 'repository'}${ref ? ` ${ref}` : ''} in`,
      }
    }
    case 'DeleteEvent': {
      const refType = event.payload.ref_type as string | undefined
      return { label: `Deleted ${refType ?? 'ref'} in` }
    }
    case 'ReleaseEvent':
      return { label: 'Published a release in' }
    default:
      return { label: `${(event.type ?? 'Event').replace(/Event$/, '')} in` }
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}
