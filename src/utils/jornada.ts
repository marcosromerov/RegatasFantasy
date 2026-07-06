import { getProximoPartido } from '../components/Home/CalendarModal';

/**
 * 🧪 MODO PRUEBA
 * Si le ponés un número, la app ignora el fixture y usa esa jornada,
 * y además deja la edición del equipo SIEMPRE abierta.
 * Dejalo en `null` para el comportamiento normal (jornada del fixture + ventana mié–vie).
 */
export const JORNADA_PRUEBA: number | null = null;

/**
 * Jornada "actual" para armar equipo = número del próximo partido del fixture.
 * Devuelve null si no hay próximo partido con fecha definida (ej: 2ª ronda a definir).
 */
export const getJornadaActual = (today: Date = new Date()): number | null => {
  if (JORNADA_PRUEBA !== null) return JORNADA_PRUEBA;
  const proximo = getProximoPartido(today);
  return proximo ? proximo.id : null;
};

/**
 * Día de la semana en horario de Argentina, SIN parsear strings de fecha
 * (Hermes no parsea `toLocaleString`, devolvía Invalid Date).
 * 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb.
 */
const diaSemanaArgentina = (base: Date = new Date()): number => {
  try {
    const nombre = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'short',
    }).format(base);
    const map: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const d = map[nombre];
    if (d !== undefined) return d;
  } catch {
    // Intl/timeZone no disponible → caemos a la hora local del dispositivo.
  }
  return base.getDay();
};

/**
 * La edición del equipo está abierta miércoles, jueves y viernes (hora Argentina).
 * Cierra el sábado y reabre el miércoles. Los martes se resetean los equipos (cron en la DB).
 */
const DIAS_EDICION = [3, 4, 5];

export const isEdicionAbierta = (today: Date = new Date()): boolean => {
  if (JORNADA_PRUEBA !== null) return true;
  return DIAS_EDICION.includes(diaSemanaArgentina(today));
};

/** Mensaje para mostrar cuando la edición está cerrada. */
export const MENSAJE_EDICION_CERRADA =
  'La edición del equipo está cerrada. Podés armar tu equipo de miércoles a viernes.';
