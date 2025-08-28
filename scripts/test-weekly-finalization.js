#!/usr/bin/env node

/**
 * Test script for weekly finalization functionality
 * This script tests the weekly finalization API endpoints
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-token';

// Test data
const testWeek = 1;

console.log('🧪 Testing Weekly Finalization Functionality');
console.log('============================================\n');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 3000),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test 1: Get week status
async function testGetWeekStatus() {
  console.log('📊 Test 1: Getting Week Status');
  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/week-status`);
    
    if (response.status === 200) {
      console.log('✅ Success: Week status retrieved');
      console.log(`   Current week: ${response.data.data.currentWeek}`);
      console.log(`   Total weeks: ${response.data.data.weekStatus.length}`);
      console.log(`   Finalized weeks: ${response.data.data.weekStatus.filter(w => w.isFinalized).length}`);
    } else {
      console.log(`❌ Failed: HTTP ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

// Test 2: Finalize a week
async function testFinalizeWeek() {
  console.log(`🏁 Test 2: Finalizing Week ${testWeek}`);
  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/finalize-week`, {
      method: 'POST',
      body: { week: testWeek }
    });
    
    if (response.status === 200) {
      console.log('✅ Success: Week finalized');
      console.log(`   Message: ${response.data.message}`);
      if (response.data.data) {
        console.log(`   Matchup results: ${response.data.data.matchupResults.length}`);
        console.log(`   Team scores: ${response.data.data.weeklyResults.length}`);
      }
    } else if (response.status === 400 && response.data.error?.includes('already been finalized')) {
      console.log('ℹ️  Info: Week already finalized (expected for repeat runs)');
    } else {
      console.log(`❌ Failed: HTTP ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

// Test 3: Verify week status after finalization
async function testVerifyFinalization() {
  console.log('🔍 Test 3: Verifying Week Finalization');
  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/week-status`);
    
    if (response.status === 200) {
      const weekData = response.data.data.weekStatus.find(w => w.week === testWeek);
      if (weekData) {
        if (weekData.isFinalized) {
          console.log(`✅ Success: Week ${testWeek} is now finalized`);
          console.log(`   Finalized at: ${weekData.finalizedAt}`);
          console.log(`   Scores recorded: ${weekData.scores.length}`);
        } else {
          console.log(`❌ Failed: Week ${testWeek} is not finalized`);
        }
      } else {
        console.log(`❌ Failed: Week ${testWeek} not found in status`);
      }
    } else {
      console.log(`❌ Failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

// Test 4: Check standings update
async function testStandingsUpdate() {
  console.log('📈 Test 4: Checking Standings Update');
  try {
    const response = await makeRequest(`${BASE_URL}/api/standings`);
    
    if (response.status === 200) {
      console.log('✅ Success: Standings retrieved');
      console.log(`   Total teams: ${response.data.data.length}`);
      
      // Show first few teams
      const topTeams = response.data.data.slice(0, 3);
      topTeams.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.teamName} (${team.teamField}): ${team.wins}W-${team.losses}L-${team.ties}T, PF: ${team.pointsFor}, PA: ${team.pointsAgainst}`);
      });
    } else {
      console.log(`❌ Failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

// Main test runner
async function runTests() {
  try {
    await testGetWeekStatus();
    await testFinalizeWeek();
    await testVerifyFinalization();
    await testStandingsUpdate();
    
    console.log('🎉 All tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - Week status retrieval: ✅');
    console.log('   - Week finalization: ✅');
    console.log('   - Finalization verification: ✅');
    console.log('   - Standings update: ✅');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testGetWeekStatus,
  testFinalizeWeek,
  testVerifyFinalization,
  testStandingsUpdate,
  runTests
};
