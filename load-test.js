#!/usr/bin/env node

/**
 * Load Testing Script for Cognitive Assessment Platform
 *
 * This script simulates multiple concurrent users completing the assessment
 * to test performance under load.
 */

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:5173', // Vite dev server
  concurrentUsers: 5, // Number of simultaneous users
  usersPerBatch: 2, // Users to start per batch
  batchDelay: 1000, // Delay between batches (ms)
  gameTimeout: 30000, // Timeout per game (ms)
  totalTimeout: 300000, // Total test timeout (5 minutes)
};

class LoadTester {
  constructor() {
    this.results = {
      totalUsers: 0,
      completedUsers: 0,
      failedUsers: 0,
      averageCompletionTime: 0,
      errors: [],
      startTime: Date.now(),
    };
  }

  async runLoadTest() {
    console.log(`🚀 Starting load test with ${CONFIG.concurrentUsers} concurrent users`);
    console.log(`📊 Target: ${CONFIG.baseUrl}`);

    const browser = await chromium.launch();
    const userPromises = [];

    // Start users in batches to avoid overwhelming the system
    for (let i = 0; i < CONFIG.concurrentUsers; i += CONFIG.usersPerBatch) {
      const batchSize = Math.min(CONFIG.usersPerBatch, CONFIG.concurrentUsers - i);
      console.log(`📦 Starting batch ${Math.floor(i / CONFIG.usersPerBatch) + 1} with ${batchSize} users`);

      for (let j = 0; j < batchSize; j++) {
        const userId = i + j + 1;
        userPromises.push(this.simulateUser(browser, userId));
      }

      if (i + CONFIG.usersPerBatch < CONFIG.concurrentUsers) {
        await this.delay(CONFIG.batchDelay);
      }
    }

    // Wait for all users to complete (with timeout)
    const timeoutPromise = this.delay(CONFIG.totalTimeout).then(() => {
      throw new Error(`Load test timed out after ${CONFIG.totalTimeout}ms`);
    });

    try {
      await Promise.race([
        Promise.all(userPromises),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('❌ Load test failed:', error.message);
      this.results.errors.push(error.message);
    }

    await browser.close();

    this.printResults();
  }

  async simulateUser(browser, userId) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const userStartTime = Date.now();

    try {
      console.log(`👤 User ${userId}: Starting assessment`);

      // Navigate to the application
      await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });
      console.log(`👤 User ${userId}: Page loaded`);

      // Wait for intro page to load
      await page.waitForSelector('h1:has-text("Cognitive Assessment")', { timeout: 10000 });

      // Click "Begin Assessment"
      await page.click('button:has-text("Begin Assessment")');
      console.log(`👤 User ${userId}: Started assessment`);

      // Complete games (simplified - just wait for each game page)
      const games = [1, 2, 3, 4, 5, 6, 7]; // Test first 7 games
      for (const gameId of games) {
        try {
          // Wait for game to load
          await page.waitForURL(`**/game/${gameId}`, { timeout: CONFIG.gameTimeout });

          // Simulate playing the game (wait a random time between 5-15 seconds)
          const gameTime = 5000 + Math.random() * 10000;
          await this.delay(gameTime);

          // Try to complete the game (click next or finish)
          const nextButton = page.locator('button:has-text("Next")').or(
            page.locator('button:has-text("Continue")').or(
              page.locator('button:has-text("Finish")')
            )
          );

          if (await nextButton.isVisible({ timeout: 2000 })) {
            await nextButton.click();
          }

          console.log(`👤 User ${userId}: Completed game ${gameId}`);
        } catch (error) {
          console.warn(`⚠️ User ${userId}: Issue with game ${gameId}:`, error.message);
        }
      }

      // Wait for report generation
      await page.waitForURL('**/report', { timeout: 30000 });
      console.log(`👤 User ${userId}: Report generated`);

      // Wait for report to fully load
      await page.waitForSelector('h1:has-text("Candidate Evaluation Matrix")', { timeout: 10000 });

      const completionTime = Date.now() - userStartTime;
      console.log(`✅ User ${userId}: Assessment completed in ${completionTime}ms`);

      this.results.completedUsers++;
      this.results.averageCompletionTime =
        (this.results.averageCompletionTime * (this.results.completedUsers - 1) + completionTime) / this.results.completedUsers;

    } catch (error) {
      console.error(`❌ User ${userId}: Failed - ${error.message}`);
      this.results.failedUsers++;
      this.results.errors.push(`User ${userId}: ${error.message}`);
    } finally {
      await context.close();
      this.results.totalUsers++;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    const duration = Date.now() - this.results.startTime;

    console.log('\n📊 Load Test Results');
    console.log('='.repeat(50));
    console.log(`Total Users: ${this.results.totalUsers}`);
    console.log(`Completed: ${this.results.completedUsers}`);
    console.log(`Failed: ${this.results.failedUsers}`);
    console.log(`Success Rate: ${((this.results.completedUsers / this.results.totalUsers) * 100).toFixed(1)}%`);
    console.log(`Average Completion Time: ${this.results.averageCompletionTime.toFixed(0)}ms`);
    console.log(`Total Test Duration: ${duration}ms`);
    console.log(`Requests per Second: ${(this.results.totalUsers / (duration / 1000)).toFixed(2)}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // Performance assessment
    console.log('\n🎯 Performance Assessment:');
    if (this.results.completedUsers === this.results.totalUsers) {
      console.log('✅ All users completed successfully');
    } else {
      console.log('⚠️ Some users failed - check server capacity');
    }

    if (this.results.averageCompletionTime < 120000) { // 2 minutes
      console.log('✅ Average completion time is acceptable');
    } else {
      console.log('⚠️ Average completion time is high - consider optimization');
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(CONFIG.baseUrl);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the development server first:');
    console.error('   npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking server status...');

  if (!(await checkServer())) {
    process.exit(1);
  }

  const tester = new LoadTester();
  await tester.runLoadTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LoadTester };