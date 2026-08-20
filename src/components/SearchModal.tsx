import { Dialog, Transition } from '@headlessui/react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { Fragment, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import useConstant from 'use-constant'
import type { OdSearchResult } from '../types'
import { FontAwesomeIcon } from '../utils/fontawesome'

import { getFileIcon } from '../utils/getFileIcon'
import { get } from '../utils/http'
import HiddenFocusGuard from './HiddenFocusGuard'
import { LoadingIcon } from './Loading'

type SearchItem = OdSearchResult[number]
type SearchState = ReturnType<typeof useDriveItemSearch>['results']

function useDriveItemSearch() {
  const [query, setQuery] = useState('')
  const searchDriveItem = async (q: string) => {
    const { data } = await get('/api/search/', { params: { q: q.trim() } })
    return data.map((item: OdSearchResult[number]) => ({
      ...item,
      path: typeof item.path === 'string' ? item.path : '',
    }))
  }

  const debouncedDriveItemSearch = useConstant(() => AwesomeDebouncePromise(searchDriveItem, 1000))
  const results = useAsync(async () => {
    return query.trim().length === 0 ? [] : debouncedDriveItemSearch(query)
  }, [query])

  return { query, setQuery, results }
}

function SearchResultRow({
  item,
  driveItemPath,
  description,
  disabled,
  onSelect,
}: {
  item: SearchItem
  driveItemPath: string
  description: string
  disabled: boolean
  onSelect?: () => void
}) {
  const baseClassName = 'flex w-full items-center gap-4 border-b border-gray-400/30 px-4 py-1.5 text-left'
  const stateClassName = disabled
    ? 'cursor-not-allowed opacity-70'
    : 'dark:hover:bg-gray-850 cursor-pointer hover:bg-gray-50'
  const className = `${baseClassName} ${stateClassName}`
  const content = (
    <>
      <FontAwesomeIcon className="h-4 w-4 flex-none" icon={item.file ? getFileIcon(item.name) : ['far', 'folder']} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-sm leading-8">{item.name}</div>
        <div
          className={`truncate font-mono text-xs opacity-60 ${description === 'Loading ...' ? 'animate-pulse' : ''}`}
        >
          {description}
        </div>
      </div>
    </>
  )

  if (disabled) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link href={driveItemPath} passHref prefetch={false} className={className} onClick={onSelect}>
      {content}
    </Link>
  )
}

function SearchResultItem({ item, onSelect }: { item: SearchItem; onSelect: () => void }) {
  const driveItemPath = decodeURIComponent(item.path)
  const disabled = item.path === ''
  return (
    <SearchResultRow
      item={item}
      driveItemPath={item.path}
      description={disabled ? 'Path unavailable' : driveItemPath}
      disabled={disabled}
      onSelect={onSelect}
    />
  )
}

function SearchResults({ query, results, onSelect }: { query: string; results: SearchState; onSelect: () => void }) {
  if (query.trim().length === 0) return null

  if (results.loading) {
    return (
      <div className="px-4 py-12 text-center font-medium text-sm">
        <LoadingIcon className="svg-inline--fa mr-2 inline-block h-4 w-4 animate-spin" />
        <span>{'Loading ...'}</span>
      </div>
    )
  }

  if (results.error) {
    return (
      <div className="px-4 py-12 text-center font-medium text-sm">
        {`Error: ${results.error.message ?? 'Search failed.'}`}
      </div>
    )
  }

  if (!results.result || results.result.length === 0) {
    return <div className="px-4 py-12 text-center font-medium text-sm">{'Nothing here.'}</div>
  }

  return (
    <>
      {results.result.map(item => (
        <SearchResultItem key={item.id} item={item} onSelect={onSelect} />
      ))}
    </>
  )
}

export default function SearchModal({
  searchOpen,
  setSearchOpen,
}: {
  searchOpen: boolean
  setSearchOpen: Dispatch<SetStateAction<boolean>>
}) {
  const { query, setQuery, results } = useDriveItemSearch()
  const searchFocusGuardRef = useRef<HTMLButtonElement>(null)

  const closeSearchBox = () => {
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <Transition appear show={searchOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-[200] overflow-y-auto"
        initialFocus={searchFocusGuardRef}
        onClose={closeSearchBox}
      >
        <div className="relative min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-0 bg-white/80 dark:bg-gray-800/80" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative z-10 my-12 inline-block w-full max-w-3xl transform overflow-hidden rounded border border-gray-400/30 text-left shadow-xl transition-all">
              <HiddenFocusGuard ref={searchFocusGuardRef} />
              <Dialog.Title className="sr-only">Search</Dialog.Title>
              <div className="flex items-center gap-4 border-gray-400/30 border-b bg-gray-50 p-4 dark:bg-gray-800 dark:text-white">
                <FontAwesomeIcon icon="search" className="h-4 w-4" />
                <input
                  type="text"
                  id="search-box"
                  className="min-w-0 flex-1 bg-transparent"
                  placeholder={'Search ...'}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <div className="flex-none rounded-lg bg-gray-200 px-2 py-1 font-medium text-xs dark:bg-gray-700">
                  ESC
                </div>
              </div>
              <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900 dark:text-white">
                <SearchResults query={query} results={results} onSelect={closeSearchBox} />
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
