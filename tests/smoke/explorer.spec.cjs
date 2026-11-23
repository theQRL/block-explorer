const { test, expect } = require('@playwright/test');

test('live testnet status and latest block render in the production app', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  let status;
  await expect.poll(async () => {
    try {
      const response = await request.get('/api/status', { timeout: 10_000 });
      status = await response.json();
      return response.ok() && status.node_info?.state === 'SYNCED'
        && Number(status.node_info.block_height) > 0;
    } catch {
      return false;
    }
  }, { message: 'live testnet node must supply synced status and a positive block height', intervals: [5000] }).toBe(true);

  console.log('Live node:', JSON.stringify(status.node_info));
  expect(status.node_info.network_id).toMatch(/testnet/i);
  const height = Number(status.node_info.block_height);
  await page.goto('/status');
  await expect(page.getByRole('heading', { name: 'Network Status', exact: true })).toBeVisible();
  await expect(page.getByText('SYNCED', { exact: true })).toBeVisible();
  await expect(page.getByText(status.node_info.network_id, { exact: true })).toBeVisible();
  const renderedHeight = page.getByText('Max Block Index', { exact: true })
    .locator('..').locator('.mono-value');
  await expect(renderedHeight).toHaveText(/^\d+$/);
  // The live chain can advance between the API response and the subscription.
  expect(Number(await renderedHeight.innerText())).toBeGreaterThanOrEqual(height - 1);
  expect(Number(await renderedHeight.innerText())).toBeLessThanOrEqual(height + 10);
  await expect(page.getByText('Connection Error', { exact: true })).toHaveCount(0);

  await page.goto('/lastblocks');
  await expect(page.getByRole('heading', { name: 'Latest Blocks', exact: true })).toBeVisible();
  const latest = page.locator('.lastBlocks').first();
  await expect(latest).toBeVisible();
  const block = Number(await latest.getAttribute('data-dest'));
  expect(block).toBeGreaterThanOrEqual(height - 10);
  expect(block).toBeLessThanOrEqual(height + 10);
  await expect(latest.getByText(String(block), { exact: true })).toBeVisible();
  await expect(page.getByText('Error reading blocks', { exact: true })).toHaveCount(0);
  console.log(`Rendered testnet status height ${height}, latest block ${block}`);
  expect(errors).toEqual([]);
});
