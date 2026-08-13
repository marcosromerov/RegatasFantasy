export interface PlayerPosition {
  id: number;
  position: string;
  number: number;
  selected: boolean;
  vsTeam?: string;
  selectedPlayer?: {
    id: number; // jugador_id real en la DB — clave para cruzar con rendimiento_jugador
    nombre: string;
    apellido: string;
    equipoActual: string;
    puntos?: number; // puntos a mostrar (equipos destacados); opcional
  };
}

export interface DBPlayer {
  id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  equipoActual: string;
  grupo?: number | null;
}
