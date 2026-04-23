import fs from 'fs'
import path from 'path'

export type PromptVersion = string

export interface VersionInfo {
  id: PromptVersion
  label: string
  deprecated: boolean
}

export interface VersionsConfig {
  current: PromptVersion
  versions: VersionInfo[]
}

const VERSIONS_CONFIG_CACHE_KEY = 'versions-config'
const configCache = new Map<string, VersionsConfig>()

function getVersionsConfigPath(): string {
  return path.join(process.cwd(), 'lib', 'prompts', 'versions.json')
}

function loadVersionsConfig(): VersionsConfig {
  const cached = configCache.get(VERSIONS_CONFIG_CACHE_KEY)
  if (cached) return cached

  const filePath = getVersionsConfigPath()
  if (!fs.existsSync(filePath)) {
    throw new Error(`VERSIONS_CONFIG_NOT_FOUND: versions.json not found at ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const config = JSON.parse(content) as VersionsConfig
  configCache.set(VERSIONS_CONFIG_CACHE_KEY, config)
  return config
}

export function getCurrentPromptVersion(): PromptVersion {
  return loadVersionsConfig().current
}

export function getPromptVersions(): VersionInfo[] {
  return loadVersionsConfig().versions
}

export function getPromptVersionLabel(version: PromptVersion): string {
  const versions = getPromptVersions()
  const found = versions.find((v) => v.id === version)
  return found?.label || version
}

export function isPromptVersionDeprecated(version: PromptVersion): boolean {
  const versions = getPromptVersions()
  const found = versions.find((v) => v.id === version)
  return found?.deprecated ?? false
}

export function isValidPromptVersion(version: string): boolean {
  const versions = getPromptVersions()
  return versions.some((v) => v.id === version)
}

export function getPromptBasePath(version?: PromptVersion): string {
  const resolvedVersion = version || getCurrentPromptVersion()
  return path.join(process.cwd(), 'lib', 'prompts', resolvedVersion)
}

export function invalidateVersionsCache(): void {
  configCache.delete(VERSIONS_CONFIG_CACHE_KEY)
}