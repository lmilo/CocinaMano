import puppeteer from 'puppeteer-core'
const OUT = '/tmp/claude-1000/-home-crincon-Documents-Personal/65f20e22-5b2f-49e9-bf47-1586b34c6d57/scratchpad'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] })
const p = await b.newPage()
await p.setViewport({ width: 1120, height: 900 })
await p.goto('http://localhost:5173/auth', { waitUntil: 'networkidle0' })
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), p.evaluate(() => { ;[...document.querySelectorAll('button')].find((b) => /Entrar/i.test(b.textContent))?.click() })])
await new Promise((r) => setTimeout(r, 1200))
await p.goto('http://localhost:5173/recetas', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 500))
// abrir una receta SIN nota (Huevos pericos → rating null → estrellas vacías)
const href = await p.evaluate(() => {
  const link = [...document.querySelectorAll('a[href^="/recetas/"]')].find((a) => /Huevos pericos/i.test(a.textContent))
  return link?.getAttribute('href')
})
if (!href) { console.log('no encontré Huevos pericos'); await b.close(); throw new Error('x') }
await p.goto('http://localhost:5173' + href, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 700))
await p.screenshot({ path: OUT + '/detalle-rating.png', fullPage: true })
await b.close()
console.log('detalle-rating OK →', href)
