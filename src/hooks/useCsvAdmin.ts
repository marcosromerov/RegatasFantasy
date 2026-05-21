import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../api/supabase';

export type CsvKind = 'puntuaciones' | 'staff';

/**
 * Filas parseadas de un CSV. Las columnas dependen del `kind`:
 *  - puntuaciones: { jugador_id, jornada, puntos }
 *  - staff:        { staff_id, jornada, resultado_p1, resultado_p2 }
 */
export type CsvRow = Record<string, string | number>;

interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  fileName: string;
}

interface UseCsvAdminReturn {
  parsed: ParsedCsv | null;
  parsing: boolean;
  uploading: boolean;
  error: string | null;
  successCount: number | null;
  pickAndParse: (kind: CsvKind) => Promise<void>;
  upload: (kind: CsvKind) => Promise<void>;
  reset: () => void;
}

const EXPECTED_HEADERS: Record<CsvKind, string[]> = {
  puntuaciones: ['jugador_id', 'jornada', 'puntos'],
  staff: ['staff_id', 'jornada', 'resultado_p1', 'resultado_p2'],
};

const VALID_RESULT = new Set(['G', 'E', 'P']);

/**
 * Parser de CSV muy simple. Asume:
 *  - Separador: coma
 *  - Sin comillas (los datos son numéricos o letras G/E/P)
 *  - Primera línea = headers
 */
const parseCsv = (text: string, kind: CsvKind): ParsedCsv['rows'] => {
  const expected = EXPECTED_HEADERS[kind];

  // Normalizamos saltos de línea y filtramos vacías
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error('El CSV está vacío.');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const missing = expected.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(
      `Faltan columnas en el CSV: ${missing.join(', ')}. Esperadas: ${expected.join(', ')}`
    );
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(
        `Fila ${i + 1}: cantidad de columnas no coincide con el header (${values.length} vs ${headers.length}).`
      );
    }

    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      const v = values[idx];

      if (kind === 'puntuaciones') {
        // jugador_id, jornada, puntos → todos enteros
        if (h === 'jugador_id' || h === 'jornada' || h === 'puntos') {
          const n = Number(v);
          if (!Number.isFinite(n) || !Number.isInteger(n)) {
            throw new Error(`Fila ${i + 1}, columna "${h}": valor inválido "${v}" (se espera entero).`);
          }
          row[h] = n;
          return;
        }
      }

      if (kind === 'staff') {
        if (h === 'staff_id' || h === 'jornada') {
          const n = Number(v);
          if (!Number.isFinite(n) || !Number.isInteger(n)) {
            throw new Error(`Fila ${i + 1}, columna "${h}": valor inválido "${v}" (se espera entero).`);
          }
          row[h] = n;
          return;
        }
        if (h === 'resultado_p1' || h === 'resultado_p2') {
          const up = v.toUpperCase();
          if (!VALID_RESULT.has(up)) {
            throw new Error(`Fila ${i + 1}, columna "${h}": valor inválido "${v}" (se espera G, E o P).`);
          }
          row[h] = up;
          return;
        }
      }

      row[h] = v;
    });

    rows.push(row);
  }

  return rows;
};

export const useCsvAdmin = (): UseCsvAdminReturn => {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const reset = () => {
    setParsed(null);
    setError(null);
    setSuccessCount(null);
  };

  const pickAndParse = async (kind: CsvKind) => {
    try {
      setError(null);
      setSuccessCount(null);
      setParsing(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setParsing(false);
        return;
      }

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();

      const rows = parseCsv(text, kind);
      const headers = EXPECTED_HEADERS[kind];

      setParsed({ headers, rows, fileName: file.name });
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Error al parsear el CSV');
      setParsed(null);
    } finally {
      setParsing(false);
    }
  };

  const upload = async (kind: CsvKind) => {
    if (!parsed) return;
    try {
      setError(null);
      setSuccessCount(null);
      setUploading(true);

      if (kind === 'puntuaciones') {
        const { error: upsertError } = await supabase
          .from('rendimiento_jugador')
          .upsert(parsed.rows, { onConflict: 'jugador_id,jornada' });
        if (upsertError) throw upsertError;
      } else {
        const { error: upsertError } = await supabase
          .from('staff_partidos')
          .upsert(parsed.rows, { onConflict: 'staff_id,jornada' });
        if (upsertError) throw upsertError;
      }

      setSuccessCount(parsed.rows.length);
      setParsed(null);
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setError(err instanceof Error ? err.message : 'Error al subir los datos');
    } finally {
      setUploading(false);
    }
  };

  return {
    parsed,
    parsing,
    uploading,
    error,
    successCount,
    pickAndParse,
    upload,
    reset,
  };
};
