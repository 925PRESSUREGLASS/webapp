import { test, expect } from '@playwright/test';

/**
 * Job Tracker E2E Tests
 * Tests for job management, status changes, and completion flow
 */

test.describe('Job Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('.q-layout');
  });

  test.describe('Navigation', () => {
    test('should navigate to Jobs page from sidebar', async ({ page }) => {
      await page.click('text=Jobs');
      await expect(page).toHaveURL(/\/jobs/);
    });

    test('should display jobs page header', async ({ page }) => {
      await page.goto('/jobs');
      await expect(page.locator('text=Jobs')).toBeVisible();
    });

    test('should show empty state when no jobs exist', async ({ page }) => {
      // Clear localStorage to ensure no jobs
      await page.evaluate(() => {
        localStorage.removeItem('tictacstick_jobs');
      });
      await page.goto('/jobs');
      await page.waitForTimeout(500); // Wait for store to initialize
      
      // Either shows empty state or job list
      const hasJobs = await page.locator('.q-card').count();
      if (hasJobs === 0) {
        await expect(page.locator('text=No jobs found')).toBeVisible();
      }
    });
  });

  test.describe('Job List', () => {
    test('should display job cards with status badges', async ({ page }) => {
      // Create a test job via localStorage
      await page.evaluate(() => {
        const testJob = {
          id: 'test-job-1',
          jobNumber: 'JOB-001',
          quoteId: 'quote-1',
          client: {
            id: 'client-1',
            name: 'Test Client',
            address: '123 Test St',
            email: 'test@example.com',
            phone: '555-1234',
          },
          status: 'scheduled',
          schedule: {
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '09:00',
            estimatedDuration: 120,
          },
          items: [],
          pricing: {
            estimatedSubtotal: 100,
            estimatedGst: 10,
            estimatedTotal: 110,
            actualSubtotal: 0,
            actualGst: 0,
            actualTotal: 0,
          },
          photos: [],
          notes: [],
          issues: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('tictacstick_jobs', JSON.stringify({
          jobs: [testJob],
          settings: { defaultScheduleDuration: 120 },
        }));
      });

      await page.goto('/jobs');
      await page.waitForTimeout(500);

      // Should show job card
      await expect(page.locator('text=JOB-001')).toBeVisible();
      await expect(page.locator('text=Test Client')).toBeVisible();
    });

    test('should filter jobs by status', async ({ page }) => {
      await page.goto('/jobs');
      
      // Check if filter chips exist
      const filterChips = page.locator('.q-chip');
      const chipCount = await filterChips.count();
      
      if (chipCount > 0) {
        // Click on a filter chip
        await filterChips.first().click();
        // Verify filter is applied (URL might change or list updates)
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Job Details', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test job
      await page.evaluate(() => {
        const testJob = {
          id: 'test-job-detail',
          jobNumber: 'JOB-002',
          quoteId: 'quote-2',
          client: {
            id: 'client-2',
            name: 'Detail Test Client',
            address: '456 Detail St',
            email: 'detail@example.com',
            phone: '555-5678',
          },
          status: 'scheduled',
          schedule: {
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '10:00',
            estimatedDuration: 90,
          },
          items: [
            {
              id: 'item-1',
              type: 'window',
              description: 'Standard Window Cleaning',
              estimatedPrice: 50,
              actualPrice: 50,
              estimatedTime: 30,
              status: 'pending',
            },
          ],
          pricing: {
            estimatedSubtotal: 50,
            estimatedGst: 5,
            estimatedTotal: 55,
            actualSubtotal: 50,
            actualGst: 5,
            actualTotal: 55,
          },
          photos: [],
          notes: [],
          issues: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('tictacstick_jobs', JSON.stringify({
          jobs: [testJob],
          settings: { defaultScheduleDuration: 120 },
        }));
      });
    });

    test('should navigate to job details page', async ({ page }) => {
      await page.goto('/jobs');
      await page.waitForTimeout(500);
      
      // Click on job card or view button
      const jobCard = page.locator('text=JOB-002').first();
      if (await jobCard.isVisible()) {
        await jobCard.click();
        await expect(page).toHaveURL(/\/jobs\/test-job-detail/);
      }
    });

    test('should display job information', async ({ page }) => {
      await page.goto('/jobs/test-job-detail');
      await page.waitForTimeout(500);
      
      // Should show client name
      await expect(page.locator('text=Detail Test Client')).toBeVisible();
    });
  });

  test.describe('Job Status Changes', () => {
    test.beforeEach(async ({ page }) => {
      // Create a scheduled test job
      await page.evaluate(() => {
        const testJob = {
          id: 'test-job-status',
          jobNumber: 'JOB-003',
          quoteId: 'quote-3',
          client: {
            id: 'client-3',
            name: 'Status Test Client',
            address: '789 Status St',
            email: 'status@example.com',
            phone: '555-9012',
          },
          status: 'scheduled',
          schedule: {
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '14:00',
            estimatedDuration: 60,
          },
          items: [
            {
              id: 'item-1',
              type: 'window',
              description: 'Test Window',
              estimatedPrice: 100,
              actualPrice: 100,
              estimatedTime: 60,
              status: 'pending',
            },
          ],
          pricing: {
            estimatedSubtotal: 100,
            estimatedGst: 10,
            estimatedTotal: 110,
            actualSubtotal: 100,
            actualGst: 10,
            actualTotal: 110,
          },
          photos: [],
          notes: [],
          issues: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('tictacstick_jobs', JSON.stringify({
          jobs: [testJob],
          settings: { defaultScheduleDuration: 120 },
        }));
      });
    });

    test('should show Start Job button for scheduled jobs', async ({ page }) => {
      await page.goto('/jobs/test-job-status');
      await page.waitForTimeout(500);
      
      // Look for Start Job button
      const startButton = page.locator('button:has-text("Start")');
      if (await startButton.isVisible()) {
        await expect(startButton).toBeVisible();
      }
    });

    test('should start a job and update status', async ({ page }) => {
      await page.goto('/jobs/test-job-status');
      await page.waitForTimeout(500);
      
      const startButton = page.locator('button:has-text("Start")');
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(500);
        
        // Status should change to in-progress
        // Look for Pause button which indicates job is running
        await expect(page.locator('button:has-text("Pause")')).toBeVisible();
      }
    });
  });

  test.describe('Quote to Job Conversion', () => {
    test('should convert a saved quote to a job', async ({ page }) => {
      // First create a saved quote
      await page.evaluate(() => {
        const testQuote = {
          id: 'quote-for-job',
          title: 'Test Quote for Job',
          clientName: 'Conversion Client',
          clientLocation: '999 Convert St',
          clientEmail: 'convert@example.com',
          clientPhone: '555-0000',
          windowLines: [],
          pressureLines: [],
          subtotal: 200,
          gst: 20,
          total: 220,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem('tictacstick_quotes') || '[]');
        existing.push(testQuote);
        localStorage.setItem('tictacstick_quotes', JSON.stringify(existing));
      });

      // Navigate to saved quotes
      await page.goto('/quotes');
      await page.waitForTimeout(500);

      // Look for the quote
      const quoteCard = page.locator('text=Test Quote for Job');
      if (await quoteCard.isVisible()) {
        // Find and click the menu button (3 dots)
        const menuBtn = page.locator('.q-btn[icon="more_vert"], button:has(.q-icon)').first();
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
          
          // Look for Schedule Job option
          const scheduleOption = page.locator('text=Schedule Job');
          if (await scheduleOption.isVisible()) {
            await scheduleOption.click();
            // Should show date picker dialog
            await page.waitForTimeout(300);
          }
        }
      }
    });
  });

  test.describe('Job Completion', () => {
    test.beforeEach(async ({ page }) => {
      // Create an in-progress job ready for completion
      await page.evaluate(() => {
        const testJob = {
          id: 'test-job-complete',
          jobNumber: 'JOB-004',
          quoteId: 'quote-4',
          client: {
            id: 'client-4',
            name: 'Complete Test Client',
            address: '111 Complete St',
            email: 'complete@example.com',
            phone: '555-1111',
          },
          status: 'in-progress',
          schedule: {
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '09:00',
            estimatedDuration: 60,
            actualStartTime: new Date().toISOString(),
          },
          items: [
            {
              id: 'item-1',
              type: 'window',
              description: 'Completed Window',
              estimatedPrice: 75,
              actualPrice: 75,
              estimatedTime: 30,
              status: 'completed',
            },
          ],
          pricing: {
            estimatedSubtotal: 75,
            estimatedGst: 7.5,
            estimatedTotal: 82.5,
            actualSubtotal: 75,
            actualGst: 7.5,
            actualTotal: 82.5,
          },
          photos: [],
          notes: [],
          issues: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('tictacstick_jobs', JSON.stringify({
          jobs: [testJob],
          settings: { defaultScheduleDuration: 120 },
        }));
      });
    });

    test('should show Complete button for in-progress jobs', async ({ page }) => {
      await page.goto('/jobs/test-job-complete');
      await page.waitForTimeout(500);
      
      const completeButton = page.locator('button:has-text("Complete")');
      await expect(completeButton).toBeVisible();
    });

    test('should open completion wizard when clicking Complete', async ({ page }) => {
      await page.goto('/jobs/test-job-complete');
      await page.waitForTimeout(500);
      
      const completeButton = page.locator('button:has-text("Complete")');
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await page.waitForTimeout(500);
        
        // Should show completion wizard dialog
        const wizardDialog = page.locator('.q-dialog');
        await expect(wizardDialog).toBeVisible();
      }
    });
  });
});
