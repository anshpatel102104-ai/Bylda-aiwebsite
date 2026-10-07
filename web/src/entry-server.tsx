import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'
import { FAQ } from './data/site'

/** Prerender entry: the build writes this HTML into dist/index.html, then the client hydrates it. */
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

/** FAQPage structured data, built from the FAQ the page renders so the two cannot drift apart. */
export function faqJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://usebylda.com/#faq',
    url: 'https://usebylda.com/',
    mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  })
}
