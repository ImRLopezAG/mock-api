// Import Elysia and cors plugin
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

// Initialize Elysia app
const app = new Elysia()
  .use(
    cors({
      origin: '*', // Allow all origins
    })
  )
  .get('/', () => 'Hello World!') // Example route
  .listen(3000);

console.log(`🦊 Elysia is running at http://localhost:3000`);