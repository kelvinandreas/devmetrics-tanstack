import api from '#/lib/axios'
import type {
  GitHubUserSearchResult,
  GitHubUserDetail,
  GitHubRepo,
  GitHubRepoFull,
  GitHubEvent,
} from '#/types/github'

export async function searchUsers(
  query: string,
): Promise<GitHubUserSearchResult> {
  const { data } = await api.get<GitHubUserSearchResult>('/search/users', {
    params: { q: query, per_page: 12 },
  })
  return data
}

export async function getUserDetail(
  username: string,
): Promise<GitHubUserDetail> {
  const { data } = await api.get<GitHubUserDetail>(`/users/${username}`)
  return data
}

export async function getUserRepos(username: string): Promise<GitHubRepo[]> {
  const { data } = await api.get<GitHubRepo[]>(`/users/${username}/repos`, {
    params: { sort: 'updated', per_page: 6 },
  })
  return data
}

export async function getUserAllRepos(
  username: string,
): Promise<GitHubRepoFull[]> {
  const { data } = await api.get<GitHubRepoFull[]>(`/users/${username}/repos`, {
    params: { sort: 'updated', per_page: 100 },
  })
  return data
}

export async function getUserEvents(
  username: string,
  page: number,
): Promise<GitHubEvent[]> {
  const { data } = await api.get<GitHubEvent[]>(
    `/users/${username}/events/public`,
    { params: { per_page: 30, page } },
  )
  return data
}
