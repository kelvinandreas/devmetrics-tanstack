const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#fa7343',
  Kotlin: '#7f52ff',
  PHP: '#4f5d95',
  Shell: '#89e051',
  Dart: '#00b4ab',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
}

export function langColor(lang: string): string {
  return LANG_COLORS[lang] ?? '#6e7681'
}
