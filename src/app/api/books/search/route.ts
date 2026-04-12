import { NextRequest, NextResponse } from 'next/server';

// ── Simple in-memory cache ────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface GoogleBook {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    previewLink?: string;
    infoLink?: string;
    language?: string;
    pageCount?: number;
    publishedDate?: string;
    averageRating?: number;
    ratingsCount?: number;
    subtitle?: string;
    canonicalVolumeLink?: string;
  };
  accessInfo?: {
    pdfLink?: string;
    epubAvailable?: boolean;
    pdfAvailable?: boolean;
    accessViewStatus?: string;
  };
  saleInfo?: {
    isEbook?: boolean;
  };
}

interface OpenLibraryWork {
  key: string;
  title: string;
  author_name?: string[];
  subject?: string[];
  cover_i?: number;
  first_publish_year?: number;
  edition_count?: number;
  description?: string;
  language?: string[];
}

function getCache(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
  // Prune old entries if cache grows too large
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.ts > CACHE_TTL) cache.delete(k);
    }
  }
}

function normalizeBook(b: GoogleBook) {
  const info = b.volumeInfo || {};
  const access = b.accessInfo || {};
  return {
    id: b.id,
    title: info.title || 'Untitled',
    authors: info.authors?.join(', ') || 'Unknown Author',
    description: info.description || '',
    categories: info.categories || [],
    coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || info.imageLinks?.smallThumbnail?.replace('http://', 'https://') || null,
    previewLink: info.previewLink || info.infoLink || null,
    infoLink: info.infoLink || null,
    language: info.language || 'en',
    pageCount: info.pageCount || null,
    publishedDate: info.publishedDate || null,
    averageRating: info.averageRating || null,
    ratingsCount: info.ratingsCount || 0,
    subtitle: info.subtitle || null,
    pdfLink: access.pdfLink || null,
    pdfAvailable: access.pdfAvailable || false,
    accessViewStatus: access.accessViewStatus || 'NONE',
    source: 'google',
  };
}

function normalizeOLBook(b: OpenLibraryWork) {
  return {
    id: b.key?.replace('/works/', '') || '',
    title: b.title || 'Untitled',
    authors: b.author_name?.join(', ') || 'Unknown Author',
    description: typeof b.description === 'string' ? b.description : '',
    categories: b.subject?.slice(0, 3) || [],
    coverUrl: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
    previewLink: b.key ? `https://openlibrary.org${b.key}` : null,
    infoLink: b.key ? `https://openlibrary.org${b.key}` : null,
    language: b.language?.[0] || 'en',
    pageCount: null,
    publishedDate: b.first_publish_year ? String(b.first_publish_year) : null,
    averageRating: null,
    ratingsCount: 0,
    subtitle: null,
    pdfLink: null,
    pdfAvailable: false,
    accessViewStatus: 'NONE',
    source: 'openlibrary',
  };
}

// Category-to-search-keyword mappings for Google Books
const CATEGORY_QUERIES: Record<string, string> = {
  'Computer Science': 'computers programming computer science',
  'Law (LLB)': 'law legal jurisprudence textbook',
  'Business Administration (BBA)': 'business administration management textbook',
  'Engineering': 'engineering electrical civil mechanical textbook',
  'Web Development & UI/UX Design': 'web development UX design frontend',
  'Data Science & Machine Learning': 'data science machine learning artificial intelligence',
  'History & General Education': 'history education general knowledge',
};

const CATEGORY_QUERIES_BN: Record<string, string> = {
  'Computer Science': 'কম্পিউটার বিজ্ঞান বা programming',
  'Law (LLB)': 'আইন বা law',
  'Business Administration (BBA)': 'ব্যবসায় প্রশাসন বা business',
  'Engineering': 'প্রকৌশল বা engineering',
  'Web Development & UI/UX Design': 'ওয়েব ডেভেলপমেন্ট',
  'Data Science & Machine Learning': 'ডেটা বিজ্ঞান বা data science',
  'History & General Education': 'ইতিহাস বা history',
};

