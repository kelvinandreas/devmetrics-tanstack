import { useSuspenseQuery } from '@tanstack/react-query'
import { getUserAllRepos } from '#/services/github'

export const userAllReposQueryOptions = (username: string) => ({
  queryKey: ['users', username, 'repos', 'all'] as const,
  queryFn: () => getUserAllRepos(username),
})

export function useUserAllRepos(username: string) {
  return useSuspenseQuery(userAllReposQueryOptions(username))
}
