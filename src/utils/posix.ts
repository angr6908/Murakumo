/**
 * Minimal POSIX path helpers replacing the `node:path` (posix) imports. Covers only
 * the operations Murakumo uses, implemented with plain string logic so they run
 * identically in Bun and the browser with no `node:` module. Paths here are always
 * `/`-separated (Windows-style separators are not handled, matching `posix`).
 */

/** Split on `/`, dropping empty segments (and any `.` current-dir entries). */
const splitSegments = (path: string): string[] => path.split('/').filter(seg => seg !== '' && seg !== '.')

/** Collapse `.`/`..` and repeated slashes, preserving a leading `/`. */
export function normalize(path: string): string {
  const leading = path.startsWith('/')
  const segs: string[] = []
  for (const seg of splitSegments(path)) {
    if (seg === '..') {
      if (segs.length && segs[segs.length - 1] !== '..') segs.pop()
      else if (!leading) segs.push('..')
    } else {
      segs.push(seg)
    }
  }
  const joined = segs.join('/')
  if (leading) return `/${joined}`
  if (joined === '') return '.'
  return joined
}

/** Resolve `base` then `...paths`, producing an absolute path (leading `/`). */
export function resolve(base: string, ...paths: string[]): string {
  let resolved = base
  for (const p of paths) {
    if (p.startsWith('/')) resolved = p
    else if (resolved.endsWith('/')) resolved = `${resolved}${p}`
    else resolved = `${resolved}/${p}`
  }
  const normalized = normalize(resolved)
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

/**
 * Join segments with `/`, collapsing duplicate separators. Unlike `resolve`, a
 * leading `/` in a later segment does NOT reset the path (matches `path.join`).
 */
export function join(base: string, ...paths: string[]): string {
  const combined = [base, ...paths].join('/')
  return normalize(combined)
}
