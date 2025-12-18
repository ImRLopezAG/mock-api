import { cors } from '@elysiajs/cors'

/**
 * CORS middleware configuration
 * Configured to accept all origins with permissive settings
 */
export const corsMiddleware = cors({
	origin: true, // Accept all origins
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
})
