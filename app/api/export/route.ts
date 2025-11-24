import Parser from 'rss-parser';
import ExcelJS from 'exceljs';

type Item = {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; IA-Deporte-Noticias/1.0; +https://agentic-16061bb2.vercel.app)'
  }
});

function makeGoogleNewsRssUrl(query: string, days: number, lang: string) {
  const [hl, region] = lang.includes('-') ? lang.split('-') : ['es', 'ES'];
  const q = encodeURIComponent(`${query} when:${days}d`);
  const ceid = `${region}:${hl.toLowerCase()}`;
  return `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${region}&ceid=${ceid}`;
}

function normalizeSummary(text?: string): string | undefined {
  if (!text) return undefined;
  const stripped = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > 280 ? stripped.slice(0, 277) + '?' : stripped;
}

async function fetchItems(query: string, days: number, lang: string) {
  const url = makeGoogleNewsRssUrl(query, days, lang);
  const feed = await parser.parseURL(url);
  const items: Item[] =
    feed.items?.map((i) => {
      const source =
        (i.source && typeof i.source === 'object' && 'title' in i.source
          ? // @ts-ignore
            (i.source.title as string)
          : (i.creator as string)) ||
        (feed.title ?? 'Fuente');
      return {
        title: i.title ?? 'Sin t?tulo',
        link: i.link ?? '#',
        source,
        publishedAt: i.pubDate,
        summary: normalizeSummary(
          // @ts-ignore
          i.contentSnippet ?? (i.content as string) ?? (i.summary as string)
        )
      };
    }) ?? [];

  // Clean redirect links
  const cleaned = items.map((it) => {
    let link = it.link;
    try {
      const u = new URL(link);
      if (u.hostname === 'news.google.com' && u.searchParams.get('url')) {
        link = u.searchParams.get('url') as string;
      }
    } catch {
      // ignore malformed URLs
    }
    return { ...it, link };
  });

  return cleaned;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query =
    searchParams.get('query') ??
    '("inteligencia artificial" OR IA OR "AI") deporte';
  const days = Number(searchParams.get('days') ?? '7');
  const lang = searchParams.get('lang') ?? 'es-ES';

  const items = await fetchItems(query, days, lang);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Noticias IA Deporte');

  ws.columns = [
    { header: 'T?tulo', key: 'title', width: 60 },
    { header: 'Resumen', key: 'summary', width: 80 },
    { header: 'Fuente', key: 'source', width: 24 },
    { header: 'Fecha', key: 'publishedAt', width: 22 },
    { header: 'Enlace', key: 'link', width: 60 }
  ];

  items.forEach((it) => {
    ws.addRow({
      title: it.title,
      summary: it.summary ?? '',
      source: it.source,
      publishedAt: it.publishedAt ?? '',
      link: it.link
    });
  });

  // Make header bold
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle' };
  ws.columns?.forEach((col) => {
    col.alignment = { vertical: 'top', wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=noticias_ia_deporte.xlsx',
      'Cache-Control': 'no-store'
    }
  });
}

