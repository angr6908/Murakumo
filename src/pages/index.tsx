import type { GetStaticProps } from 'next'

import DrivePage, { driveLayout } from '../components/DrivePage'
import { getServerSidePublicConfigProps } from '../utils/serverConfig'

function Home() {
  return <DrivePage />
}
Home.getLayout = driveLayout
export default Home

// Statically generated: the props are env-derived and identical per request, so the HTML is
// prebuilt and served from the edge instead of cold-starting a function on every visit.
export const getStaticProps: GetStaticProps = async () => getServerSidePublicConfigProps()
