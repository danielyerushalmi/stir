import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// /api/health is unauthenticated for uptime monitors; /api/webhooks/* are
// machine-to-machine and authenticate via signature verification instead.
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/privacy', '/terms', '/api/health', '/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) await auth.protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
