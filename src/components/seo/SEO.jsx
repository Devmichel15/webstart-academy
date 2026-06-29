import { Helmet } from 'react-helmet-async'

const BASE_URL = 'https://webstart.academy'
const DEFAULT_DESCRIPTION = 'WebStart Academy - A plataforma interativa para aprender desenvolvimento web do zero. Cursos de HTML, CSS, JavaScript e muito mais com laboratório de código ao vivo.'
const DEFAULT_IMAGE = '/logo.svg'
const SITE_NAME = 'WebStart Academy'

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = '',
  type = 'website',
  keywords = '',
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Aprenda Desenvolvimento Web`
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${BASE_URL}${image}`} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${BASE_URL}${image}`} />
    </Helmet>
  )
}
