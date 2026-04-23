import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentPromptVersion,
  getPromptVersions,
  isValidPromptVersion,
  invalidateVersionsCache,
  invalidateTemplateCache,
} from '@/lib/prompt-i18n'
import fs from 'fs'
import path from 'path'

function getVersionsConfigPath(): string {
  return path.join(process.cwd(), 'lib', 'prompts', 'versions.json')
}

function setCurrentVersion(version: string): void {
  const filePath = getVersionsConfigPath()
  const content = fs.readFileSync(filePath, 'utf-8')
  const config = JSON.parse(content)
  config.current = version
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  invalidateVersionsCache()
  invalidateTemplateCache()
}

export async function GET() {
  try {
    const currentVersion = getCurrentPromptVersion()
    const versions = getPromptVersions()
    return NextResponse.json({
      current: currentVersion,
      versions,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get prompt versions' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { version } = body

    if (!version || typeof version !== 'string') {
      return NextResponse.json(
        { error: 'version is required' },
        { status: 400 },
      )
    }

    if (!isValidPromptVersion(version)) {
      return NextResponse.json(
        { error: `Invalid version: ${version}` },
        { status: 400 },
      )
    }

    setCurrentVersion(version)

    return NextResponse.json({
      success: true,
      current: version,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set prompt version' },
      { status: 500 },
    )
  }
}