/*
<ai_context>
Initializes the database connection and schema for the app.
</ai_context>
*/

import {
  locationsTable,
  poisTable,
  profilesTable,
  searchesTable,
  todosTable
} from "@/db/schema"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Only load .env.local in development
if (process.env.NODE_ENV === 'development') {
  config({ path: ".env.local" })
}

const schema = {
  profiles: profilesTable,
  todos: todosTable,
  locations: locationsTable,
  searches: searchesTable,
  pois: poisTable
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Log database connection info (without sensitive details)
console.log('[DB] Initializing database connection...', {
  environment: process.env.NODE_ENV,
  hasUrl: !!process.env.DATABASE_URL,
  urlLength: process.env.DATABASE_URL?.length || 0,
  urlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
})

// Configure postgres client with better production settings
const client = postgres(process.env.DATABASE_URL!, {
  // Production optimizations
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
  
  // Logging for debugging (only in development)
  debug: process.env.NODE_ENV === 'development',
  
  // Transform undefined to null for better database compatibility
  transform: {
    undefined: null
  },
  
  // Connection error handling
  onnotice: (notice) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB Notice]', notice)
    }
  }
})

export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development' 
})

// Test connection on startup
if (process.env.NODE_ENV === 'development') {
  client`SELECT 1 as test`
    .then(() => console.log('[DB] Connection test successful'))
    .catch((err) => console.error('[DB] Connection test failed:', err))
}
