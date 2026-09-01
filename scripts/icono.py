#!/usr/bin/env python3
"""
Genera los iconos de Cocina a Mano desde la marca. No se dibujan a mano.

LA FORMA ES LA ETIQUETA DE DESPENSA: el pentágono con el pico y el agujero para el cordel,
que es el gesto que la app digitaliza — el frasco rotulado a mano con la fecha en marcador.
Ver `_branding/MOODBOARD.md` §2.

La banda ámbar al pie es el reloj de la comida: el mismo token que en la app marca lo que
se está por vencer. A 48dp una olla o un plato se habrían leído como el icono de cualquier
app de recetas; una etiqueta no.

    python3 scripts/icono.py
"""

import os

from PIL import Image, ImageDraw

# Tokens de `src/constants/tokens.ts`. Si cambian allá, cambian aquí.
ALBAHACA = (36, 82, 57, 255)
PAPEL = (250, 246, 237, 255)
AMBAR = (224, 168, 46, 255)
BLANCO = (255, 255, 255, 255)
NADA = (0, 0, 0, 0)

LIENZO = 1024
# Se dibuja a 4x y se reduce: PIL no antialiasa los polígonos, y a tamaño final el pico de
# la etiqueta saldría con escalones.
ESCALA = 4


# Una etiqueta vertical y con el pico suave se lee como una CASA. La inclinación es lo
# que la salva: nadie dibuja una casa torcida, y una etiqueta colgando siempre lo está.
INCLINACION = 18


def etiqueta(img, cx, cy, ancho, alto, papel, banda, hueco):
    """La etiqueta colgante centrada en (cx, cy), en coordenadas del lienzo final."""
    capa = Image.new('RGBA', (img.width * ESCALA, img.height * ESCALA), NADA)
    d = ImageDraw.Draw(capa)

    cx, cy, ancho, alto = cx * ESCALA, cy * ESCALA, ancho * ESCALA, alto * ESCALA
    izq, der = cx - ancho / 2, cx + ancho / 2
    arr, aba = cy - alto / 2, cy + alto / 2
    # Hombro bajo y pico agudo: es la diferencia entre una etiqueta y un tejado.
    hombro = arr + alto * 0.30

    d.polygon(
        [(cx, arr), (der, hombro), (der, aba), (izq, aba), (izq, hombro)],
        fill=papel,
    )

    # El agujero del cordel, metido en el pico.
    r = ancho * 0.075
    hy = arr + alto * 0.155
    d.ellipse([cx - r, hy - r, cx + r, hy + r], fill=hueco)

    # La banda del reloj, al pie.
    banda_alto = alto * 0.13
    banda_arr = aba - banda_alto - alto * 0.15
    d.rounded_rectangle(
        [izq + ancho * 0.17, banda_arr, der - ancho * 0.17, banda_arr + banda_alto],
        radius=banda_alto / 2,
        fill=banda,
    )

    # `expand=False` mantiene el encuadre; la etiqueta se dimensiona contando con el giro.
    capa = capa.rotate(INCLINACION, resample=Image.BICUBIC, center=(cx, cy))
    capa = capa.resize(img.size, Image.LANCZOS)
    img.alpha_composite(capa)


def lienzo(fondo=NADA):
    return Image.new('RGBA', (LIENZO, LIENZO), fondo)


def guardar(img, nombre, tam=None):
    if tam:
        img = img.resize((tam, tam), Image.LANCZOS)
    img.save(f'assets/images/{nombre}')
    print(f'  {nombre}  {img.size[0]}px')


def main():
    os.makedirs('assets/images', exist_ok=True)
    print('Generando iconos desde la marca:')

    # ── icon.png — el general, con su propio fondo ────────────────────────
    img = lienzo(ALBAHACA)
    etiqueta(img, LIENZO / 2, LIENZO / 2, LIENZO * 0.42, LIENZO * 0.58, PAPEL, AMBAR, ALBAHACA)
    guardar(img, 'icon.png')

    # ── adaptativo de Android ─────────────────────────────────────────────
    # El foreground tiene que caber en el 66% central: Android recorta el resto según la
    # máscara del fabricante, que puede ser círculo, squircle o lo que se le ocurra.
    fg = lienzo()
    etiqueta(fg, LIENZO / 2, LIENZO / 2, LIENZO * 0.28, LIENZO * 0.38, PAPEL, AMBAR, ALBAHACA)
    guardar(fg, 'android-icon-foreground.png')

    guardar(lienzo(ALBAHACA), 'android-icon-background.png')

    # El monocromo (tema dinámico de Android 13+) es SILUETA: el agujero se recorta de
    # verdad y la banda va del mismo blanco, porque el sistema lo repinta entero de un tono.
    mono = lienzo()
    etiqueta(mono, LIENZO / 2, LIENZO / 2, LIENZO * 0.28, LIENZO * 0.38, BLANCO, BLANCO, NADA)
    guardar(mono, 'android-icon-monochrome.png')

    # ── splash ────────────────────────────────────────────────────────────
    # Sin fondo propio: lo pone `app.json`, distinto en claro y en oscuro.
    sp = lienzo()
    etiqueta(sp, LIENZO / 2, LIENZO / 2, LIENZO * 0.42, LIENZO * 0.58, ALBAHACA, AMBAR, PAPEL)
    guardar(sp, 'splash-icon.png', 512)

    # ── notificación ──────────────────────────────────────────────────────
    # Android exige silueta blanca sobre transparente: cualquier color se descarta y lo que
    # no sea blanco puro sale como un cuadro gris.
    nt = lienzo()
    etiqueta(nt, LIENZO / 2, LIENZO / 2, LIENZO * 0.48, LIENZO * 0.64, BLANCO, BLANCO, NADA)
    guardar(nt, 'notificacion-icon.png', 96)

    print('Listo.')


if __name__ == '__main__':
    main()
