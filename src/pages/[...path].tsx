import type { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'

import DrivePage, { driveLayout } from '../components/DrivePage'
import { getServerSidePublicConfigProps } from '../utils/serverConfig'

function Folders() {
  const { query } = useRouter()

  return (
    <DrivePage query={query} navClassName="mb-4 flex items-center justify-between space-x-3 px-4 sm:px-0 sm:pl-1" />
  )
}
Folders.getLayout = driveLayout
export default Folders

// The shell HTML does not depend on the path (folder data loads client-side via SWR), so the
// props are identical for every route. Generate on first hit, then serve statically from the edge.
export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export const getStaticProps: GetStaticProps = async () => getServerSidePublicConfigProps()
