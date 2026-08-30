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
await wait(1200)
await p.screenshot({ path: `${OUT}/dash-soft.png`, fullPage: true })
console.log('▸ dash-soft')

// Matching → ver preparación de la primera receta
await p.goto('http://localhost:5173/recetas/generar', { waitUntil: 'networkidle0' })
await wait(500)
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Ver preparación')?.click())
await wait(500)
await p.screenshot({ path: `${OUT}/match-prep.png` })
console.log('▸ match-prep')

// AI tab → formulario
await p.evaluate(() => {
  const tab = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith('✨') && /Generar con IA/.test(x.textContent))
  tab?.click()
})
await wait(400)
// expandir ingredientes
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Usar ingredientes que tengo/.test(x.textContent))?.click())
await wait(400)
await p.screenshot({ path: `${OUT}/ai-form.png`, fullPage: true })
console.log('▸ ai-form')

await b.close()
console.log('OK')
