import puppeteer from 'puppeteer-core'
const OUT = '/tmp/claude-1000/-home-crincon-Documents-Personal/65f20e22-5b2f-49e9-bf47-1586b34c6d57/scratchpad'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] })
const p = await b.newPage()
await p.setViewport({ width: 1120, height: 900 })

await p.goto('http://localhost:5173/auth', { waitUntil: 'networkidle0' })
await Promise.all([
  p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
  p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Entrar/i.test(x.textContent))?.click()),
])
await wait(1200)
await p.goto('http://localhost:5173/recetas/generar', { waitUntil: 'networkidle0' })
await wait(500)

// cambiar a pestaña IA
await p.evaluate(() => {
  const tab = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith('✨') && /Generar con IA/.test(x.textContent))
  tab?.click()
})
await wait(500)

// seleccionar ingredientes
await p.evaluate(() => {
  const names = ['Arroz', 'Pollo', 'Cebolla', 'Tomate']
  const btns = [...document.querySelectorAll('button')]
  names.forEach((n) => btns.find((x) => x.textContent.trim() === n)?.click())
})
await wait(400)

// clic en el botón de acción (bg-ink, full width)
await p.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((x) => x.className.includes('bg-ink') && /Generar con IA/.test(x.textContent))
  btn?.click()
})

// esperar a Gemini
await wait(10000)
await p.screenshot({ path: `${OUT}/ia-resultado.png`, fullPage: true })
await b.close()
console.log('ia-resultado OK')
