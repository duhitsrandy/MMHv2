// Simple rate limiter for API requests
const queue: (() => Promise<void>)[] = []
let processing = false
const DELAY = 1000 // 1 second delay between requests

async function processQueue() {
  if (processing || queue.length === 0) return
  
  processing = true
  while (queue.length > 0) {
    const request = queue.shift()
    if (request) {
      await request()
      await new Promise(resolve => setTimeout(resolve, DELAY))
    }
  }
  processing = false
}

export async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = async () => {
      try {
        const response = await fetch(url, options)
        resolve(response)
      } catch (error) {
        reject(error)
      }
    }
    
    queue.push(request)
    processQueue().catch(error => reject(error))
  })
} 