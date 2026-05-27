import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { Star, GitFork, ExternalLink, BookOpen } from 'lucide-react'
import { userReposQueryOptions } from '#/hooks/useUserRepos'
import { ErrorBoundary } from '#/components/ErrorBoundary'
import { ErrorAlert } from '#/components/ErrorAlert'
import { langColor } from '#/lib/langs'
import { C } from '#/lib/tokens'
import type { GitHubRepo } from '#/types/github'

export const Route = createFileRoute('/$username/')({
  component: UserReposTab,
})

function UserReposTab() {
  const { username } = Route.useParams()

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorAlert
          title="Failed to load repositories"
          message={error.message}
          onRetry={reset}
        />
      )}
    >
      <Suspense fallback={<ReposSkeleton />}>
        <ReposContent username={username} />
      </Suspense>
    </ErrorBoundary>
  )
}

function ReposContent({ username }: { username: string }) {
  const { data: repos } = useSuspenseQuery(userReposQueryOptions(username))

  if (repos.length === 0) {
    return (
      <div className="py-10 text-center text-[13px]" style={{ color: C.fgDim }}>
        No public repositories.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-[14px]">
        <span
          className="text-[11px] tracking-[0.04em]"
          style={{ color: C.fgFaint }}
        >
          showing {repos.length} recent
        </span>
        <Link
          to="/repos"
          search={{ username, sort: '', dir: 'desc', filter: '' }}
          className="inline-flex items-center gap-[6px] px-3 py-[5px] rounded-[6px] border text-[11px] font-medium tracking-[0.04em] no-underline bg-transparent"
          style={{
            borderColor: C.borderSoft,
            color: C.fgDim,
            transition: 'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.accent
            e.currentTarget.style.color = C.accent
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.borderSoft
            e.currentTarget.style.color = C.fgDim
          }}
        >
          <BookOpen size={11} />
          ALL REPOS
        </Link>
      </div>

      <style>{`
        .dm-repo-card {
          padding: 16px; background: ${C.surface};
          border: 1px solid ${C.borderSoft}; border-radius: 10px;
          display: flex; flex-direction: column; gap: 8px;
          text-decoration: none; color: inherit;
          transition: border-color 0.12s ease, background 0.12s ease;
        }
        .dm-repo-card:hover { border-color: ${C.accent}; background: ${C.surface2}; }
        .dm-repo-card:hover .dm-repo-name { color: ${C.accent}; }
        .dm-repo-name {
          font-size: 14px; font-weight: 700; color: ${C.fg};
          transition: color 0.12s ease; display: flex; align-items: center; gap: 6px;
        }
      `}</style>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  )
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  const color = repo.language ? langColor(repo.language) : null
  const pushed = new Date(repo.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="dm-repo-card"
    >
      <div className="flex items-start justify-between gap-[10px]">
        <span className="dm-repo-name">
          <BookOpen size={11} style={{ color: C.fgFaint, flexShrink: 0 }} />
          {repo.name}
          <ExternalLink size={10} style={{ color: C.fgFaint, flexShrink: 0 }} />
        </span>
      </div>

      <div
        className="text-xs leading-[1.5] min-h-9"
        style={{ color: C.fgMuted, textWrap: 'pretty' } as React.CSSProperties}
      >
        {repo.description ?? (
          <span className="italic" style={{ color: C.fgFaint }}>
            No description
          </span>
        )}
      </div>

      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-[5px]">
          {repo.topics.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[10px] py-[2px] px-[7px] rounded-full border tracking-[0.02em]"
              style={{
                color: C.fgDim,
                borderColor: C.borderSoft,
                background: C.surface2,
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-[14px] mt-1 pt-[10px] text-[11px] border-t border-dashed"
        style={{
          borderColor: C.borderSoft,
          color: C.fgDim,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {color && (
          <span className="inline-flex items-center gap-[5px]">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ background: color }}
            />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Star size={11} />
          {repo.stargazers_count.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork size={11} />
          {repo.forks_count.toLocaleString()}
        </span>
        <span className="ml-auto" style={{ color: C.fgFaint }}>
          pushed {pushed}
        </span>
      </div>
    </a>
  )
}

function ReposSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-[160px] rounded-[10px] border"
          style={{ borderColor: C.borderSoft, background: C.surface }}
        />
      ))}
    </div>
  )
}
