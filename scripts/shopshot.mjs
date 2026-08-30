import puppeteer from 'puppeteer-core'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = '/tmp/claude-1000/-home-crincon-Documents-Personal/65f20e22-5b2f-49e9-bf47-1586b34c6d57/scratchpad'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] })
const p = await b.newPage()
await p.setViewport({ width: 1120, height: 900 })
const log = (...a) => console.log(...a)

await p.goto(`${BASE}/auth`, { waitUntil: 'networkidle0' })
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), p.evaluate(() => { ;[...document.querySelectorAll('button')].find((x) => /Entrar/i.test(x.textContent))?.click() })])
await new Promise((r) => setTimeout(r, 1500))

await p.goto(`${BASE}/compras`, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))

// agregar dos artículos
for (const name of ['Cilantro fresco', 'Aguacate']) {
  await p.type('input[aria-label="Nuevo artículo"]', name)
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Agregar')?.click())
  await new Promise((r) => setTimeout(r, 500))
}
const added = await p.evaluate(() => document.body.innerText)
log('¿Cilantro en lista?', /Cilantro fresco/.test(added), '| ¿Aguacate?', /Aguacate/.test(added))

// marcar el primero como comprado
await p.evaluate(() => document.querySelector('button[aria-label="Marcar como comprado"]')?.click())
await new Promise((r) => setTimeout(r, 500))
await p.screenshot({ path: `${OUT}/compras.png`, fullPage: true })

// comprar marcados
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Comprar marcados/.test(x.textContent))?.click())
await new Promise((r) => setTimeout(r, 1500))
const afterBuy = await p.evaluate(() => document.body.innerText)
log('tras comprar, ¿Cilantro sigue en lista?', /Cilantro fresco/.test(afterBuy), '(debe ser false)')

// verificar en inventario
await p.goto(`${BASE}/inventario`, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 800))
const inv = await p.evaluate(() => document.body.innerText)
log('¿Cilantro ahora en la despensa?', /Cilantro fresco/i.test(inv), '(debe ser true)')

await b.close()
log('shopshot OK')
