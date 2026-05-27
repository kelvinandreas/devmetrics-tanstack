import axios from 'axios'

const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined

const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
})

// Improve 403 error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 403) {
      const remaining = err.response.headers?.['x-ratelimit-remaining']
      if (remaining === '0') {
        const reset = err.response.headers?.['x-ratelimit-reset']
        const resetTime = reset
          ? new Date(Number(reset) * 1000).toLocaleTimeString()
          : 'soon'
        err.message = `GitHub API rate limit exceeded. Resets at ${resetTime}. Add a VITE_GITHUB_TOKEN to your .env to increase the limit.`
      }
    }
    if (err.response?.status === 404) {
      err.message = 'User not found on GitHub.'
    }
    return Promise.reject(err)
  },
)

export default api
