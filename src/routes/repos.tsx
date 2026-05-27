import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense, useState, useEffect, useRef, useMemo, Fragment } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  SortingState,
  VisibilityState,
  ExpandedState,
  Row,
  FilterFn,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy,
  Columns3,
  Star,
  GitFork,
  Archive,
  Package,
  ArrowLeft,
  CheckCheck,
} from 'lucide-react'
import { userAllReposQueryOptions } from '#/hooks/useUserAllRepos'
import { ErrorBoundary } from '#/components/ErrorBoundary'
import { ErrorAlert } from '#/components/ErrorAlert'
import { LanguageBadge } from '#/components/LanguageBadge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '#/lib/utils'
import type { GitHubRepoFull } from '#/types/github'

// ─── Route ───────────────────────────────────────────────────────────────────

type ReposSearch = {
  username: string
  sort: string
  dir: 'asc' | 'desc'
  filter: string
}

export const Route = createFileRoute('/repos')({
  validateSearch: (search): ReposSearch => ({
    username: typeof search.username === 'string' ? search.username : '',
    sort: typeof search.sort === 'string' ? search.sort : '',
    dir: search.dir === 'asc' ? 'asc' : 'desc',
    filter: typeof search.filter === 'string' ? search.filter : '',
  }),
  component: ReposPage,
})

function ReposPage() {
  const { username } = Route.useSearch()

  return (
    <main className="page-wrap px-4 py-10">
      <Link
        to="/"
        className="pd-fade-in mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest no-underline transition"
        style={{ color: 'var(--pd-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--pd-text)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--pd-muted)'
        }}
      >
        <ArrowLeft size={12} />
        Back
      </Link>

      <div className="pd-fade-in mb-8" style={{ animationDelay: '40ms' }}>
        <p className="island-kicker mb-2">Repository Explorer</p>
        <h1
          className="display-title text-2xl font-medium sm:text-3xl"
          style={{ color: 'var(--pd-text)' }}
        >
          {username ? (
            <>
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline transition"
                style={{ color: 'var(--pd-text)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--pd-accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--pd-text)'
                }}
              >
                {username}
              </a>
              <span style={{ color: 'var(--pd-subtle)' }}> / repos</span>
            </>
          ) : (
            'Repository Explorer'
          )}
        </h1>
      </div>

      {!username ? (
        <NoUserState />
      ) : (
        <ErrorBoundary
          fallback={(error, reset) => (
            <ErrorAlert
              title="Failed to load repositories"
              message={error.message}
              onRetry={reset}
            />
          )}
        >
          <Suspense fallback={<TableSkeleton />}>
            <ReposTableContent username={username} />
          </Suspense>
        </ErrorBoundary>
      )}
    </main>
  )
}

function ReposTableContent({ username }: { username: string }) {
  const { data: repos } = useSuspenseQuery(userAllReposQueryOptions(username))
  return <ReposTable repos={repos} />
}

// ─── Column definitions ───────────────────────────────────────────────────────

const columnHelper = createColumnHelper<GitHubRepoFull>()

const repoGlobalFilter: FilterFn<GitHubRepoFull> = (
  row,
  _columnId,
  value: string,
) => {
  const q = value.toLowerCase()
  return (
    row.original.name.toLowerCase().includes(q) ||
    (row.original.description ?? '').toLowerCase().includes(q)
  )
}

