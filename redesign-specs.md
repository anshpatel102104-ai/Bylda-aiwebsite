# Bylda — Full Layout Redesign v5 Spec

## CRITICAL RULES
- Keep ALL nav, footer, meta, head, scripts EXACTLY as-is
- Only rewrite the `<main>` content
- Preserve ALL existing copy/text word-for-word
- Keep data-theme attributes on html tags
- Calendar placeholder: `<div class="calendar-embed">Booking Calendar</div>` 
- Keep all existing links (tally.so, calendar, phone, email) exactly the same
- Add `reveal` class to sections for scroll animation
- Use CSS classes from style.css — avoid heavy inline styles
- Keep pages lightweight, no new libraries

## Design System
- Light mode, purple accent (#0284C7 primary, #0EA5E9 secondary)
- Fonts: Cabinet Grotesk (display), Satoshi (body), IBM Plex Mono (mono)
- Use CSS variables from style.css (--teal, --text, --bg-card, etc.)

## Per-Page Layouts

### index.html — Bento Grid Hero
- Hero: Full-width bento grid layout with large headline tile + stat tiles arranged asymmetrically (not side-by-side split)
- Big headline in oversized tile, 4 stat cards as smaller bento cells
- Problem section: Full-bleed dark band with oversized numbers
- Features: Alternating image-left/text-right with terminal mockups (keep existing terminals)
- How it works: Horizontal numbered stepper with connecting line
- Industries: Pill/chip grid (keep existing)
- Testimonials: Offset/staggered grid (not uniform 3-col)
- Pricing teaser: Full-bleed gradient band
- CTA: Large centered with glow

### services.html — Full-Width Service Rows
- Hero: Keep page-hero
- Services: Full-width numbered rows (number | icon | content | arrow) — editorial magazine list style, NOT card grid
- Stacks: Horizontal comparison cards (keep existing stack concept but make it wider)
- Process: Vertical timeline with dots + connecting line (not horizontal)
- Calendar section
- CTA

### pricing.html — Big Price Anchors
- Hero: Keep page-hero  
- Guarantee: Oversized banner with icon
- Cards: 3 columns but with MUCH larger price numbers (64px+) and bold visual hierarchy
- Comparison: Full-width sticky-header table
- ROI: Side-by-side math blocks with background accent
- FAQ: Inline accordion
- Calendar + CTA

### results.html — Magazine Grid
- Hero: Keep page-hero
- Stats bar: Full-bleed with large counter numbers (keep existing hero-stats)
- Case studies: Asymmetric grid — first card spans 2 columns as "featured" hero case study, rest in alternating 1-col cards
- Testimonials: Horizontal scroll or offset cards
- Calendar + CTA

### about.html — Vertical Timeline Story
- Hero: Keep page-hero
- Manifesto: Full-bleed quote block with oversized quotation mark
- Story: Vertical timeline layout — alternating left/right content blocks with connecting dotted line
- Values: 2-column side-by-side layout (icon+text pairs), NOT 3-col card grid
- Tech: Horizontal scrolling pill/badge row or compact list, NOT card grid
- Guarantee box
- CTA

### contact.html — Split Panel
- Hero: Keep page-hero
- Primary CTA: Full-width gradient banner (keep existing)
- Contact: 2-col but with left side as large colorful panel with big text + contact info, right side is the form in a floating card
- Other ways: 3 inline cards (keep existing concept)
- Calendar section
- CTA

### faq.html — Sidebar Navigation
- Hero: Keep page-hero
- Layout: 2-column — left sticky sidebar with category links, right column with accordion content
- Each category gets an anchor ID
- Still-questions box
- CTA
