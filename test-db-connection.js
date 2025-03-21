import postgres from 'postgres'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
config({ path: join(__dirname, '.env.local') })

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined in environment variables')
  process.exit(1)
}

async function testConnection() {
  const sql = postgres(DATABASE_URL, {
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    const result = await sql`SELECT version()`
    console.log('Successfully connected to database!')
    console.log('Database version:', result[0].version)
  } catch (error) {
    console.error('Error connecting to database:', error)
  } finally {
    await sql.end()
  }
}

testConnection() 