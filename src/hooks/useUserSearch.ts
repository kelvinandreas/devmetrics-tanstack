import { useSuspenseQuery } from '@tanstack/react-query'
import { searchUsers } from '#/services/github'

export const userSearchQueryOptions = (query: string) => ({
  queryKey: ['users', 'search', query] as const,
  queryFn: () => searchUsers(query),
})

export function useUserSearch(query: string) {
  return useSuspenseQuery(userSearchQueryOptions(query))
}
