import Parser from 'rss-parser';
import { NextResponse } from 'next/server';

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
  // lang expected like es-ES
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query =
    searchParams.get('query') ??
    '("inteligencia artificial" OR IA OR "AI") deporte';
  const days = Number(searchParams.get('days') ?? '7');
  const lang = searchParams.get('lang') ?? 'es-ES';

  try {
    const url = makeGoogleNewsRssUrl(query, days, lang);
    const feed = await parser.parseURL(url);
    const items: Item[] =
      feed.items?.map((i) => {
        const source =
          (i.source && typeof i.source === 'object' && 'title' in i.source
            ? // @ts-ignore rss-parser type looseness
              (i.source.title as string)
            : (i.creator as string)) ||
          (feed.title ?? 'Fuente');
        return {
          title: i.title ?? 'Sin t?tulo',
          link: i.link ?? '#',
          source,
          publishedAt: i.pubDate,
          summary: normalizeSummary(
            // Prefer contentSnippet, then content, then summary
            // @ts-ignore
            i.contentSnippet ?? (i.content as string) ?? (i.summary as string)
          )
        };
      }) ?? [];

    // Remove Google redirector if present
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

    return NextResponse.json({ items: cleaned }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Error al obtener el RSS' },
      { status: 500 }
    );
  }
}

