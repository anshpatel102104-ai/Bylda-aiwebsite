import { Showreel } from './components/Showreel/Showreel'
import { ProductPage } from './components/product/ProductPage'
import { Capabilities } from './components/site/Capabilities'
import { FinalCta, Footer } from './components/site/Closing'
import { Faq } from './components/site/Faq'
import { Hero } from './components/site/Hero'
import { LoopCards } from './components/site/LoopCards'
import { Manifesto } from './components/site/Manifesto'
import { Nav } from './components/site/Nav'
import { PearlBackdrop } from './components/site/PearlBackdrop'
import { Pricing } from './components/site/Pricing'
import { ProductTour } from './components/site/ProductTour'
import { Proof } from './components/site/Proof'
import { HelpButton, RequestAccess, Toast } from './components/site/RequestAccess'
import { RoleCards } from './components/site/RoleCards'
import { Statement } from './components/site/Statement'
import { findPage } from './data/product-pages'
import { useEffect, useState } from 'react'
import './styles/site.css'
import './styles/product.css'

/** Pricing stays hidden until the numbers are confirmed. Preview it with ?pricing=1. */
function usePricingFlag() {
  const [on, setOn] = useState(false)
  useEffect(() => { setOn(new URLSearchParams(window.location.search).get('pricing') === '1') }, [])
  return on
}

/** The product page for /product/<slug>, or undefined for the homepage. */
export function pageFor(path: string) {
  const m = /^\/product\/([a-z0-9-]+)\/?$/.exec(path)
  return m ? findPage(m[1]) : undefined
}

function Home() {
  const pricing = usePricingFlag()
  return (
    <>
      <Hero />
      <section id="showreel" className="showreel-section" aria-labelledby="showreel-title">
        <div className="wrap">
          <h2 id="showreel-title" className="display-hero showreel-h">See what your team does when you are not on the call.</h2>
          <Showreel />
        </div>
      </section>
      <Proof />
      <LoopCards />
      <ProductTour />
      <RoleCards />
      <Statement />
      <Manifesto />
      <Capabilities />
      {pricing && <Pricing />}
      <Faq />
      <FinalCta />
    </>
  )
}

export function App({ path = '/' }: { path?: string }) {
  const page = pageFor(path)
  return (
    <>
      <PearlBackdrop />
      <a className="skip" href="#main">Skip to content</a>
      <Nav current={page?.slug} />
      <main id="main">
        {page ? <ProductPage page={page} /> : <Home />}
      </main>
      <Footer />
      <RequestAccess />
      <Toast />
      <HelpButton />
    </>
  )
}
