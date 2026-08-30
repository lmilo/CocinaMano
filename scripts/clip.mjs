import puppeteer from 'puppeteer-core'
const OUT = '/tmp/claude-1000/-home-crincon-Documents-Personal/65f20e22-5b2f-49e9-bf47-1586b34c6d57/scratchpad'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] })
const p = await b.newPage()
await p.setViewport({ width: 1120, height: 760 })
await p.goto('http://localhost:5173/auth', { waitUntil: 'networkidle0' })
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), p.evaluate(() => { ;[...document.querySelectorAll('button')].find((b) => /Entrar/i.test(b.textContent))?.click() })])
await new Promise((r) => setTimeout(r, 1200))
await p.goto('http://localhost:5173/recetas/generar', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 900))
await p.screenshot({ path: OUT + '/generar-top.png' }) // solo viewport
await b.close()
console.log('clip OK')
