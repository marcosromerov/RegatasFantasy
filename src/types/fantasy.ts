export interface PlayerPosition {
  id: number;
  position: string;
  number: number;
  selected: boolean;
  vsTeam?: string;
  selectedPlayer?: {
    nombre: string;
    apellido: string;
    estrellas: number;
    equipoActual: string;
  };
}

export interface DBPlayer {
  id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  estrellas: number;
  equipoActual: string;
}