import { getFileCategory } from './fileType'
import { getExtension } from './getFileIcon'

export const preview = {
  markdown: 'markdown',
  image: 'image',
  text: 'text',
  pdf: 'pdf',
  code: 'code',
  video: 'video',
  audio: 'audio',
  office: 'ms-office',
  epub: 'epub',
  url: 'url',
} as const

type PreviewName = (typeof preview)[keyof typeof preview]

// Categories that have an in-browser preview. `archive` and `book` have icons but no preview,
// so they fall through to the default file view.
const previewForCategory: Record<string, PreviewName> = {
  image: preview.image,
  markdown: preview.markdown,
  pdf: preview.pdf,
  office: preview.office,
  code: preview.code,
  text: preview.text,
  video: preview.video,
  audio: preview.audio,
  epub: preview.epub,
  url: preview.url,
}

export function getPreviewType(extension: string, flags?: { video?: boolean }): string | undefined {
  if (extension === 'ts' && flags?.video) return preview.video
  const category = getFileCategory(extension)
  return category ? previewForCategory[category] : undefined
}

const languageAliases: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  rs: 'rust',
  js: 'javascript',
  jsx: 'javascript',
  sh: 'shell',
  cs: 'csharp',
  py: 'python',
  yml: 'yaml',
}

export function getLanguageByFileName(filename: string): string {
  const extension = getExtension(filename)
  return languageAliases[extension] ?? extension
}