const columns = [
  columnHelper.display({
    id: 'expand',
    size: 36,
    header: () => null,
    cell: ({ row }) => (
      <button
        onClick={(e) => {
          e.stopPropagation()
          row.toggleExpanded()
        }}
        className="flex items-center justify-center rounded-sm p-1 transition"
        style={{ color: 'var(--pd-subtle)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--pd-muted)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--pd-subtle)'
        }}
        aria-label={row.getIsExpanded() ? 'Collapse' : 'Expand'}
      >
        {row.getIsExpanded() ? (
          <ChevronDown size={12} />
        ) : (
          <ChevronRight size={12} />
        )}
      </button>
    ),
  }),

  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
    size: 200,
    cell: ({ getValue, row }) => (
      <a
        href={row.original.html_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="font-mono text-sm font-medium no-underline transition"
        style={{ color: 'var(--pd-accent)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.75'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        {getValue()}
      </a>
    ),
  }),

  columnHelper.accessor('description', {
    id: 'description',
    header: 'Description',
    enableSorting: false,
    cell: ({ getValue }) => {
      const desc = getValue()
      return desc ? (
        <span
          className="line-clamp-1 max-w-[280px] text-xs"
          style={{ color: 'var(--pd-muted)' }}
        >
          {desc}
        </span>
      ) : (
        <span
          className="font-mono text-xs"
          style={{ color: 'var(--pd-subtle)' }}
        >
          —
        </span>
      )
    },
  }),

  columnHelper.accessor('language', {
    id: 'language',
    header: 'Language',
    enableSorting: false,
    cell: ({ getValue }) => {
      const lang = getValue()
      return lang ? (
        <LanguageBadge language={lang} />
      ) : (
        <span
          className="font-mono text-xs"
          style={{ color: 'var(--pd-subtle)' }}
        >
          —
        </span>
      )
    },
  }),

  columnHelper.accessor('stargazers_count', {
    id: 'stars',
    header: 'Stars',
    size: 80,
    cell: ({ getValue }) => (
      <span
        className="flex items-center gap-1.5 font-mono text-xs tabular-nums"
        style={{ color: 'var(--pd-muted)' }}
      >
        <Star size={10} style={{ color: '#f5c518' }} />
        {getValue().toLocaleString()}
      </span>
    ),
  }),

  columnHelper.accessor('forks_count', {
    id: 'forks',
    header: 'Forks',
    size: 80,
    cell: ({ getValue }) => (
      <span
        className="flex items-center gap-1.5 font-mono text-xs tabular-nums"
        style={{ color: 'var(--pd-muted)' }}
      >
        <GitFork size={10} />
        {getValue().toLocaleString()}
      </span>
    ),
  }),

  columnHelper.accessor('open_issues_count', {
    id: 'issues',
    header: 'Issues',
    size: 80,
    cell: ({ getValue }) => (
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: 'var(--pd-muted)' }}
      >
        {getValue().toLocaleString()}
      </span>
    ),
  }),

  columnHelper.accessor('updated_at', {
    id: 'updated',
    header: 'Updated',
    size: 110,
    sortingFn: 'datetime',
    cell: ({ getValue }) => (
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: 'var(--pd-muted)' }}
      >
        {new Date(getValue()).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
    ),
  }),

  columnHelper.display({
    id: 'visibility',
    header: 'Status',
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const { archived, visibility } = row.original
      return <VisibilityBadge archived={archived} visibility={visibility} />
    },
  }),
]

// ─── Flat item type for virtualizer ──────────────────────────────────────────

type FlatItem =
  | { kind: 'row'; row: Row<GitHubRepoFull> }
  | { kind: 'expanded'; row: Row<GitHubRepoFull> }

// ─── Table component ──────────────────────────────────────────────────────────

