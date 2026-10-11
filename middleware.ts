import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/editor(.*)'])

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
      directives: {
        'style-src': ['https://fonts.googleapis.com'],
        'font-src': ['self', 'https://fonts.gstatic.com'],
        'img-src': ['data:', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'frame-ancestors': ['none'],
      },
    },
  }
)

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
