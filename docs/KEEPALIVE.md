# Keep Services Active - Health Check System

## Overview

This system prevents Supabase and Upstash from pausing your project due to inactivity by automatically performing database and Redis operations every 5 days.

## Components

### 1. Health Check API Endpoint
**Location:** `/app/api/health/route.ts`

**What it does:**
- Performs a real database query (counts profiles)
- Performs Redis operations (set/get key-value)
- Returns status for both services
- No authentication required (safe, read-only operations)

**Response format:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-07T12:00:00.000Z",
  "totalResponseTime": 150,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 75,
      "activity": "profile_count_query_executed"
    },
    "redis": {
      "status": "healthy",
      "responseTime": 50,
      "activity": "set_and_get_executed"
    }
  },
  "message": "All services operational"
}
```

### 2. GitHub Actions Workflow
**Location:** `/.github/workflows/keepalive.yml`

**Schedule:**
- Runs every 5 days at 3:00 AM UTC
- Well before Supabase's 7-day inactivity threshold
- Also runs before Upstash's inactivity timeout

**Features:**
- Automatic execution (no manual intervention needed)
- Can be manually triggered for testing
- Reports success/failure status
- Uses GitHub's free tier (unlimited public repo actions)

## Testing

### Test the health endpoint locally:
```bash
# After starting your dev server (npm run dev)
curl http://localhost:3000/api/health | jq '.'
```

### Test in production:
```bash
curl https://meetmehalfway.live/api/health | jq '.'
```

### Manually trigger the GitHub Action:
1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
2. Click "Keep Services Active" workflow
3. Click "Run workflow" button
4. Click the green "Run workflow" button

## How It Works

1. **Every 5 days**, GitHub Actions automatically runs
2. The workflow pings `/api/health` endpoint
3. The endpoint:
   - Executes `SELECT count(*) FROM profiles` on Supabase
   - Executes `SET` and `GET` operations on Upstash Redis
4. This activity keeps both services active
5. If the check fails, the workflow logs an error

## Benefits

✅ **Prevents Supabase pausing** - Real DB queries every 5 days  
✅ **Prevents Upstash pausing** - Redis operations every 5 days  
✅ **Completely automated** - No manual intervention needed  
✅ **Free** - Uses GitHub's free Actions tier  
✅ **Monitoring built-in** - Check workflow status in GitHub Actions  
✅ **Safe operations** - Read-only DB queries, harmless Redis ops  

## Monitoring

Check the workflow status at:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/keepalive.yml
```

You'll see:
- ✅ Green checkmark = Health check succeeded
- ❌ Red X = Health check failed (needs investigation)
- Last run time
- Next scheduled run time

## Troubleshooting

**If workflow fails:**

1. Check the workflow logs in GitHub Actions
2. Manually test the health endpoint:
   ```bash
   curl https://meetmehalfway.live/api/health
   ```
3. Verify environment variables are set in Vercel:
   - `DATABASE_URL` (Supabase connection string)
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**If services still pause:**

1. Reduce the schedule from 5 days to 3 days:
   ```yaml
   - cron: '0 3 */3 * *'  # Every 3 days instead of 5
   ```

## Notes

- The health check is intentionally public (no auth) since it only performs safe operations
- Response times are logged to help identify performance issues
- The workflow uses curl to avoid external dependencies
- Status 200 (healthy) or 503 (degraded) are both acceptable

