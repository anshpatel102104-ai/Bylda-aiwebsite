import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'
import { PRODUCT_PAGES, productHref } from './data/product-pages'
import { FAQ } from './data/site'

const ORIGIN = 'https://usebylda.com'

/** Prerender entry: the build writes this HTML into each page, then the client hydrates it. */
export function render(path = '/') {
  return renderToString(
    <StrictMode>
      <App path={path} />
    </StrictMode>,
  )
}

/** FAQPage structured data, built from the FAQ the page renders so the two cannot drift apart. */
export function faqJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${ORIGIN}/#faq`,
    url: `${ORIGIN}/`,
    mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  })
}

/** Every product page, with the head tags and structured data the prerender writes into it. */
export function productRoutes() {
  return PRODUCT_PAGES.map(p => {
    const path = productHref(p.slug)
    const url = `${ORIGIN}${path}`
    return {
      path,
      file: `${path.slice(1)}.html`,
      title: p.metaTitle,
      description: p.metaDescription,
      url,
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${url}#page`,
            url,
            name: p.metaTitle,
            description: p.metaDescription,
            inLanguage: 'en',
            isPartOf: { '@id': `${ORIGIN}/#site` },
            about: { '@id': `${ORIGIN}/#app` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'Product', item: `${ORIGIN}/product` },
              { '@type': 'ListItem', position: 3, name: p.label, item: url },
            ],
          },
        ],
      }),
    }
  })
}
