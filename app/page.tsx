'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

export default function HomePage() {
  const [query, setQuery] = useState(
    '("inteligencia artificial" OR IA OR "AI") deporte'
  );
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set('query', query);
    p.set('days', String(days));
    p.set('lang', 'es-ES');
    return p.toString();
  }, [query, days]);

  const buscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/buscar?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Error al buscar noticias');
      }
      const data = (await res.json()) as { items: NewsItem[] };
      setItems(data.items);
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    // B?squeda inicial
    buscar();
  }, [buscar]);

  const descargarExcel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/export?${qs}`);
      if (!res.ok) {
        throw new Error('No se pudo generar el Excel');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'noticias_ia_deporte.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 980,
        margin: '0 auto',
        padding: '32px 16px'
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Noticias de IA en el Deporte</h1>
      <p style={{ marginTop: 0, color: '#334155' }}>
        Busca titulares relacionados con IA en el deporte y exporta un Excel con
        t?tulo y resumen corto.
      </p>

      <section
        style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 1fr',
            gap: 12,
            alignItems: 'end'
          }}
        >
          <div>
            <label
              htmlFor="q"
              style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}
            >
              Consulta
            </label>
            <input
              id="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Ej: ("inteligencia artificial" OR IA OR "AI") deporte'
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1'
              }}
            />
          </div>
          <div>
            <label
              htmlFor="days"
              style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}
            >
              D?as
            </label>
            <input
              id="days"
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={buscar}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #0ea5e9',
                background: '#0ea5e9',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Buscando?' : 'Buscar'}
            </button>
            <button
              onClick={descargarExcel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #16a34a',
                background: '#16a34a',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Generando?' : 'Descargar Excel'}
            </button>
          </div>
        </div>
        {error && (
          <p style={{ color: '#b91c1c', marginTop: 12 }}>
            Error: {error}
          </p>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: 8 }}>Resultados</h2>
        <p style={{ marginTop: 0, color: '#475569' }}>
          {items.length} resultados
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it) => (
            <li
              key={it.link}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12
              }}
            >
              <a
                href={it.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#0ea5e9',
                  textDecoration: 'none'
                }}
              >
                {it.title}
              </a>
              <div
                style={{
                  color: '#334155',
                  marginTop: 8
                }}
              >
                {it.summary}
              </div>
              <div
                style={{
                  color: '#64748b',
                  marginTop: 8,
                  fontSize: 14
                }}
              >
                {it.source} {it.publishedAt ? `? ${it.publishedAt}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

