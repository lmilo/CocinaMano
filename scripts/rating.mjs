import puppeteer from 'puppeteer-core'
const OUT = '/tmp/claude-1000/-home-crincon-Documents-Personal/65f20e22-5b2f-49e9-bf47-1586b34c6d57/scratchpad'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] })
const p = await b.newPage()
await p.setViewport({ width: 1120, height: 950 })

await p.goto('http://localhost:5173/auth', { waitUntil: 'networkidle0' })
await Promise.all([
  p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
  p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Entrar/i.test(x.textContent))?.click()),
])
await wait(1300)

// Lista de recetas (con estrellas / preparada)
await p.goto('http://localhost:5173/recetas', { waitUntil: 'networkidle0' })
await wait(700)
await p.screenshot({ path: `${OUT}/ratings-list.png` })
console.log('▸ ratings-list')

// Abrir "Lentejas guisadas" (sin nota) y calificarla con 4
const href = await p.evaluate(() => {
  const link = [...document.querySelectorAll('a[href^="/recetas/"]')].find((a) => /Lentejas/.test(a.textContent))
  return link?.getAttribute('href')
})
await p.goto(`http://localhost:5173${href}`, { waitUntil: 'networkidle0' })
await wait(600)
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Calificar con 4/.test(x.getAttribute('aria-label') || ''))?.click())
await wait(900) // persistencia
await p.screenshot({ path: `${OUT}/rating-detail.png`, fullPage: true })
console.log('▸ rating-detail')

await b.close()
console.log('OK')
