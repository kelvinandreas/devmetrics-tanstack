import { useSuspenseQuery } from '@tanstack/react-query'
import { getUserDetail } from '#/services/github'

export const userDetailQueryOptions = (username: string) => ({
  queryKey: ['users', username] as const,
  queryFn: () => getUserDetail(username),
})

export function useUserDetail(username: string) {
  return useSuspenseQuery(userDetailQueryOptions(username))
}
