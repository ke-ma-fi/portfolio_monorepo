import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Guest Gift Card Flow', () => {
  let uuid: string;

  test.beforeAll(async () => {
    // Read seeded data
    try {
        const dataPath = path.resolve(process.cwd(), 'e2e-data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error('e2e-data.json not found. Run seed script first.');
        }
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        uuid = data.uuid;
        console.log(`Using Test Card UUID: ${uuid}`);
    } catch (e) {
        console.error('Failed to read E2E seed data:', e);
        throw e;
    }
  });

  test('should verify card details and print lock', async ({ page }) => {
    // 1. Visit the Manager View
    await page.goto(`/view/${uuid}`);

    // 2. Validate Content
    await expect(page.getByText('Test Bäckerei')).toBeVisible();
    await expect(page.locator('.text-5xl')).toContainText('10,00');
    await expect(page.getByText('Mein Gutschein')).toBeVisible();

    // 3. Test "Ausdrucken" Flow (Locking)
    await page.getByRole('button', { name: /ausdrucken/i }).click();
    
    // Expect Warning Dialog
    await expect(page.getByText(/Gutschein drucken?/i)).toBeVisible();
    
    // Confirm
    await page.getByRole('button', { name: /ausdrucken & sperren/i }).click();

    // 4. Verify Redirect to Print Page
    await expect(page).toHaveURL(new RegExp(`/print/`));
    
    // 5. Verify Back in Manager View (Refresh or Nav back - simulation)
    // Actually, let's visit the view page again to check status
    await page.goto(`/view/${uuid}`); 
    
    // Note: uuid is the Buyer UUID. It should now show "Ausgedruckt" or similar?
    // Wait, the action rotates credentials (recipientUuid). 
    // Does it rotate the buyer uuid? No, generateUUID hook only runs on create.
    // Let's check logic:
    // markAsPrintedAction rotates 'code' and 'recipientUuid'. 'uuid' (buyer) remains.
    
    await expect(page.getByText('Ausgedruckt', { exact: true })).toBeVisible();
  });
});
