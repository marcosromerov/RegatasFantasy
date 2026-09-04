import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../api/supabase';

export type CsvKind = 'puntuaciones' | 'staff' | 'grupos';

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
  staff:        ['staff_id', 'jornada', 'resultado_p1', 'resultado_p2'],
  grupos:       ['jugador_id', 'grupo'],
};

const VALID_RESULT = new Set(['G', 'E', 'P']);

const parseCsv = (rawText: string, kind: CsvKind): ParsedCsv['rows'] => {
  const expected = EXPECTED_HEADERS[kind];

  const text = rawText.replace(/^﻿/, '');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) throw new Error('El CSV está vacío.');

  const partir = (line: string, s: string): string[] =>
    line.split(s).map((v) => v.trim().replace(/^"(.*)"$/, '$1').trim());

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
      `No encontré las columnas ${expected.join(', ')}. Revisá que la primera fila sea "${expected.join(',')}".`
    );
  }

  const cortar = (line: string): string[] => partir(line, sep);
  const headers = cortar(lines[headerIdx]);
  const headersLower = headers.map((h) => h.toLowerCase());
  const idCol = kind === 'staff' ? 'staff_id' : 'jugador_id';
  const val = (values: string[], h: string): string => {
    const idx = headersLower.indexOf(h.toLowerCase());
    return idx >= 0 ? (values[idx] ?? '') : '';
  };

  const rows: CsvRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = cortar(lines[i]);
    if (values.every((v) => v === '')) continue;

    const idRaw = val(values, idCol);
    const idNum = Number(idRaw);
    if (idRaw === '' || !Number.isInteger(idNum) || idNum <= 0) continue;

    // 'grupos' no tiene jornada; 'puntuaciones' y 'staff' sí la requieren
    if (kind !== 'grupos' && val(values, 'jornada') === '') continue;

    const row: CsvRow = {};
    for (const h of expected) {
      const v = val(values, h);
      if (h === 'resultado_p1' || h === 'resultado_p2') {
        const up = v.toUpperCase();
        if (!VALID_RESULT.has(up)) {
          throw new Error(`Fila ${i + 1}, columna "${h}": valor inválido "${v}" (G, E o P).`);
        }
        row[h] = up;
      } else if (h === 'grupo') {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 4) {
          throw new Error(`Fila ${i + 1}: grupo inválido "${v}" (debe ser 1, 2, 3 o 4).`);
        }
        row[h] = n;
      } else {
        if (v === '') throw new Error(`Fila ${i + 1}: falta el valor de "${h}".`);
        const n = Number(v);
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
          throw new Error(`Fila ${i + 1}, columna "${h}": valor inválido "${v}" (se espera entero).`);
        }
        row[h] = n;
      }
    }
    rows.push(row);
  }

  if (rows.length === 0) throw new Error('No hay filas válidas para cargar.');
  return rows;
};

export const useCsvAdmin = (): UseCsvAdminReturn => {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const reset = () => { setParsed(null); setError(null); setSuccessCount(null); };

  const pickAndParse = async (kind: CsvKind) => {
    try {
      setError(null); setSuccessCount(null); setParsing(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) { setParsing(false); return; }
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      const rows = parseCsv(text, kind);
      setParsed({ headers: EXPECTED_HEADERS[kind], rows, fileName: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al parsear el CSV');
      setParsed(null);
    } finally {
      setParsing(false);
    }
  };

  const upload = async (kind: CsvKind) => {
    if (!parsed) return;
    try {
      setError(null); setSuccessCount(null); setUploading(true);

      if (kind === 'puntuaciones') {
        // Traer ids válidos para filtrar filas cuyo jugador_id no existe en la DB
        const { data: jugadoresDB } = await supabase.from('jugadores').select('id');
        const idsValidos = new Set((jugadoresDB ?? []).map((j: any) => Number(j.id)));
        const rowsFiltradas = parsed.rows.filter(r => idsValidos.has(Number(r.jugador_id)));
        const saltadas = parsed.rows.length - rowsFiltradas.length;

        if (rowsFiltradas.length === 0) {
          throw new Error(`Ningún jugador_id del CSV existe en la DB. Revisá que los IDs del Excel coincidan con la tabla jugadores.`);
        }

        const { error: upsertError } = await supabase
          .from('rendimiento_jugador')
          .upsert(rowsFiltradas, { onConflict: 'jugador_id,jornada' });
        if (upsertError) throw upsertError;

        const jornadas = Array.from(new Set(rowsFiltradas.map((r) => Number(r.jornada))));
        for (const jornada of jornadas) {
          const { error: rpcError } = await supabase.rpc('recalcular_jornada', { p_jornada: jornada });
          if (rpcError) throw rpcError;
        }

        // Mostrar cuántas se saltaron en el mensaje de éxito
        setSuccessCount(rowsFiltradas.length);
        if (saltadas > 0) setError(`⚠️ Se saltaron ${saltadas} filas cuyos jugador_id no existen en la DB.`);
        setParsed(null);
        return;
      } else if (kind === 'staff') {
        const { error: upsertError } = await supabase
          .from('staff_partidos')
          .upsert(parsed.rows, { onConflict: 'staff_id,jornada' });
        if (upsertError) throw upsertError;
      } else if (kind === 'grupos') {
        const { error: rpcError } = await supabase.rpc('set_grupos', {
          p_rows: parsed.rows,
        });
        if (rpcError) throw rpcError;
      }

      setSuccessCount(parsed.rows.length);
      setParsed(null);
    } catch (err: any) {
      const detalle = [err?.message, err?.details, err?.hint, err?.code].filter(Boolean).join(' — ');
      setError(detalle || 'Error al subir los datos');
    } finally {
      setUploading(false);
    }
  };

  return { parsed, parsing, uploading, error, successCount, pickAndParse, upload, reset };
};
