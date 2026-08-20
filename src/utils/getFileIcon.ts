import type { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core'
import { extensionCategory, type FileCategory } from './fileType'

// Category -> FontAwesome icon prefix. `markdown` uses the brand glyph; everything else uses a
// regular file glyph.
const iconForCategory: Record<FileCategory, [IconPrefix, IconName]> = {
  image: ['far', 'file-image'],
  pdf: ['far', 'file-pdf'],
  office: ['far', 'file-alt'],
  markdown: ['fab', 'markdown'],
  code: ['far', 'file-code'],
  text: ['far', 'file-alt'],
  video: ['far', 'file-video'],
  audio: ['far', 'file-audio'],
  epub: ['fas', 'book'],
  book: ['fas', 'book'],
  url: ['fas', 'link'],
  archive: ['far', 'file-archive'],
}

// Office documents have distinct icons per actual format, so resolve them before the category.
const officeIconBySubtype: Record<string, [IconPrefix, IconName]> = {
  doc: ['far', 'file-word'],
  docx: ['far', 'file-word'],
  ppt: ['far', 'file-powerpoint'],
  pptx: ['far', 'file-powerpoint'],
  xls: ['far', 'file-excel'],
  xlsx: ['far', 'file-excel'],
}

export function getRawExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2)
}
export function getExtension(fileName: string): string {
  return getRawExtension(fileName).toLowerCase()
}
/** Drop the trailing `.ext` from a file name or path. */
export function stripExtension(fileName: string): string {
  return fileName.slice(0, fileName.lastIndexOf('.'))
}

export function getFileIcon(fileName: string, flags?: { video?: boolean }): [IconPrefix, IconName] {
  const extension = getExtension(fileName)
  if (extension === 'ts' && flags?.video) return iconForCategory.video

  const category = extensionCategory[extension]
  if (category === 'office') return officeIconBySubtype[extension] ?? iconForCategory.office
  return category ? iconForCategory[category] : ['far', 'file']
}
