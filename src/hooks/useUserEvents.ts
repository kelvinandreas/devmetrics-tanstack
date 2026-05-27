import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { getUserEvents } from '#/services/github'

export const userEventsQueryOptions = (username: string) =>
  infiniteQueryOptions({
    queryKey: ['users', username, 'events'] as const,
    queryFn: ({ pageParam }) => getUserEvents(username, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length < 30 ? undefined : lastPageParam + 1,
    enabled: Boolean(username),
  })

export function useUserEvents(username: string) {
  return useInfiniteQuery(userEventsQueryOptions(username))
}
