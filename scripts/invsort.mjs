import puppeteer from 'puppeteer-core'
const OUT='/tmp/claude-1000/-home-crincon-Documents-Personal/65f20e22-5b2f-49e9-bf47-1586b34c6d57/scratchpad'
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--force-color-profile=srgb']})
const p=await b.newPage(); await p.setViewport({width:1120,height:900})
await p.goto('http://localhost:5173/auth',{waitUntil:'networkidle0'})
await Promise.all([p.waitForNavigation({waitUntil:'networkidle0'}).catch(()=>{}),p.evaluate(()=>[...document.querySelectorAll('button')].find(x=>/Entrar/i.test(x.textContent))?.click())])
await wait(1200)
await p.goto('http://localhost:5173/inventario',{waitUntil:'networkidle0'}); await wait(500)
await p.evaluate(()=>[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Caducidad')?.click())
await wait(500)
await p.screenshot({path:OUT+'/inv-caducidad.png'})
await b.close(); console.log('inv-caducidad OK')
