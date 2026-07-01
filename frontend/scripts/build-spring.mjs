import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(frontendRoot, '..')
const distDir = path.join(frontendRoot, 'dist')
const staticDir = path.resolve(repoRoot, 'src/main/resources/static')
const targetDir = path.resolve(staticDir, 'new-ui')

const ALLOWED_TARGET_BASENAME = 'new-ui'

/**
 * Ensure a resolved path is the only permitted Spring static deploy target.
 * Refuses static root, parent directories, symlinks outside static/new-ui, etc.
 */
function assertSafeTargetDir(dir) {
  const resolved = path.resolve(dir)
  const normalizedStatic = path.resolve(staticDir)
  const normalizedExpected = path.resolve(targetDir)

  if (resolved !== normalizedExpected) {
    throw new Error(
      `Unsafe target directory: "${resolved}". ` +
        `Only "${normalizedExpected}" is allowed.`,
    )
  }

  if (path.basename(resolved) !== ALLOWED_TARGET_BASENAME) {
    throw new Error(
      `Unsafe target basename: "${path.basename(resolved)}". ` +
        `Expected "${ALLOWED_TARGET_BASENAME}".`,
    )
  }

  if (resolved === normalizedStatic) {
    throw new Error(
      `Refusing to modify static root directory: "${normalizedStatic}".`,
    )
  }

  const parent = path.resolve(path.dirname(resolved))
  if (parent !== normalizedStatic) {
    throw new Error(
      `Unsafe target parent: "${parent}". ` +
        `Target must be a direct child of "${normalizedStatic}".`,
    )
  }

  const relativeToStatic = path.relative(normalizedStatic, resolved)
  if (
    relativeToStatic.startsWith('..') ||
    path.isAbsolute(relativeToStatic) ||
    relativeToStatic !== ALLOWED_TARGET_BASENAME
  ) {
    throw new Error(
      `Target path escapes static/new-ui: "${resolved}" ` +
        `(relative to static: "${relativeToStatic}").`,
    )
  }
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

const basePath = process.env.VITE_BASE_PATH || '/new-ui/'

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

assertSafeTargetDir(targetDir)

console.log(`Copying ${distDir} -> ${targetDir}`)

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })
cpSync(distDir, targetDir, { recursive: true })

console.log('Spring static assets ready at src/main/resources/static/new-ui/')
console.log('Access: http://localhost:8888/new-ui/')
