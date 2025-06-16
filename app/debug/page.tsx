"use client"

import { useState, useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlan } from "@/hooks/usePlan"
import { getLocationsAction } from "@/actions/db/locations-actions"
import { getSearchesAction } from "@/actions/db/searches-actions"
import { getUserPlanInfoAction } from "@/app/actions/user-actions"

export default function DebugPage() {
  const { isLoaded, userId, isSignedIn } = useAuth()
  const { user } = useUser()
  const { tier, planInfo, isLoading: isPlanLoading, error: planError } = usePlan()
  
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    const results: Record<string, any> = {}

    try {
      // Test 1: Basic environment info
      results.environment = {
        nodeEnv: process.env.NODE_ENV,
        hasDatabase: !!process.env.NEXT_PUBLIC_DATABASE_URL || !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      }

      // Test 2: Authentication
      results.auth = {
        isLoaded,
        isSignedIn,
        hasUserId: !!userId,
        userIdLength: userId?.length || 0,
        hasUser: !!user,
        userEmail: user?.emailAddresses?.[0]?.emailAddress || 'none'
      }

      // Test 3: Plan info
      results.plan = {
        tier,
        planInfo,
        isPlanLoading,
        planError: planError?.message || null
      }

      // Test 4: Direct server action tests
      if (userId) {
        try {
          results.planAction = await getUserPlanInfoAction()
        } catch (error) {
          results.planAction = { error: error instanceof Error ? error.message : String(error) }
        }

        try {
          const locationsResult = await getLocationsAction(userId)
          results.locations = {
            success: locationsResult.isSuccess,
            message: locationsResult.message,
            count: locationsResult.data?.length || 0,
            data: locationsResult.data?.slice(0, 2) || [] // First 2 items only
          }
        } catch (error) {
          results.locations = { error: error instanceof Error ? error.message : String(error) }
        }

        try {
          const searchesResult = await getSearchesAction(userId)
          results.searches = {
            success: searchesResult.isSuccess,
            message: searchesResult.message,
            count: searchesResult.data?.length || 0,
            data: searchesResult.data?.slice(0, 2) || [] // First 2 items only
          }
        } catch (error) {
          results.searches = { error: error instanceof Error ? error.message : String(error) }
        }
      } else {
        results.serverActions = 'Skipped - no user ID'
      }

    } catch (globalError) {
      results.globalError = globalError instanceof Error ? globalError.message : String(globalError)
    }

    setTestResults(results)
    setIsRunning(false)
  }

  useEffect(() => {
    // Auto-run tests when component mounts and user is loaded
    if (isLoaded && !isRunning) {
      runTests()
    }
  }, [isLoaded])

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Production Debug Dashboard</h1>
      
      <div className="mb-6">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Tests...' : 'Run Diagnostic Tests'}
        </Button>
      </div>

      <div className="grid gap-6">
        {Object.entries(testResults).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="capitalize">{key} Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(testResults).length === 0 && !isRunning && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Click "Run Diagnostic Tests" to check what's working and what's not.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 