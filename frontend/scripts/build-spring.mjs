import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_BASE_PATH, normalizeBasePath } from './lib/base-path.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(frontendRoot, '..')
const distDir = path.join(frontendRoot, 'dist')
const staticDir = path.resolve(repoRoot, 'src/main/resources/static')
const expectedStaticDir = path.resolve(
  repoRoot,
  'src',
  'main',
  'resources',
  'static',
)

/**
 * Deploy profiles:
 * - new-ui (default): verified coexistence path
 * - root-staging: preview under /_frontend-root-staging/
 * - root: base `/`, dist-only
 * - root-replace: replace old frontend at static root (requires SPRING_ENABLE_ROOT_DEPLOY=1)
 */
const DEPLOY_PROFILES = {
  'new-ui': {
    basePath: '/new-ui/',
    targetSubdir: 'new-ui',
    accessPath: '/new-ui/',
    allowCopy: true,
  },
  'root-staging': {
    basePath: '/_frontend-root-staging/',
    targetSubdir: '_frontend-root-staging',
    accessPath: '/_frontend-root-staging/',
    allowCopy: true,
  },
  root: {
    basePath: '/',
    targetSubdir: null,
    accessPath: '/',
    allowCopy: false,
    requiresRootDeployFlag: true,
  },
  'root-replace': {
    basePath: '/',
    targetSubdir: null,
    accessPath: '/',
    allowCopy: true,
    requiresRootDeployFlag: true,
    rootReplace: true,
  },
}

/** Only these direct children of static/ may be removed by root-replace. */
const ROOT_REPLACE_REMOVABLE = ['index.html', 'assets', 'css', 'js']

/** Explicitly preserved during root-replace (for rollback / docs). */
const ROOT_REPLACE_PRESERVED = [
  'favicon.ico',
  'README.md',
  'new-ui',
  '_frontend-root-staging',
]

const PROTECTED_STATIC_ENTRIES = new Set([
  'index.html',
  'css',
  'js',
  'favicon.ico',
  'README.md',
])

function parseArgs(argv) {
  let profile = process.env.SPRING_DEPLOY_PROFILE?.trim() || 'new-ui'
  let distOnly = process.env.SPRING_DIST_ONLY === '1'

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--profile' && argv[i + 1]) {
      profile = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--dist-only') {
      distOnly = true
    }
  }

  return { profile, distOnly }
}

function resolveProfile(name) {
  const profile = DEPLOY_PROFILES[name]
  if (!profile) {
    const available = Object.keys(DEPLOY_PROFILES).join(', ')
    throw new Error(`Unknown deploy profile "${name}". Available: ${available}`)
  }
  return profile
}

function resolveTargetDir(profileConfig) {
  if (profileConfig.targetSubdir) {
    return path.resolve(staticDir, profileConfig.targetSubdir)
  }
  return path.resolve(staticDir)
}

function assertRootDeployEnabled() {
  if (process.env.SPRING_ENABLE_ROOT_DEPLOY !== '1') {
    throw new Error(
      'Refusing to modify static root. Set SPRING_ENABLE_ROOT_DEPLOY=1 to replace the old frontend.',
    )
  }
}

/** Ensure we only ever operate on src/main/resources/static. */
function assertExactStaticResourcesDir() {
  const normalized = path.resolve(staticDir)
  const expected = path.resolve(expectedStaticDir)

  if (normalized !== expected) {
    throw new Error(
      `Static directory mismatch. Expected "${expected}", got "${normalized}".`,
    )
  }
}

function assertSafeTargetDir(targetDir, profileConfig) {
  const resolved = path.resolve(targetDir)
  const normalizedStatic = path.resolve(staticDir)

  if (resolved === normalizedStatic) {
    if (profileConfig.requiresRootDeployFlag) {
      assertRootDeployEnabled()
    } else {
      throw new Error(
        `Refusing to modify static root directory: "${normalizedStatic}".`,
      )
    }
  }

  const parent = path.resolve(path.dirname(resolved))
  if (resolved !== normalizedStatic && parent !== normalizedStatic) {
    throw new Error(
      `Unsafe target parent: "${parent}". ` +
        `Target must be a direct child of "${normalizedStatic}" or the static root with explicit flag.`,
    )
  }

  const relativeToStatic = path.relative(normalizedStatic, resolved)
  if (
    relativeToStatic.startsWith('..') ||
    path.isAbsolute(relativeToStatic)
  ) {
    throw new Error(
      `Target path escapes static directory: "${resolved}" ` +
        `(relative: "${relativeToStatic}").`,
    )
  }

  if (profileConfig.targetSubdir) {
    for (const entry of PROTECTED_STATIC_ENTRIES) {
      const protectedPath = path.resolve(staticDir, entry)
      if (resolved === protectedPath) {
        throw new Error(
          `Refusing to overwrite protected static entry: "${entry}".`,
        )
      }
    }
  }
}

/** Resolve a whitelisted static entry; must be a direct child of static/. */
function resolveWhitelistedStaticEntry(entryName) {
  assertExactStaticResourcesDir()

  if (!ROOT_REPLACE_REMOVABLE.includes(entryName)) {
    throw new Error(
      `"${entryName}" is not in the root-replace deletion whitelist: ` +
        `${ROOT_REPLACE_REMOVABLE.join(', ')}`,
    )
  }

  const entryPath = path.resolve(staticDir, entryName)
  const relative = path.relative(path.resolve(staticDir), entryPath)

  if (relative.startsWith('..') || path.isAbsolute(relative) || relative !== entryName) {
    throw new Error(
      `Unsafe whitelisted path for "${entryName}": "${entryPath}" (relative: "${relative}").`,
    )
  }

  return entryPath
}

