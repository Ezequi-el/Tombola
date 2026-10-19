import { test, expect } from '@playwright/test';

test('first visit prepares the whole app; reload and draw work offline', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const remote = [];
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4173') && /^https?:/.test(request.url())) remote.push(request.url());
  });
  await page.goto('/');
  const initialPacks = await page.evaluate(() => JSON.parse(localStorage.getItem('tombola_question_packs_v1')));
  expect(initialPacks.map(pack => [pack.name, pack.tickets.length])).toEqual([['Sección de preguntas', 9], ['Sección de frases', 10]]);
  expect(initialPacks[0].tickets[0].text).toBe(initialPacks[0].tickets[8].text);
  await expect(page.getByRole('status')).toHaveText('Lista para usar sin conexión.', { timeout: 60000 });
  await expect(page.getByRole('button', { name: 'Instalar Tómbola' })).toHaveCount(0);

  // Browser eligibility is not reproducible headlessly: verify the event-driven UI.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.installPromptCalled = true; };
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: 'Instalar Tómbola' }).click();
  expect(await page.evaluate(() => window.installPromptCalled)).toBe(true);
  await expect(page.getByRole('button', { name: 'Instalar Tómbola' })).toHaveCount(0);

  // Check every precached asset and both actual PNG icon dimensions.
  const assets = await page.evaluate(async () => {
    const key = (await caches.keys()).find(key => key.startsWith('tombola-pwa-'));
    return (await (await caches.open(key)).keys()).map(request => request.url);
  });
  expect(assets.some(url => url.endsWith('.woff2'))).toBe(true);
  for (const size of [192, 512]) {
    const dimensions = await page.evaluate(async size => {
      const image = new Image();
      image.src = '/icon-' + size + '.png';
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, size);
    expect(dimensions).toEqual([size, size]);
  }

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Sin conexión');
  for (const url of assets) {
    expect(await page.evaluate(async url => (await fetch(url)).ok, url)).toBe(true);
  }
  await page.getByRole('button', { name: '¡Girar Tómbola Mágica!' }).click();
  await expect(page.getByText('¡Boleto Seleccionado!', { exact: true })).toBeVisible({ timeout: 20000 });
  const history = await page.evaluate(() => localStorage.getItem('tombola_history_v3_pastel'));
  expect(JSON.parse(history)).toHaveLength(1);
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('tombola_history_v3_pastel'))).toBe(history);
  await page.getByRole('button', { name: 'Bancos & Boletos' }).click();
  await expect(page.getByText('Crear Nuevo Banco', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: /Crear Nuevo Banco/ }).click();
  await page.getByPlaceholder('Ej: Matemáticas & Acertijos Locos').fill('Banco offline');
  await page.getByPlaceholder(/¿Cuánto es 5 x 5/).fill('Pregunta guardada sin internet');
  await page.getByRole('button', { name: /¡Crear y Guardar Banco!/ }).click();
  const packs = await page.evaluate(() => localStorage.getItem('tombola_question_packs_v1'));
  expect(JSON.parse(packs).some(pack => pack.name === 'Banco offline')).toBe(true);
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('tombola_question_packs_v1'))).toBe(packs);
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('old banks migrate once without clearing history or settings', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('migration-test-seeded')) return;
    localStorage.setItem('migration-test-seeded', 'yes');
    localStorage.setItem('tombola_question_packs_v1', JSON.stringify([{ id: 'old', name: 'Anterior', tickets: [] }]));
    localStorage.setItem('tombola_history_v3_pastel', JSON.stringify([{ id: 'kept', ticketText: 'Historial conservado', timestamp: 0 }]));
    localStorage.setItem('tombola_config_v3_pastel', JSON.stringify({
      title: 'Mi título', subtitle: 'Mi subtítulo', theme: 'cottonCandy', withReplacement: true,
      soundEnabled: false, spinDurationSeconds: 3.5, drumSpeed: 'normal', predictionMode: 'equal', oracleBoostFactor: 1.8
    }));
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mi título' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('tombola_question_packs_revision'))).toBe('secciones-salud-v1');
  const saved = await page.evaluate(() => ({
    packs: JSON.parse(localStorage.getItem('tombola_question_packs_v1')),
    history: JSON.parse(localStorage.getItem('tombola_history_v3_pastel')),
    config: JSON.parse(localStorage.getItem('tombola_config_v3_pastel')),
  }));
  expect(saved.packs.map(pack => pack.name)).toEqual(['Sección de preguntas', 'Sección de frases']);
  expect(saved.history[0].id).toBe('kept');
  expect(saved.config.soundEnabled).toBe(false);
  await page.evaluate(() => {
    const packs = JSON.parse(localStorage.getItem('tombola_question_packs_v1'));
    packs[0].name = 'Mi edición posterior';
    localStorage.setItem('tombola_question_packs_v1', JSON.stringify(packs));
  });
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tombola_question_packs_v1'))[0].name)).toBe('Mi edición posterior');
});
