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
const parseCsv = (rawText: string, kind: CsvKind): ParsedCsv['rows'] => {
  const expected = EXPECTED_HEADERS[kind];

  // Sacamos BOM (Excel suele agregarlo), normalizamos saltos y filtramos vacías.
  const text = rawText.replace(/^﻿/, '');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error('El CSV está vacío.');
  }

  const partir = (line: string, s: string): string[] =>
    line.split(s).map((v) => v.trim().replace(/^"(.*)"$/, '$1').trim());

  // Probamos cada separador (coma, punto y coma o tab — Excel en español usa ';')
  // y buscamos la fila que tenga TODAS las columnas esperadas. Así detectamos
  // separador + encabezado juntos, y toleramos líneas de más antes del header.
  const candidatos = [',', ';', '\t'];
  let sep = ',';
  let headerIdx = -1;
  for (const c of candidatos) {
    const idx = lines.findIndex((l) => {
      const cols = partir(l, c).map((x) => x.toLowerCase());
      return expected.every((h) => cols.includes(h.toLowerCase()));
    });
    if (idx !== -1) { sep = c; headerIdx = idx; break; }
  }
  if (headerIdx === -1) {
    throw new Error(
      `No encontré las columnas ${expected.join(', ')}. Revisá que la primera fila sea ` +
      `exactamente "${expected.join(',')}".`
    );
  }

  const cortar = (line: string): string[] => partir(line, sep);

  const headers = cortar(lines[headerIdx]);
  const headersLower = headers.map((h) => h.toLowerCase());
  const idCol = kind === 'puntuaciones' ? 'jugador_id' : 'staff_id';
  const val = (values: string[], h: string): string => {
    const idx = headersLower.indexOf(h.toLowerCase());
    return idx >= 0 ? (values[idx] ?? '') : '';
  };

  const rows: CsvRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = cortar(lines[i]);

    // Fila totalmente vacía → la saltamos.
    if (values.every((v) => v === '')) continue;

    // Sin id válido (fila de planilla sin cargar) → la saltamos, no es error.
    const idRaw = val(values, idCol);
    const idNum = Number(idRaw);
    if (idRaw === '' || !Number.isInteger(idNum) || idNum <= 0) continue;

    // Solo tomamos las columnas esperadas (ignoramos extras: nombre, stats, etc.).
    const row: CsvRow = {};
    for (const h of expected) {
      const v = val(values, h);
      if (h === 'resultado_p1' || h === 'resultado_p2') {
        const up = v.toUpperCase();
        if (!VALID_RESULT.has(up)) {
          throw new Error(`Fila ${i + 1}, columna "${h}": valor inválido "${v}" (se espera G, E o P).`);
        }
        row[h] = up;
      } else {
        if (v === '') {
          throw new Error(`Fila ${i + 1}: falta el valor de "${h}".`);
        }
        const n = Number(v);
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
          throw new Error(`Fila ${i + 1}, columna "${h}": valor inválido "${v}" (se espera entero).`);
        }
        row[h] = n;
      }
    }
    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error('No hay filas para cargar. Revisá que las filas tengan jugador_id, jornada y puntos.');
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

        // Sumatoria: recalculamos los puntos de los usuarios para cada jornada
        // presente en el CSV. Esto actualiza usuarios.puntos (ranking).
        const jornadas = Array.from(
          new Set(parsed.rows.map((r) => Number(r.jornada)))
        );
        for (const jornada of jornadas) {
          const { error: rpcError } = await supabase.rpc('recalcular_jornada', {
            p_jornada: jornada,
          });
          if (rpcError) throw rpcError;
        }
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
