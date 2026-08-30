import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5173'
const OUT = '/tmp/claude-1000/-home-crincon-Documents-Personal/65f20e22-5b2f-49e9-bf47-1586b34c6d57/scratchpad'

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
})

async function shot(page, name) {
  await new Promise((r) => setTimeout(r, 650)) // dejar asentar fuentes + animaciones
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log('▸', name)
}

// Desktop
const page = await browser.newPage()
await page.setViewport({ width: 1120, height: 900, deviceScaleFactor: 1 })

await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle0' })
await shot(page, 'auth')

// login anónimo (clic en Entrar)
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
  page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Entrar/i.test(b.textContent))
    btn?.click()
  }),
])
await new Promise((r) => setTimeout(r, 1200))
await shot(page, 'dashboard')

await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle0' })
await shot(page, 'inventario')

await page.goto(`${BASE}/recetas`, { waitUntil: 'networkidle0' })
await shot(page, 'recetas')

await page.goto(`${BASE}/recetas/generar`, { waitUntil: 'networkidle0' })
await shot(page, 'generar')

await page.goto(`${BASE}/recetas/crear`, { waitUntil: 'networkidle0' })
await shot(page, 'crear')

// abrir primera receta
await page.goto(`${BASE}/recetas`, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 400))
const link = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="/recetas/"]')]
    .map((a) => a.getAttribute('href'))
    .find((h) => h && !/\/(crear|generar)$/.test(h)),
)
if (link) {
  await page.goto(`${BASE}${link}`, { waitUntil: 'networkidle0' })
  await shot(page, 'detalle')
}

// Mobile (dashboard + inventario)
const m = await browser.newPage()
await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true })
// copiar sesión: navegar y reusar login
await m.goto(`${BASE}/auth`, { waitUntil: 'networkidle0' })
await Promise.all([
  m.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
  m.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Entrar/i.test(b.textContent))
    btn?.click()
  }),
])
await new Promise((r) => setTimeout(r, 1200))
await shot(m, 'm-dashboard')
await m.goto(`${BASE}/inventario`, { waitUntil: 'networkidle0' })
await shot(m, 'm-inventario')

await browser.close()
console.log('OK')
