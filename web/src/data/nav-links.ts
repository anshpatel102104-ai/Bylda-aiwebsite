/**
 * Solutions and Resources menus. Kept free of imports so
 * scripts/sync-static-nav.mjs can read it and write the same menus into the
 * static pages.
 *
 * The Solutions links land on the homepage role cards; RoleCards spotlights the
 * card whose id is in the hash.
 */
export const NAV_LINKS = {
  solutions: [
    { label: 'For sales managers', href: '/#for-managers' },
    { label: 'For reps', href: '/#for-reps' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Security', href: '/security' },
    { label: 'Changelog', href: '/changelog' },
  ],
} as const
