import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/editor(.*)'])

const appDirectives = {
  'style-src': ['https://fonts.googleapis.com'],
  'font-src': ['self', 'https://fonts.gstatic.com'],
  'img-src': ['data:', 'blob:'],
  'object-src': ['none'],
  'base-uri': ['self'],
  'frame-ancestors': ['none'],
}

// Vercel Toolbar / Comments, exactly as listed in Vercel's docs:
// https://vercel.com/docs/vercel-toolbar/managing-toolbar#using-a-content-security-policy
// Applied in every environment, since the toolbar can be enabled in production
// (team/project settings or the browser extension).
const vercelToolbarDirectives = {
  'script-src': ['https://vercel.live'],
  'connect-src': ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  'img-src': ['https://vercel.live', 'https://vercel.com', 'data:', 'blob:'],
  'frame-src': ['https://vercel.live'],
  'style-src': ['https://vercel.live', 'unsafe-inline'],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com'],
}

function mergeDirectives(...sets: Record<string, string[]>[]) {
  const merged: Record<string, string[]> = {}
  for (const set of sets) {
    for (const [key, values] of Object.entries(set)) {
      merged[key] = [...(merged[key] ?? []), ...values]
    }
  }
  return merged
}

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect()
  },
  {
    // Clerk generates the CSP with the directives its auth flows need;
    // these are merged on top for the app's own resources.
    contentSecurityPolicy: {
      // Report-only: violations are logged in the browser console but nothing
      // is blocked. Set to false to enforce once no violations show up.
      reportOnly: true,
      directives: mergeDirectives(appDirectives, vercelToolbarDirectives),
    },
  }
)

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
