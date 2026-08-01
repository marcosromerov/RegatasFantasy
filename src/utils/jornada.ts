import { FIXTURE_DATA } from '../components/Home/CalendarModal';

// Devuelve el día de la semana en hora argentina (UTC-3, sin horario de verano).
// 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
function getDiaArgentina(): number {
  const argMs = Date.now() - 3 * 60 * 60 * 1000;
  return new Date(argMs).getUTCDay();
}

// La ventana de edición abre el miércoles y cierra el sábado a las 2:00 AM (hora ARG).
export function isEditWindowOpen(): boolean {
  const argMs = Date.now() - 3 * 60 * 60 * 1000;
  const argDate = new Date(argMs);
  const dia = argDate.getUTCDay();
  const hora = argDate.getUTCHours();

  if (dia >= 3 && dia <= 5) return true;        // Mié, Jue, Vie: siempre abierto
  if (dia === 6 && hora < 2) return true;       // Sáb antes de las 2 AM: abierto
  return false;                                  // resto: cerrado
}

// Jornada actual = primer partido marcado como pendiente en el fixture.
export function getJornada(): number {
  const proxima = FIXTURE_DATA.find(f => f.estado === 'pendiente');
  return proxima ? proxima.id : 1;
}