function ReposTable({ repos }: { repos: GitHubRepoFull[] }) {
  const navigate = useNavigate({ from: Route.fullPath })
  const { sort, dir, filter } = Route.useSearch()

  const [filterInput, setFilterInput] = useState(filter)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (filterInput !== filter) {
        navigate({
          search: (prev) => ({ ...prev, filter: filterInput }),
          replace: true,
        })
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filterInput]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setFilterInput(filter)
  }, [filter])

  const sorting: SortingState = useMemo(
    () => (sort ? [{ id: sort, desc: dir === 'desc' }] : []),
    [sort, dir],
  )

  const table = useReactTable({
    data: repos,
    columns,
    state: { sorting, globalFilter: filterInput, columnVisibility, expanded },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      navigate({
        search: (prev) => ({
          ...prev,
          sort: first?.id ?? '',
          dir: first?.desc ? 'desc' : 'asc',
        }),
        replace: true,
      })
    },
    onGlobalFilterChange: setFilterInput,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    globalFilterFn: repoGlobalFilter,
  })

  const filteredRows = table.getRowModel().rows
  const filteredCount = filteredRows.length
  const visibleColCount = table.getVisibleLeafColumns().length

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = []
    for (const row of filteredRows) {
      items.push({ kind: 'row', row })
      if (row.getIsExpanded()) items.push({ kind: 'expanded', row })
    }
    return items
  }, [filteredRows, expanded]) // eslint-disable-line react-hooks/exhaustive-deps

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (flatItems[i]?.kind === 'expanded' ? 150 : 44),
    overscan: 5,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (el) => el.getBoundingClientRect().height
        : undefined,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0

  return (
    <div className="pd-fade-in space-y-3" style={{ animationDelay: '80ms' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 max-w-xs flex-1">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--pd-muted)' }}
          />
          <Input
            type="text"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            placeholder="Filter repos…"
            className="pl-8 font-sans text-sm"
          />
        </div>

        <p
          className="font-mono text-[11px] tabular-nums"
          style={{ color: 'var(--pd-subtle)' }}
        >
          <span style={{ color: 'var(--pd-text)' }}>{filteredCount}</span>{' '}
          {filteredCount === 1 ? 'repo' : 'repos'}
          {filterInput && ` · "${filterInput}"`}
        </p>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-sm border px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition bg-transparent cursor-pointer',
              'border-[var(--pd-border)] text-[var(--pd-muted)] hover:border-[var(--pd-border-hover)] hover:text-[var(--pd-text)]',
              'aria-expanded:border-[rgba(0,229,255,0.3)] aria-expanded:text-[var(--pd-text)]',
            )}
          >
            <Columns3 size={12} />
            Cols
            <ChevronDown size={10} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            {table
              .getAllLeafColumns()
              .filter((col) => col.id !== 'expand')
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  className="font-mono text-[11px] uppercase tracking-widest"
                >
                  {typeof col.columnDef.header === 'string'
                    ? col.columnDef.header
                    : col.id.charAt(0).toUpperCase() + col.id.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-sm border"
        style={{ borderColor: 'var(--pd-border)' }}
      >
        <div className="overflow-x-auto">
          <div
            ref={scrollRef}
            style={{ height: 'clamp(400px, 70vh, 800px)', overflowY: 'auto' }}
          >
            <table className="w-full min-w-[780px] border-collapse">
              <thead className="sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="border-b"
                    style={{
                      borderColor: 'var(--pd-border)',
                      background: 'var(--pd-surface-raised)',
                    }}
                  >
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{
                          width: header.column.columnDef.size,
                          color: header.column.getIsSorted()
                            ? 'var(--pd-accent)'
                            : 'var(--pd-subtle)',
                        }}
                        className={cn(
                          'px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest transition-colors',
                          header.column.getCanSort() &&
                            'cursor-pointer select-none',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onMouseEnter={(e) => {
                          if (
                            header.column.getCanSort() &&
                            !header.column.getIsSorted()
                          ) {
                            e.currentTarget.style.color = 'var(--pd-muted)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!header.column.getIsSorted()) {
                            e.currentTarget.style.color = 'var(--pd-subtle)'
                          }
                        }}
                      >
                        {!header.isPlaceholder && (
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <SortIcon state={header.column.getIsSorted()} />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {filteredCount === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColCount}
                      className="py-16 text-center font-mono text-xs"
                      style={{ color: 'var(--pd-muted)' }}
                    >
                      No repositories match your filter.
                    </td>
                  </tr>
                ) : (
                  <>
                    {paddingTop > 0 && (
                      <tr>
                        <td style={{ height: paddingTop }} />
                      </tr>
                    )}
                    {virtualItems.map((vItem) => {
                      const item = flatItems[vItem.index]
                      if (!item) return null
                      return (
                        <Fragment key={`${item.kind}-${item.row.id}`}>
                          {item.kind === 'row' ? (
                            <RepoRow
                              row={item.row}
                              dataIndex={vItem.index}
                              measureRef={rowVirtualizer.measureElement}
                            />
                          ) : (
                            <ExpandedRow
                              row={item.row}
                              dataIndex={vItem.index}
                              measureRef={rowVirtualizer.measureElement}
                            />
                          )}
                        </Fragment>
                      )
                    })}
                    {paddingBottom > 0 && (
                      <tr>
                        <td style={{ height: paddingBottom }} />
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Row sub-components ───────────────────────────────────────────────────────

function RepoRow({
  row,
  dataIndex,
  measureRef,
}: {
  row: Row<GitHubRepoFull>
  dataIndex: number
  measureRef: (el: Element | null) => void
}) {
  return (
    <tr
      data-index={dataIndex}
      ref={measureRef}
      onClick={() => row.toggleExpanded()}
      className="cursor-pointer border-b transition-colors last:border-0"
      style={{
        borderColor: 'var(--pd-border)',
        background: row.getIsExpanded()
          ? 'var(--pd-surface-raised)'
          : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!row.getIsExpanded())
          e.currentTarget.style.background = 'var(--pd-surface)'
      }}
      onMouseLeave={(e) => {
        if (!row.getIsExpanded())
          e.currentTarget.style.background = 'transparent'
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-3 py-2.5">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  )
}

function ExpandedRow({
  row,
  dataIndex,
  measureRef,
}: {
  row: Row<GitHubRepoFull>
  dataIndex: number
  measureRef: (el: Element | null) => void
}) {
  const repo = row.original
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  function copyCloneUrl() {
    navigator.clipboard.writeText(repo.clone_url)
    setCopied(true)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <tr
      data-index={dataIndex}
      ref={measureRef}
      className="border-b last:border-0"
      style={{
        borderColor: 'var(--pd-border)',
        background: 'var(--pd-surface-raised)',
      }}
    >
      <td colSpan={row.getVisibleCells().length} className="px-4 py-4">
        <div className="flex flex-wrap gap-6">
          {/* Clone URL */}
          <div className="min-w-0 flex-1">
            <p
              className="mb-2 font-mono text-[10px] uppercase tracking-widest"
              style={{ color: 'var(--pd-subtle)' }}
            >
              Clone URL
            </p>
            <div className="flex items-center gap-2">
              <code
                className="min-w-0 flex-1 truncate rounded-sm border px-2.5 py-1 font-mono text-xs"
                style={{
                  borderColor: 'var(--pd-border)',
                  background: 'var(--pd-bg)',
                  color: 'var(--pd-muted)',
                }}
              >
                {repo.clone_url}
              </code>
              <button
                onClick={copyCloneUrl}
                className="flex-shrink-0 rounded-sm border p-1.5 transition"
                style={{
                  borderColor: copied
                    ? 'rgba(0,229,255,0.3)'
                    : 'var(--pd-border)',
                  color: copied ? 'var(--pd-accent)' : 'var(--pd-muted)',
                  background: 'transparent',
                }}
                title="Copy clone URL"
              >
                {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* License */}
          {repo.license && (
            <div>
              <p
                className="mb-2 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--pd-subtle)' }}
              >
                License
              </p>
              <span
                className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-xs"
                style={{
                  borderColor: 'var(--pd-border)',
                  color: 'var(--pd-muted)',
                  background: 'var(--pd-bg)',
                }}
              >
                <Package size={10} />
                {repo.license.spdx_id !== 'NOASSERTION'
                  ? repo.license.spdx_id
                  : repo.license.name}
              </span>
            </div>
          )}

          {/* Topics */}
          {repo.topics.length > 0 && (
            <div className="w-full">
              <p
                className="mb-2 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--pd-subtle)' }}
              >
                Topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <a
                    key={topic}
                    href={`https://github.com/topics/${topic}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-sm border px-2.5 py-0.5 font-mono text-[11px] no-underline transition"
                    style={{
                      borderColor: 'rgba(0,229,255,0.2)',
                      color: 'var(--pd-accent)',
                      background: 'rgba(0,229,255,0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,229,255,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0,229,255,0.04)'
                      e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'
                    }}
                  >
                    {topic}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Badges & icons ───────────────────────────────────────────────────────────

function VisibilityBadge({
  archived,
  visibility,
}: {
  archived: boolean
  visibility: string
}) {
  if (archived) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-[rgba(245,193,24,0.2)] bg-[rgba(245,193,24,0.06)] text-[#f5c518] font-mono text-[10px] uppercase tracking-widest"
      >
        <Archive size={9} />
        Archived
      </Badge>
    )
  }
  if (visibility === 'private') {
    return (
      <Badge
        variant="outline"
        className="font-mono text-[10px] uppercase tracking-widest text-[var(--pd-subtle)]"
      >
        Private
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-[rgba(0,229,255,0.2)] bg-[rgba(0,229,255,0.04)] text-[var(--pd-accent)] font-mono text-[10px] uppercase tracking-widest"
    >
      Public
    </Badge>
  )
}

function SortIcon({ state }: { state: false | 'asc' | 'desc' }) {
  if (state === 'asc')
    return <ArrowUp size={10} style={{ color: 'var(--pd-accent)' }} />
  if (state === 'desc')
    return <ArrowDown size={10} style={{ color: 'var(--pd-accent)' }} />
  return <ArrowUpDown size={10} style={{ opacity: 0.3 }} />
}

// ─── Empty / error states ─────────────────────────────────────────────────────

function NoUserState() {
  return (
    <div
      className="rounded-sm border py-14 text-center"
      style={{
        borderColor: 'var(--pd-border)',
        background: 'var(--pd-surface)',
      }}
    >
      <ExternalLink
        size={20}
        className="mx-auto mb-3"
        style={{ color: 'var(--pd-subtle)' }}
      />
      <p className="text-sm font-medium" style={{ color: 'var(--pd-text)' }}>
        No user selected
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--pd-muted)' }}>
        Search for a GitHub user first, then click "All repos".
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-5 font-mono text-[11px] uppercase tracking-widest"
        render={<Link to="/" />}
      >
        <Search size={12} />
        Search
      </Button>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="ml-auto h-9 w-20" />
      </div>
      <div
        className="overflow-hidden rounded-sm border"
        style={{ borderColor: 'var(--pd-border)' }}
      >
        <div
          className="border-b px-3 py-2.5"
          style={{
            borderColor: 'var(--pd-border)',
            background: 'var(--pd-surface-raised)',
          }}
        >
          <div className="flex gap-8">
            {[
              'w-16',
              'w-36',
              'w-14',
              'w-10',
              'w-10',
              'w-10',
              'w-20',
              'w-14',
            ].map((w, i) => (
              <Skeleton key={i} className={`h-2.5 ${w}`} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-8 border-b px-3 py-3 last:border-0"
            style={{ borderColor: 'var(--pd-border)' }}
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="ml-auto h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}
