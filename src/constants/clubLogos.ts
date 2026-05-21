import { ImageSourcePropType } from 'react-native';

/**
 * Logos de los clubes del fixture.
 *
 * Cómo agregar / cambiar un logo:
 *  - Remoto: poné `{ uri: 'https://...' }`
 *  - Local (recomendado): poné el archivo en `assets/images/clubs/<archivo>.png`
 *    y usá `require('../../assets/images/clubs/<archivo>.png')`.
 *
 * Si un club no tiene logo en el mapa, la UI muestra un círculo con las
 * iniciales del club (fallback automático), así nunca se rompe.
 *
 * Las claves están normalizadas (minúsculas, sin acentos ni puntos) para que
 * matcheen con los nombres del fixture aunque varíen un poco.
 */

// Normaliza un nombre de club para usar como clave del mapa.
export const normalizeClubName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca acentos (diacriticos combinados)
    .replace(/\./g, '') // saca puntos (ej "At." -> "at")
    .replace(/\s+/g, ' ')
    .trim();

const LOGO_SOURCES: Record<string, ImageSourcePropType> = {
  // --- Wikimedia Commons (hotlink confiable) ---
  casi: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Escudo_de_Club_Atl%C3%A9tico_San_Isidro.svg/120px-Escudo_de_Club_Atl%C3%A9tico_San_Isidro.svg.png' },
  sic: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/San_Isidro_Club_logo.svg/120px-San_Isidro_Club_logo.svg.png' },
  'belgrano ath': { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Escudo_de_Belgrano_Athletic_Club.svg/250px-Escudo_de_Belgrano_Athletic_Club.svg.png' },
  hindu: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Hindu_club_logo.svg/120px-Hindu_club_logo.svg.png' },
  alumni: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Alumni_rugby_logo.svg/120px-Alumni_rugby_logo.svg.png' },
  'at del rosario': { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Atlet_rosario_logo.svg/120px-Atlet_rosario_logo.svg.png' },
  'los tilos': { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Los_tilos_rugby_logo.png/120px-Los_tilos_rugby_logo.png' },
  'los matreros': { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Los_matreros_rc_logo.png/120px-Los_matreros_rc_logo.png' },
  cuba: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Universitario_BA_logo.svg/120px-Universitario_BA_logo.svg.png' },

  // --- English Wikipedia (fair-use). OJO: el hotlink desde en.wikipedia a veces
  //     da 403. Si alguno no carga en el celu, bajalo a assets/images/clubs/ ---
  newman: { uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Club_newman_escudo.png/120px-Club_newman_escudo.png' },
  champagnat: { uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Club_champagnat_logo.png/120px-Club_champagnat_logo.png' },
  'la plata': { uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/La_Plata_Rugby_Club_Crest.svg/250px-La_Plata_Rugby_Club_Crest.svg.png' },
  bacrc: { uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Buenos_Aires_CRC_Crest.svg/120px-Buenos_Aires_CRC_Crest.svg.png' },
};

/**
 * Devuelve el source de imagen para un club, o null si no hay logo cargado.
 */
export const getClubLogo = (rival: string | null | undefined): ImageSourcePropType | null => {
  if (!rival) return null;
  return LOGO_SOURCES[normalizeClubName(rival)] ?? null;
};

/**
 * Iniciales para el fallback (ej: "Los Tilos" -> "LT", "CASI" -> "CA").
 */
export const getClubInitials = (rival: string | null | undefined): string => {
  if (!rival) return '?';
  const clean = rival.replace(/\./g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};
