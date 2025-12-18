import { cors } from '@elysiajs/cors'

/**
 * CORS middleware configuration
 * Configured to accept all origins with permissive settings
 * 
 * NOTE: This configuration intentionally allows all origins (origin: true)
 * with credentials enabled. This is appropriate for a mock data API that
 * needs to be accessible from any client application. For production APIs
 * handling sensitive data, consider restricting origins to specific domains.
 */
export const corsMiddleware = cors({
	origin: true, // Accept all origins - intentional per requirements
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
})
