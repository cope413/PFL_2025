#!/usr/bin/env node

/**
 * Test script for BCC functionality in lineup submission emails
 * This script tests that taylor@landryfam.com receives BCC copies of lineup submission emails
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import the email service
const { NotificationService } = require('../lib/email.js');

async function testBCCEmail() {
  console.log('🧪 Testing BCC functionality for lineup submission emails');
  console.log('======================================================');
  
  // Check if email configuration is available
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Email configuration missing. Please set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }
  
  console.log('📧 Email configuration found');
  console.log(`   SMTP User: ${process.env.SMTP_USER}`);
  console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`   SMTP Port: ${process.env.SMTP_PORT || '587'}`);
  
  // Test data
  const testData = {
    email: 'test@example.com', // This won't actually send since it's a test email
    username: 'Test User',
    teamName: 'Test Team',
    week: 1,
    lineup: {
      QB: 'Test QB',
      RB_1: 'Test RB',
      WR_1: 'Test WR',
      FLEX_1: 'Test FLEX',
      FLEX_2: 'Test FLEX2',
      TE: 'Test TE',
      K: 'Test K',
      DEF: 'Test DEF'
    },
    submissionTime: new Date().toISOString()
  };
  
  console.log('\n📋 Test Data:');
  console.log(`   Email: ${testData.email}`);
  console.log(`   Username: ${testData.username}`);
  console.log(`   Team: ${testData.teamName}`);
  console.log(`   Week: ${testData.week}`);
  console.log(`   BCC Recipient: taylor@landryfam.com`);
  
  console.log('\n⚠️  Note: This is a test run. The email will be sent to the test address.');
  console.log('   In a real scenario, taylor@landryfam.com would receive a BCC copy.');
  
  try {
    console.log('\n📤 Sending test lineup submission email...');
    
    // This will attempt to send the email with BCC
    const success = await NotificationService.sendLineupSubmission(
      testData.email,
      testData.username,
      testData.teamName,
      testData.week,
      testData.lineup,
      testData.submissionTime
    );
    
    if (success) {
      console.log('✅ Test email sent successfully!');
      console.log('   - Primary recipient: test@example.com');
      console.log('   - BCC recipient: taylor@landryfam.com');
      console.log('\n📧 Check taylor@landryfam.com inbox for the BCC copy');
    } else {
      console.log('❌ Test email failed to send');
    }
    
  } catch (error) {
    console.error('💥 Error during test:', error);
  }
  
  console.log('\n🎉 BCC test completed!');
}

// Run the test
testBCCEmail().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
