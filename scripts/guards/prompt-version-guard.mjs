#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()

function fail(title, details = []) {
  console.error(`\n[prompt-version-guard] ${title}`)
  for (const line of details) {
    console.error(`  - ${line}`)
  }
  process.exit(1)
}

function toRel(fullPath) {
  return path.relative(root, fullPath).split(path.sep).join('/')
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === '.next' || entry.name === 'node_modules') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, out)
      continue
    }
    out.push(fullPath)
  }
  return out
}

// 1. 检查 versions.json 存在且格式正确
function verifyVersionsConfig() {
  const versionsPath = path.join(root, 'lib', 'prompts', 'versions.json')
  if (!fs.existsSync(versionsPath)) {
    fail('Missing versions.json', ['lib/prompts/versions.json is required'])
  }

  const content = fs.readFileSync(versionsPath, 'utf8')
  let config
  try {
    config = JSON.parse(content)
  } catch (err) {
    fail('Invalid versions.json format', ['Failed to parse JSON'])
  }

  if (!config.current) {
    fail('Missing current version in versions.json', ['current field is required'])
  }

  if (!Array.isArray(config.versions) || config.versions.length === 0) {
    fail('Missing versions list in versions.json', ['versions array is required'])
  }

  const versionIds = config.versions.map(v => v.id)
  if (!versionIds.includes(config.current)) {
    fail('Current version not in versions list', [`current: ${config.current}, available: ${versionIds.join(', ')}`])
  }

  return config
}

// 2. 检查当前版本目录存在且包含 manifest.json
function verifyCurrentVersionDir(config) {
  const currentVersion = config.current
  const versionDir = path.join(root, 'lib', 'prompts', currentVersion)

  if (!fs.existsSync(versionDir)) {
    fail(`Version directory not found`, [`lib/prompts/${currentVersion}/ is required`])
  }

  const manifestPath = path.join(versionDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    fail(`Missing manifest.json`, [`lib/prompts/${currentVersion}/manifest.json is required`])
  }

  const manifestContent = fs.readFileSync(manifestPath, 'utf8')
  let manifest
  try {
    manifest = JSON.parse(manifestContent)
  } catch (err) {
    fail('Invalid manifest.json format', [`Failed to parse lib/prompts/${currentVersion}/manifest.json`])
  }

  if (manifest.version !== currentVersion) {
    fail('Manifest version mismatch', [`manifest.json version: ${manifest.version}, expected: ${currentVersion}`])
  }

  return { versionDir, manifest }
}

// 3. 检查版本目录内的模板文件完整性
function verifyTemplateFileCount(versionDir, manifest) {
  const expectedCount = manifest.promptCount
  const actualFiles = walk(versionDir).filter(f => f.endsWith('.txt'))
  const actualCount = actualFiles.length

  if (expectedCount && actualCount !== expectedCount) {
    fail('Template file count mismatch', [
      `manifest.json declares ${expectedCount} files`,
      `actual count: ${actualCount}`,
      `difference: ${expectedCount - actualCount}`
    ])
  }
}

// 4. 检查版本目录内子目录结构
function verifyVersionStructure(versionDir) {
  const requiredDirs = ['character-reference', 'novel-promotion', 'skills']
  const optionalDirs = ['inline', 'suffix', 'art-styles', 'voice-presets']

  for (const dir of requiredDirs) {
    const dirPath = path.join(versionDir, dir)
    if (!fs.existsSync(dirPath)) {
      fail(`Missing required directory in version`, [`lib/prompts/v1/${dir}/ is required`])
    }
  }
}

// 执行所有检查
const config = verifyVersionsConfig()
const { versionDir, manifest } = verifyCurrentVersionDir(config)
verifyVersionStructure(versionDir)
verifyTemplateFileCount(versionDir, manifest)

console.log('[prompt-version-guard] OK')
console.log(`  Current version: ${config.current}`)
console.log(`  Available versions: ${config.versions.map(v => v.id).join(', ')}`)
console.log(`  Template files: ${manifest.promptCount}`)