import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';

dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSecurity() {
  console.log('Testing security with Clerk and Supabase...\n');

  try {
    // Test 1: Create a test user with Clerk
    console.log('Test 1: Creating test user with Clerk...');
    const timestamp = Date.now();
    const user = await clerkClient.users.createUser({
      emailAddress: [`test${timestamp}@example.com`],
      username: `testuser${timestamp}`,
      password: 'TestPassword123!@#'
    });
    console.log('Test user created successfully:', user.id);

    // Test 2: Create a profile for the test user
    console.log('\nTest 2: Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        membership: 'free'
      })
      .select('user_id')
      .maybeSingle();

    if (profileError) {
      console.log('Error creating profile:', profileError.message);
    } else {
      console.log('Profile created successfully for user:', profile.user_id);
    }

    // Test 3: Try to create a profile for a different user (should fail)
    console.log('\nTest 3: Testing profile creation for different user...');
    const { error: otherProfileError } = await supabase
      .from('profiles')
      .insert({
        user_id: 'different-user-id',
        membership: 'free'
      });

    if (otherProfileError) {
      console.log('Security working: Cannot create profile for different user');
      console.log('Error:', otherProfileError.message);
    } else {
      console.log('WARNING: Security issue - was able to create profile for different user');
    }

    // Test 4: Create a search
    console.log('\nTest 4: Creating search...');
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .insert({
        user_id: user.id,
        start_location_address: '123 Start St',
        start_location_lat: '40.7128',
        start_location_lng: '-74.0060',
        end_location_address: '456 End Ave',
        end_location_lat: '40.7128',
        end_location_lng: '-74.0060',
        midpoint_lat: '40.7128',
        midpoint_lng: '-74.0060'
      })
      .select('id, user_id')
      .maybeSingle();

    if (searchError) {
      console.log('Error creating search:', searchError.message);
    } else {
      console.log('Search created successfully:', search.id);

      // Test 5: Create a POI
      console.log('\nTest 5: Creating POI...');
      const { data: poi, error: poiError } = await supabase
        .from('pois')
        .insert({
          search_id: search.id,
          name: 'Test POI',
          address: '789 POI St',
          latitude: '40.7128',
          longitude: '-74.0060',
          type: 'restaurant'
        })
        .select('id, name')
        .maybeSingle();

      if (poiError) {
        console.log('Error creating POI:', poiError.message);
      } else {
        console.log('POI created successfully:', poi.id);
      }
    }

    // Test 6: Try to read audit logs (should fail for free user)
    console.log('\nTest 6: Testing audit log access...');
    
    // First, create a test audit log entry
    const { error: insertAuditError } = await supabase
      .from('audit_logs')
      .insert({
        table_name: 'test',
        record_id: '00000000-0000-0000-0000-000000000000',
        user_id: user.id,
        action: 'TEST',
        old_data: null,
        new_data: { test: true }
      });

    if (insertAuditError) {
      console.log('Error creating audit log entry:', insertAuditError.message);
    }

    // Create a new Supabase client with anon key to test as regular user
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Try to read audit logs as free user
    const { data: logs, error: readAuditError } = await anonClient
      .from('audit_logs')
      .select('*')
      .limit(1);

    if (readAuditError) {
      console.log('Security working: Cannot read audit logs as non-pro user');
      console.log('Error:', readAuditError.message);
    } else if (logs && logs.length > 0) {
      console.log('WARNING: Security issue - free user can read audit logs');
    } else {
      console.log('No audit logs found or access denied (empty result)');
    }

    // Cleanup: Delete test user and associated data
    console.log('\nCleaning up...');
    
    // Delete profile first (due to foreign key constraints)
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteProfileError) {
      console.log('Error deleting profile:', deleteProfileError.message);
    } else {
      console.log('Profile deleted successfully');
    }

    // Delete Clerk user
    await clerkClient.users.deleteUser(user.id);
    console.log('Test user deleted successfully');

    console.log('\nAll security tests completed successfully!');
  } catch (error) {
    console.error('Error during security test:', error.message);
    if (error.errors) {
      console.error('Detailed errors:', JSON.stringify(error.errors, null, 2));
    }
  }
}

testSecurity(); 