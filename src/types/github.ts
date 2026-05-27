export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  html_url: string
  type: 'User' | 'Organization'
  site_admin: boolean
  score: number
  gravatar_id: string
  url: string
  repos_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  received_events_url: string
  events_url: string
}

export interface GitHubUserSearchResult {
  total_count: number
  incomplete_results: boolean
  items: GitHubUser[]
}

export interface GitHubUserDetail {
  id: number
  login: string
  avatar_url: string
  html_url: string
  type: 'User' | 'Organization'
  site_admin: boolean
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  bio: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  html_url: string
  updated_at: string
  topics: string[]
  visibility: string
}

export interface GitHubRepoFull extends GitHubRepo {
  watchers_count: number
  open_issues_count: number
  license: { name: string; spdx_id: string } | null
  archived: boolean
  disabled: boolean
  pushed_at: string
  clone_url: string
}

export interface GitHubEvent {
  id: string
  type: string
  actor: {
    id: number
    login: string
    display_login: string
    gravatar_id: string
    url: string
    avatar_url: string
  }
  repo: {
    id: number
    name: string
    url: string
  }
  payload: Record<string, unknown>
  public: boolean
  created_at: string
}