function removeWhitelistedStaticEntry(entryName) {
  const entryPath = resolveWhitelistedStaticEntry(entryName)

  if (!existsSync(entryPath)) {
    console.log(`Skip remove (not found): ${entryName}`)
    return
  }

  rmSync(entryPath, { recursive: true, force: true })
  console.log(`Removed: src/main/resources/static/${entryName}`)
}

function deployRootReplace(sourceDistDir) {
  assertRootDeployEnabled()
  assertExactStaticResourcesDir()
  assertSafeDistDir(sourceDistDir)

  const distIndexPath = path.join(sourceDistDir, 'index.html')
  const distAssetsDir = path.join(sourceDistDir, 'assets')

  if (!existsSync(distIndexPath)) {
    throw new Error(`Build output missing index.html: ${distIndexPath}`)
  }

  if (!existsSync(distAssetsDir)) {
    throw new Error(`Build output missing assets/: ${distAssetsDir}`)
  }

  console.log('Root replace: removing old frontend entries (whitelist only)...')
  for (const entryName of ROOT_REPLACE_REMOVABLE) {
    removeWhitelistedStaticEntry(entryName)
  }

  const targetIndexPath = path.resolve(staticDir, 'index.html')
  const targetAssetsDir = path.resolve(staticDir, 'assets')

  console.log(`Copying ${distIndexPath} -> ${targetIndexPath}`)
  cpSync(distIndexPath, targetIndexPath)

  console.log(`Copying ${distAssetsDir} -> ${targetAssetsDir}`)
  mkdirSync(targetAssetsDir, { recursive: true })
  cpSync(distAssetsDir, targetAssetsDir, { recursive: true })

  console.log(
    `Preserved: ${ROOT_REPLACE_PRESERVED.join(', ')} (kept for rollback / docs)`,
  )
  console.log('Old frontend replaced at src/main/resources/static/')
  console.log('Access: http://localhost:8888/')
}

/** Ensure build output is read only from frontend/dist. */
function assertSafeDistDir(dir) {
  const resolved = path.resolve(dir)
  const normalizedFrontend = path.resolve(frontendRoot)
  const relative = path.relative(normalizedFrontend, resolved)

  if (relative.startsWith('..') || path.isAbsolute(relative) || relative !== 'dist') {
    throw new Error(
      `Unsafe dist directory: "${resolved}". ` +
        `Only "${path.join(normalizedFrontend, 'dist')}" is allowed.`,
    )
  }
}

function assertBuiltIndexUsesBase(distIndexPath, expectedBase) {
  const html = readFileSync(distIndexPath, 'utf8')
  const normalizedBase = normalizeBasePath(expectedBase)

  if (normalizedBase === '/') {
    if (html.includes('/new-ui/assets/')) {
      throw new Error(
        'Built index.html still references /new-ui/assets/. Root build base mismatch.',
      )
    }
    if (!html.includes('src="/assets/') && !html.includes('href="/assets/')) {
      throw new Error(
        'Built index.html does not reference /assets/. Root build output looks invalid.',
      )
    }
    return
  }

  const prefix = normalizedBase.replace(/\/$/, '')
  if (!html.includes(`${prefix}/assets/`)) {
    throw new Error(
      `Built index.html does not reference ${prefix}/assets/. Base path mismatch.`,
    )
  }
}

const { profile, distOnly } = parseArgs(process.argv.slice(2))
const profileConfig = resolveProfile(profile)
const basePath = normalizeBasePath(
  process.env.VITE_BASE_PATH ?? profileConfig.basePath ?? DEFAULT_BASE_PATH,
)

console.log(`Deploy profile: ${profile}`)
console.log(`Building frontend with base: ${basePath}`)

execSync('npm run build', {
  cwd: frontendRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BASE_PATH: basePath,
  },
})

assertSafeDistDir(distDir)

if (!existsSync(distDir)) {
  throw new Error(`Build output not found: ${distDir}`)
}

const distIndexPath = path.join(distDir, 'index.html')
if (!existsSync(distIndexPath)) {
  throw new Error(`Build output missing index.html: ${distIndexPath}`)
}

assertBuiltIndexUsesBase(distIndexPath, basePath)

if (distOnly || !profileConfig.allowCopy) {
  console.log(`Build finished (dist-only). Output: ${distDir}`)
  console.log(`Base path: ${basePath}`)
  if (profileConfig.requiresRootDeployFlag && !profileConfig.rootReplace) {
    console.log(
      'Root deploy to static/ is prepared but not executed. ' +
        'Use profile "root-staging" to preview, or run build:spring-root with SPRING_ENABLE_ROOT_DEPLOY=1.',
    )
  }
  process.exit(0)
}

if (profileConfig.rootReplace) {
  deployRootReplace(distDir)
  process.exit(0)
}

const targetDir = resolveTargetDir(profileConfig)
assertSafeTargetDir(targetDir, profileConfig)

console.log(`Copying ${distDir} -> ${targetDir}`)

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })
cpSync(distDir, targetDir, { recursive: true })

const relativeTarget = path.relative(repoRoot, targetDir).replace(/\\/g, '/')
console.log(`Spring static assets ready at ${relativeTarget}/`)
console.log(`Access: http://localhost:8888${profileConfig.accessPath}`)
