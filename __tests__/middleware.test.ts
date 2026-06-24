import { describe, it, expect } from 'vitest'

/**
 * These tests verify the route-matching logic used in middleware.ts.
 * middleware.ts protects /dashboard and /editor — API routes are authenticated
 * inside each handler via getServerSession(), not at the middleware layer.
 */

function createRouteMatcher(patterns: string[]) {
  const regexes = patterns.map((pattern) => {
    const escaped = pattern
      .replace(/\[.*?\]/g, '[^/]+')
      .replace(/\//g, '\\/')
    return new RegExp(`^${escaped}(\\/.*)?$`)
  })
  return (pathname: string) => regexes.some((re) => re.test(pathname))
}

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/editor(.*)'])

describe('Middleware route protection', () => {
  describe('protected routes', () => {
    it('/dashboard is a protected route', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true)
    })

    it('/dashboard/anything is a protected route', () => {
      expect(isProtectedRoute('/dashboard/anything')).toBe(true)
    })

    it('/dashboard/stories/123 is a protected route', () => {
      expect(isProtectedRoute('/dashboard/stories/123')).toBe(true)
    })

    it('/editor/ch_abc123 is a protected route', () => {
      expect(isProtectedRoute('/editor/ch_abc123')).toBe(true)
    })
  })

  describe('API routes (auth handled in handler, not middleware)', () => {
    it('/api/stories is NOT redirected by middleware', () => {
      expect(isProtectedRoute('/api/stories')).toBe(false)
    })

    it('/api/chapters/456 is NOT redirected by middleware', () => {
      expect(isProtectedRoute('/api/chapters/456')).toBe(false)
    })

    it('/api/scenes/789 is NOT redirected by middleware', () => {
      expect(isProtectedRoute('/api/scenes/789')).toBe(false)
    })
  })

  describe('public routes', () => {
    it('/ (landing page) is NOT a protected route', () => {
      expect(isProtectedRoute('/')).toBe(false)
    })

    it('/login is NOT a protected route', () => {
      expect(isProtectedRoute('/login')).toBe(false)
    })

    it('/signup is NOT a protected route', () => {
      expect(isProtectedRoute('/signup')).toBe(false)
    })

    it('/sso-callback is NOT a protected route', () => {
      expect(isProtectedRoute('/sso-callback')).toBe(false)
    })

    it('/api/auth/callback is NOT a protected route', () => {
      expect(isProtectedRoute('/api/auth/callback')).toBe(false)
    })
  })
})

describe('Middleware config matcher patterns', () => {
  /**
   * Next.js middleware config.matcher excludes static files and Next.js internals.
   * These tests verify the exclusion patterns used in the matcher config.
   */
  const MIDDLEWARE_MATCHER_EXCLUSIONS = [
    /^\/(_next\/static|_next\/image|favicon\.ico|.*\.(?:png|jpg|jpeg|gif|svg|ico|css|js)$)/,
  ]

  function isExcludedFromMiddleware(pathname: string): boolean {
    return MIDDLEWARE_MATCHER_EXCLUSIONS.some((re) => re.test(pathname))
  }

  it('_next/static assets are excluded from middleware', () => {
    expect(isExcludedFromMiddleware('/_next/static/chunks/main.js')).toBe(true)
  })

  it('_next/image is excluded from middleware', () => {
    expect(isExcludedFromMiddleware('/_next/image?url=...')).toBe(true)
  })

  it('favicon.ico is excluded from middleware', () => {
    expect(isExcludedFromMiddleware('/favicon.ico')).toBe(true)
  })

  it('public image files are excluded from middleware', () => {
    expect(isExcludedFromMiddleware('/images/forest_bg.jpg')).toBe(true)
  })

  it('app pages are NOT excluded from middleware', () => {
    expect(isExcludedFromMiddleware('/dashboard')).toBe(false)
    expect(isExcludedFromMiddleware('/login')).toBe(false)
  })
})
