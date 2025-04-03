async function testRateLimit() {
  const url = 'http://localhost:3000/api/test-rate-limit'
  
  console.log('Testing rate limiting...')
  console.log('Making 15 requests (should hit the rate limit of 10 requests per 10 seconds)')
  
  for (let i = 1; i <= 15; i++) {
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      console.log(`\nRequest ${i}:`)
      console.log('Status:', response.status)
      console.log('Rate Limit Info:', data.rateLimit)
      console.log('Headers:', {
        'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
        'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset'),
      })
    } catch (error) {
      console.error(`Request ${i} failed:`, error)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

testRateLimit().catch(console.error) 