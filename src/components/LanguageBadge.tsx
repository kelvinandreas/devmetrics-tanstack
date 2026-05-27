import { langColor } from '#/lib/langs'
import { Badge } from '@/components/ui/badge'

export function LanguageBadge({ language }: { language: string }) {
  const dot = langColor(language)
  return (
    <Badge
      variant="outline"
      className="gap-1.5 font-mono text-[10px] uppercase tracking-wider"
    >
      <span
        className="inline-block size-1.5 shrink-0 rounded-full"
        style={{ background: dot }}
      />
      {language}
    </Badge>
  )
}
