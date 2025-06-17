/*
<ai_context>
Initializes the database connection and schema for the app.
Database uses IPv4-compatible pooler for Vercel serverless compatibility.
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

config({ path: ".env.local" })

const schema = {
  profiles: profilesTable,
  todos: todosTable,
  locations: locationsTable,
  searches: searchesTable,
  pois: poisTable
}

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })
