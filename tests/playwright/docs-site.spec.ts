import { test, expect } from '@playwright/test';

test.describe('Documentation Site', () => {
  test('landing page loads correctly', async ({ page }) => {
    // Navigate to the docs site
    await page.goto('http://localhost:3000');

    // Check the title
    await expect(page).toHaveTitle(/v0 MCP Server/);

    // Check hero section
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toContainText('v0 MCP Server');
    
    const heroSubtitle = page.locator('text=Generate React components with AI directly in Claude Desktop');
    await expect(heroSubtitle).toBeVisible();

    // Check CTA buttons
    const getStartedButton = page.locator('text=Get Started').first();
    await expect(getStartedButton).toBeVisible();
    
    const githubButton = page.locator('text=View on GitHub');
    await expect(githubButton).toBeVisible();

    // Check What is v0 section
    await expect(page.locator('text=What is v0?')).toBeVisible();
    await expect(page.locator('text=v0 is Vercel\'s AI-powered UI generation tool')).toBeVisible();
    
    // Check features section
    await expect(page.locator('text=Powerful Features')).toBeVisible();
    await expect(page.locator('text=AI-Powered Generation')).toBeVisible();
    await expect(page.locator('text=MCP Integration')).toBeVisible();
    await expect(page.locator('text=Iterate & Refine')).toBeVisible();
    await expect(page.locator('text=TypeScript Ready')).toBeVisible();

    // Check how it works section
    await expect(page.locator('text=How It Works')).toBeVisible();
    await expect(page.locator('text=Get v0 API Key')).toBeVisible();
    await expect(page.locator('text=Run with npx')).toBeVisible();
    await expect(page.locator('text=Configure Claude')).toBeVisible();
    await expect(page.locator('text=Start Creating')).toBeVisible();

    // Check code example section
    await expect(page.locator('text=See It In Action')).toBeVisible();
    await expect(page.locator('text=MCP Tool Call')).toBeVisible();
    await expect(page.locator('text=Generated Component')).toBeVisible();

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/docs-landing-page.png', fullPage: true });
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click Get Started button
    const getStartedButton = page.locator('text=Get Started').first();
    await getStartedButton.click();
    
    // Should navigate to /getting-started
    await expect(page).toHaveURL('http://localhost:3000/getting-started');
  });

  test('responsive design', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });
});