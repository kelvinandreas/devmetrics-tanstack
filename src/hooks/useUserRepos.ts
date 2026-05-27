import { useSuspenseQuery } from '@tanstack/react-query'
import { getUserRepos } from '#/services/github'

export const userReposQueryOptions = (username: string) => ({
  queryKey: ['users', username, 'repos'] as const,
  queryFn: () => getUserRepos(username),
})

export function useUserRepos(username: string) {
  return useSuspenseQuery(userReposQueryOptions(username))
}
