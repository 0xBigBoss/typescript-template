#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Split to avoid self-replacement
const OLD_SCOPE = ['@', 'template'].join('')

async function prompt(question: string): Promise<string> {
  process.stdout.write(question)
  for await (const line of console) {
    return line.trim()
  }
  return ''
}

async function findFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const results: string[] = []

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true })
    const dirs: string[] = []

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', 'scripts'].includes(entry.name)) {
          dirs.push(fullPath)
        }
      } else if (pattern.test(entry.name)) {
        results.push(fullPath)
      }
    }

    await Promise.all(dirs.map((d) => walk(d)))
  }

  await walk(dir)
  return results
}

async function replaceInFile(
  filePath: string,
  oldScope: string,
  newScope: string,
): Promise<{ path: string; changed: boolean }> {
  const content = await readFile(filePath, 'utf-8')
  if (!content.includes(oldScope)) {
    return { path: filePath, changed: false }
  }
  const updated = content.replaceAll(oldScope, newScope)
  await writeFile(filePath, updated)
  return { path: filePath, changed: true }
}

async function main(): Promise<void> {
  console.log('Template Setup')
  console.log('==============\n')

  const scope = await prompt('Package scope (e.g., @myorg): ')

  if (!scope) {
    console.error('Error: scope is required')
    process.exit(1)
  }

  if (!scope.startsWith('@')) {
    console.error('Error: scope must start with @')
    process.exit(1)
  }

  console.log(`\nReplacing ${OLD_SCOPE} → ${scope}...\n`)

  const root = join(import.meta.dir, '..')
  const files = await findFiles(root, /\.(json|ts|tsx)$/)

  const results = await Promise.all(files.map((f) => replaceInFile(f, OLD_SCOPE, scope)))

  let count = 0
  for (const { path, changed } of results) {
    if (changed) {
      console.log(`  Updated: ${path.replace(root + '/', '')}`)
      count++
    }
  }

  console.log(`\nDone! Updated ${count} files.`)
  console.log('\nNext steps:')
  console.log('  1. Update root package.json "name" field')
  console.log('  2. Run: bun install')
  console.log('  3. Run: bun run check')
}

main()
