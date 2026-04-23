'use client'

import { useEffect, useState } from 'react'
import { AppIcon } from '@/components/ui/icons'

interface VersionInfo {
  id: string
  label: string
  deprecated: boolean
}

interface VersionsData {
  current: string
  versions: VersionInfo[]
}

export function PromptVersionSelect() {
  const [data, setData] = useState<VersionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/prompts/version')
      if (!res.ok) throw new Error('Failed to fetch versions')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVersionChange = async (version: string) => {
    if (!data || version === data.current) return
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/prompts/version', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      })
      if (!res.ok) throw new Error('Failed to set version')
      const json = await res.json()
      setData((prev) => prev ? { ...prev, current: json.current } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--glass-text-primary)]">提示词版本</label>
        <div className="text-sm text-[var(--glass-text-tertiary)]">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--glass-text-primary)]">提示词版本</label>
        <div className="text-sm text-[var(--glass-tone-danger-fg)]">{error}</div>
        <button onClick={fetchVersions} className="text-xs text-[var(--glass-accent-from)]">重试</button>
      </div>
    )
  }

  if (!data || data.versions.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AppIcon name="settingsHex" className="w-4 h-4 text-[var(--glass-text-secondary)]" />
        <label className="text-sm font-medium text-[var(--glass-text-primary)]">提示词版本</label>
      </div>

      <select
        value={data.current}
        onChange={(e) => handleVersionChange(e.target.value)}
        disabled={isSaving}
        className="w-full px-3 py-2 border border-[var(--glass-stroke-base)] rounded-lg bg-[var(--glass-bg-base)] text-[var(--glass-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent-from)] disabled:opacity-50 cursor-pointer"
      >
        {data.versions.map((v) => (
          <option key={v.id} value={v.id} disabled={v.deprecated}>
            {v.label} {v.deprecated ? '(已废弃)' : ''}
          </option>
        ))}
      </select>

      <p className="text-xs text-[var(--glass-text-tertiary)]">
        切换版本后，新的 AI 生成任务将使用选定版本的提示词模板
      </p>

      {isSaving && (
        <p className="text-xs text-[var(--glass-accent-from)]">保存中...</p>
      )}
    </div>
  )
}