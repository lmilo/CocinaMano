import { View } from 'react-native'
import { cargarAnuncios, UNIDAD_BANNER } from '../lib/anuncios'
import { useTema } from '../lib/tema'

/**
 * El banner, encima de la barra de pestañas.
 *
 * NO aparece en el modo cocina ni en las pantallas de cámara: en el primero el usuario está
 * de pie siguiendo un paso con las manos ocupadas, y un toque accidental en un anuncio le
 * saca la receta de la pantalla en el peor momento posible.
 *
 * Si el módulo nativo no está, esto no pinta nada — ni un hueco reservado, que se vería
 * como un fallo de maquetación.
 */
export function BannerAnuncio() {
  const { c } = useTema()
  const modulo = cargarAnuncios()
  if (!modulo) return null

  const { BannerAd, BannerAdSize } = modulo

  return (
    <View style={{ alignItems: 'center', backgroundColor: c.tarjeta }}>
      <BannerAd
        unitId={UNIDAD_BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  )
}