const CATEGORIES = Object.keys(CATEGORY_QUERIES);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const lang = searchParams.get('lang') || 'en';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const maxResults = Math.min(40, Math.max(6, parseInt(searchParams.get('maxResults') || '12', 10)));
    const source = searchParams.get('source') || 'google';

    // Determine search term
    let searchTerm = query;
    if (!searchTerm && category) {
      searchTerm = lang === 'bn'
        ? (CATEGORY_QUERIES_BN[category] || category)
        : (CATEGORY_QUERIES[category] || category);
    }
    if (!searchTerm) {
      return NextResponse.json({
        success: true,
        books: [],
        totalItems: 0,
        categories: CATEGORIES,
        page: 1,
        maxResults,
        message: 'Enter a search query or select a category',
      });
    }

    const cacheKey = `books:${searchTerm}:${lang}:${page}:${maxResults}:${source}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, ...cached as object, categories: CATEGORIES });
    }

    let books: unknown[] = [];
    let totalItems = 0;

    if (source === 'openlibrary' || (!query && lang === 'bn')) {
      // Open Library Search
      const olPage = page;
      const olLimit = maxResults;
      const olLang = lang === 'bn' ? 'bn' : 'eng';
      const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&language=${olLang}&limit=${olLimit}&page=${olPage}&fields=key,title,author_name,subject,cover_i,first_publish_year,edition_count,description,language`;

      const olRes = await fetch(olUrl, {
        headers: { 'User-Agent': 'PU-ALRMS-DigitalLibrary/1.0' },
        signal: AbortSignal.timeout(8000),
      });

      if (olRes.ok) {
        const olData = await olRes.json();
        books = (olData.docs || []).map(normalizeOLBook);
        totalItems = olData.numFound || books.length;
      }
    } else {
      // Google Books API
      const startIndex = (page - 1) * maxResults;
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&startIndex=${startIndex}&maxResults=${maxResults}&langRestrict=${lang === 'bn' ? 'bn' : 'en'}`;
      
      const gbRes = await fetch(gbUrl, {
        signal: AbortSignal.timeout(8000),
      });

      if (gbRes.ok) {
        const gbData = await gbRes.json();
        books = (gbData.items || []).map(normalizeBook);
        totalItems = gbData.totalItems || 0;
      }
    }

    // Filter out books without titles
    books = books.filter((b: any) => b && b.title);

    const result = {
      books,
      totalItems,
      page,
      maxResults,
      query: searchTerm,
      category,
      language: lang,
      source,
    };

    setCache(cacheKey, result);
    return NextResponse.json({ success: true, ...result, categories: CATEGORIES });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Books API Error]', msg);

    // Fallback: try Open Library if Google Books failed
    try {
      const { searchParams } = req.nextUrl;
      const query = searchParams.get('q')?.trim() || '';
      const category = searchParams.get('category') || '';
      const maxResults = Math.min(40, Math.max(6, parseInt(searchParams.get('maxResults') || '12', 10)));
      const fallbackQuery = query || category || 'education';

      const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(fallbackQuery)}&limit=${maxResults}&fields=key,title,author_name,subject,cover_i,first_publish_year,description,language`;
      const olRes = await fetch(olUrl, {
        headers: { 'User-Agent': 'PU-ALRMS-DigitalLibrary/1.0' },
        signal: AbortSignal.timeout(5000),
      });

      if (olRes.ok) {
        const olData = await olRes.json();
        const books = (olData.docs || []).map(normalizeOLBook).filter((b: any) => b.title);
        return NextResponse.json({
          success: true,
          books,
          totalItems: olData.numFound || books.length,
          page: 1,
          maxResults,
          source: 'openlibrary',
          categories: CATEGORIES,
          fallback: true,
        });
      }
    } catch {
      // Both APIs failed
    }

    return NextResponse.json({
      success: false,
      error: msg,
      books: [],
      totalItems: 0,
      categories: CATEGORIES,
      message: 'Unable to fetch books. Please try again later.',
    }, { status: 503 });
  }
}
