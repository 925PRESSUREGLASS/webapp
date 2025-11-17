/**
 * Test Helpers - Reusable functions to reduce flakiness
 */

/**
 * Wait for APP to be fully initialized
 * This ensures bootstrap and all modules are loaded
 */
async function waitForAppInit(page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      return window.APP &&
             window.APP.isInitialized &&
             window.APP._bootstrapInitialized;
    },
    { timeout }
  );
}

/**
 * Wait for element and click it safely
 * Waits for element to be visible and clickable before clicking
 */
async function clickWhenReady(page, selector, options = {}) {
  const timeout = options.timeout || 5000;
  const locator = page.locator(selector);

  await locator.waitFor({ state: 'visible', timeout });
  await locator.click();
}

/**
 * Wait for modal to be active
 * Waits for both the element to exist and have 'active' class
 */
async function waitForModalActive(page, modalId, timeout = 5000) {
  await page.waitForSelector(`#${modalId}.active`, {
    state: 'visible',
    timeout
  });
  // Extra wait for CSS animation to complete
  await page.waitForTimeout(300);
}

/**
 * Close modal safely via JavaScript
 * Avoids click interception issues
 */
async function closeModal(page, modalId) {
  await page.evaluate((id) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }, modalId);
  await page.waitForTimeout(500);
}

module.exports = {
  waitForAppInit,
  clickWhenReady,
  waitForModalActive,
  closeModal
};
