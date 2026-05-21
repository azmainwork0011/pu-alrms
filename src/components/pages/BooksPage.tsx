'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';
import {
  Search, BookOpen, Monitor, Wrench, Briefcase,
  Scale, Globe, Brain, History, Star, ExternalLink,
  Download, Loader2, AlertCircle, X, RefreshCw, Library,
  FileText, Maximize2, BookCopy, TrendingUp,
  Clock, Eye, Sparkles, Heart, ChevronRight,
  GraduationCap, Zap, BookMarked, ArrowUpDown,
  Grid3x3, List, Filter,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────
interface LibraryBook {
  id: number;
  title: string;
  author: string;
  description: string;
  category: string;
  subcategory: string | null;
  fileUrl: string;
  coverUrl: string;
  language: string;
  pages: number | null;
  year: number | null;
  publisher: string | null;
  fileSize: string | null;
  fileType: string;
  featured: boolean;
  downloads: number;
  isActive: boolean;
  createdAt: string;
}

interface ExternalBook {
  id: string;
  bookId?: string;
  title: string;
  authors: string;
  description: string;
  categories: string[];
  coverUrl: string | null;
  previewLink: string | null;
  infoLink: string | null;
  language: string;
  pageCount: number | null;
  publishedDate: string | null;
  averageRating: number | null;
  ratingsCount: number;
  subtitle: string | null;
  pdfLink: string | null;
  pdfAvailable: boolean;
  accessViewStatus: string;
  source: 'google' | 'openlibrary';
}

// ─── Constants ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'All', value: '', icon: Library, gradient: 'from-violet-500 to-purple-600', color: 'text-violet-600' },
  { label: 'Computer Science', value: 'CS', icon: Monitor, gradient: 'from-cyan-500 to-blue-600', color: 'text-cyan-600' },
  { label: 'Electrical Eng.', value: 'EE', icon: Wrench, gradient: 'from-amber-500 to-orange-600', color: 'text-amber-600' },
  { label: 'Business Admin', value: 'BA', icon: Briefcase, gradient: 'from-emerald-500 to-green-600', color: 'text-emerald-600' },
  { label: 'Law (LLB)', value: 'LLB', icon: Scale, gradient: 'from-rose-500 to-pink-600', color: 'text-rose-600' },
  { label: 'General', value: 'GEN', icon: Globe, gradient: 'from-stone-500 to-neutral-600', color: 'text-stone-600' },
];

const SUBJECTS = [
  { label: 'All Books', value: '', icon: Library, gradient: 'from-violet-500 to-purple-600' },
  { label: 'Computer Science', value: 'Computer Science', icon: Monitor, gradient: 'from-cyan-500 to-blue-600' },
  { label: 'Electrical Engineering', value: 'Engineering', icon: Wrench, gradient: 'from-amber-500 to-orange-600' },
  { label: 'Business Admin', value: 'Business Administration (BBA)', icon: Briefcase, gradient: 'from-emerald-500 to-green-600' },
  { label: 'Law (LLB)', value: 'Law (LLB)', icon: Scale, gradient: 'from-rose-500 to-pink-600' },
  { label: 'Web & UI/UX', value: 'Web Development & UI/UX Design', icon: Globe, gradient: 'from-teal-500 to-cyan-600' },
  { label: 'Data Science & ML', value: 'Data Science & Machine Learning', icon: Brain, gradient: 'from-indigo-500 to-violet-600' },
  { label: 'History & GenEd', value: 'History & General Education', icon: History, gradient: 'from-stone-500 to-neutral-600' },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest', icon: Clock },
  { label: 'Popular', value: 'popular', icon: TrendingUp },
  { label: 'Title A-Z', value: 'title', icon: ArrowUpDown },
  { label: 'Author A-Z', value: 'author', icon: ArrowUpDown },
];

const MAX_RESULTS = 24;

// ─── Animation Variants ─────────────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
};

const cardFadeIn = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 } },
};

const modalSlideUp = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.15 } },
};

// ─── Category Color Helper ──────────────────────────────────────────────
function getCategoryColor(category: string): string {
  switch (category.toUpperCase()) {
    case 'CS': return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    case 'EE': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'BA': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'LLB': return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    case 'GEN': return 'bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-800';
    default: return 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800';
  }
}

function getCategoryGradient(category: string): string {
  switch (category.toUpperCase()) {
    case 'CS': return 'from-cyan-500 to-blue-600';
    case 'EE': return 'from-amber-500 to-orange-600';
    case 'BA': return 'from-emerald-500 to-green-600';
    case 'LLB': return 'from-rose-500 to-pink-600';
    case 'GEN': return 'from-stone-500 to-neutral-600';
    default: return 'from-violet-500 to-purple-600';
  }
}

// ─── Cover Placeholder ─────────────────────────────────────────────────
function CoverFallback({ category = '' }: { category?: string }) {
  const gradient = getCategoryGradient(category);
  return (
    <div className={`w-full aspect-[3/4] bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-16 h-16 border border-white/30 rounded-lg rotate-12" />
        <div className="absolute bottom-8 right-4 w-12 h-12 border border-white/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rotate-45" />
      </div>
      <BookOpen className="w-8 h-8 text-white/80 relative z-10" />
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────
function BookCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <Skeleton className="w-full aspect-[3/4]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ─── Library Book Card ──────────────────────────────────────────────────
function LibraryBookCard({ book, onClick }: { book: LibraryBook; onClick: () => void }) {
  const catConfig = CATEGORIES.find(c => c.value === book.category);
  const isFeatured = book.featured;

  return (
    <motion.div variants={cardFadeIn} className="group">
      <div
        className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col"
        onClick={onClick}
      >
        {/* Cover */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                el.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={book.coverUrl ? 'hidden' : ''}><CoverFallback category={book.category} /></div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isFeatured && (
              <Badge className="text-[9px] px-1.5 py-0 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm leading-none">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />Featured
              </Badge>
            )}
            {book.fileUrl && (
              <Badge className="text-[9px] px-1.5 py-0 font-medium bg-emerald-500/90 text-white border-0 shadow-sm leading-none">
                <Download className="w-2.5 h-2.5 mr-0.5" />PDF
              </Badge>
            )}
          </div>

          {/* Category dot */}
          <div className="absolute bottom-2 left-2">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryGradient(book.category)}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col min-h-0 gap-1">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{book.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
          <div className="flex items-center gap-2 mt-auto pt-1.5">
            {book.subcategory && (
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border leading-none ${getCategoryColor(book.category)}`}>
                {book.subcategory}
              </Badge>
            )}
            {book.downloads > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                <Download className="w-2.5 h-2.5" />
                {book.downloads}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── External Book Card ─────────────────────────────────────────────────
function ExternalBookCard({
  book,
  isSaved,
  onToggleSave,
  onClick,
}: {
  book: ExternalBook;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, book: ExternalBook) => void;
  onClick: () => void;
}) {
  return (
    <motion.div variants={cardFadeIn} className="group">
      <div
        className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col"
        onClick={onClick}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
          {book.coverUrl ? (
            <img
              src={book.coverUrl} alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                el.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={book.coverUrl ? 'hidden' : ''}>
            <div className="w-full aspect-[3/4] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-cyan-100 dark:from-violet-900/30 dark:via-fuchsia-900/20 dark:to-cyan-900/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.75 }}
            onClick={(e) => onToggleSave(e, book)}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-background transition-colors"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isSaved ? 'saved' : 'unsaved'}
                initial={isSaved ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={isSaved ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}`} />
              </motion.div>
            </AnimatePresence>
          </motion.button>
          <div className="absolute bottom-1.5 left-1.5 flex gap-1">
            {book.pdfAvailable && book.pdfLink && (
              <Badge className="text-[9px] px-1.5 py-0 font-medium bg-emerald-500/90 text-white border-0 shadow-sm leading-none">PDF</Badge>
            )}
            {(book.previewLink || book.infoLink) && !book.pdfAvailable && (
              <Badge className="text-[9px] px-1.5 py-0 font-medium bg-blue-500/90 text-white border-0 shadow-sm leading-none">Preview</Badge>
            )}
          </div>
          <div className="absolute bottom-1.5 right-1.5">
            <div className={`w-2 h-2 rounded-full ${book.source === 'google' ? 'bg-teal-400' : 'bg-orange-400'}`} />
          </div>
        </div>
        <div className="p-3 flex-1 flex flex-col min-h-0 gap-1.5">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{book.title}</h3>
          {book.authors && <p className="text-xs text-muted-foreground line-clamp-1">{book.authors}</p>}
          <div className="flex items-center justify-between mt-auto pt-1">
            {book.averageRating != null && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-muted-foreground">{book.averageRating.toFixed(1)}</span>
              </div>
            )}
            {book.pageCount && <span className="text-[10px] text-muted-foreground">{book.pageCount}p</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Library Book Detail Modal ──────────────────────────────────────────
function LibraryBookDetailModal({
  book,
  open,
  onClose,
  onDownload,
}: {
  book: LibraryBook | null;
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  if (!book) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[calc(100%-0.75rem)] sm:w-full max-h-[92vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
        <motion.div variants={modalSlideUp} initial="hidden" animate="visible" exit="exit" className="relative">
          <button onClick={onClose} className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background active:scale-95 transition-all">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <ScrollArea className="max-h-[92vh]">
            <div className="flex flex-col sm:flex-row">
              {/* Cover */}
              <div className="sm:w-56 shrink-0 bg-muted/50 flex items-center justify-center p-4 pb-2 sm:p-4 sm:pb-4">
                <div className="w-full max-w-[200px] sm:max-w-[180px] aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        el.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={book.coverUrl ? 'hidden' : ''}>
                    <CoverFallback category={book.category} />
                  </div>
                </div>
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0 p-4 pb-5 sm:p-6 space-y-3">
                <DialogHeader className="space-y-1 text-left pr-8">
                  <DialogTitle className="text-lg sm:text-xl font-bold leading-tight line-clamp-2">{book.title}</DialogTitle>
                  <DialogDescription className="text-sm font-medium text-foreground/70">{book.author}</DialogDescription>
                </DialogHeader>

                {book.featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 w-fit">
                    <Sparkles className="w-3 h-3 mr-1" />Featured Book
                  </Badge>
                )}

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={`text-xs border ${getCategoryColor(book.category)}`}>
                    {book.subcategory || book.category}
                  </Badge>
                  {book.language && (
                    <Badge variant="secondary" className="text-xs">{book.language.toUpperCase()}</Badge>
                  )}
                  {book.fileType && (
                    <Badge variant="secondary" className="text-xs">{book.fileType}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  {book.pages && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{book.pages} pages</span>}
                  {book.year && <span className="flex items-center gap-1"><History className="w-3.5 h-3.5" />{book.year}</span>}
                  {book.publisher && <span className="flex items-center gap-1"><BookMarked className="w-3.5 h-3.5" />{book.publisher}</span>}
                  {book.fileSize && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{book.fileSize}</span>}
                  <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" />{book.downloads} downloads</span>
                </div>

                <Separator />
                {book.description && (
                  <div className="max-h-48 overflow-y-auto pr-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
                  </div>
                )}

                <Separator />
                <div className="flex flex-wrap gap-2">
                  {book.fileUrl && (
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-sm shadow-emerald-500/25 gap-2"
                    >
                      {downloading ? <><Loader2 className="w-4 h-4 animate-spin" />Tracking...</> : <><Download className="w-4 h-4" />Download PDF</>}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── External Book Reader Dialog ────────────────────────────────────────
function BookReaderDialog({ book, open, onClose }: { book: ExternalBook | null; open: boolean; onClose: () => void }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  if (!book) return null;

  let embedUrl: string | null = null;
  if (book.source === 'google' && book.infoLink) {
    const match = book.infoLink.match(/[?&]id=([^&]+)/);
    if (match) embedUrl = `https://books.google.com/books?id=${match[1]}&pg=PA1&output=embed`;
  } else if (book.source === 'openlibrary' && book.bookId) {
    embedUrl = `https://openlibrary.org/books/${book.bookId}/embed`;
  }

  const fallbackUrl = book.previewLink || book.infoLink || null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full h-full max-w-none max-h-none translate-x-0 translate-y-0 top-0 left-0 rounded-none border-0 p-0 gap-0 [&>button]:hidden fixed inset-0">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div key="reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full h-full">
              <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-background border-b z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:block w-8 h-11 rounded bg-muted overflow-hidden shrink-0">
                    {book.coverUrl ? <img src={book.coverUrl} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-sm font-semibold truncate pr-4">{book.title}</DialogTitle>
                    <p className="text-xs text-muted-foreground truncate">{book.authors}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {fallbackUrl && (
                    <Button variant="outline" size="sm" onClick={() => window.open(fallbackUrl, '_blank', 'noopener')} className="text-xs gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /><span className="hidden sm:inline">Open externally</span>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={onClose} className="text-xs gap-1"><X className="w-4 h-4" /><span className="hidden sm:inline">Close</span></Button>
                </div>
              </div>
              <div className="flex-1 relative bg-muted/30">
                {embedUrl ? (
                  <>
                    {!iframeLoaded && !iframeError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-3" />
                        <p className="text-sm text-muted-foreground">Loading book reader...</p>
                      </div>
                    )}
                    <iframe key={book.id} src={embedUrl} className={`w-full h-full border-0 ${iframeLoaded ? 'block' : 'hidden'}`} title={`Reading: ${book.title}`} onLoad={() => setIframeLoaded(true)} onError={() => setIframeError(true)} />
                    {iframeError && fallbackUrl && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                        <Button onClick={() => window.open(fallbackUrl, '_blank', 'noopener')} className="gap-2"><ExternalLink className="w-4 h-4" />Open externally</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <BookCopy className="w-10 h-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold mb-2">No embedded preview</h3>
                    {fallbackUrl && (
                      <Button onClick={() => window.open(fallbackUrl, '_blank', 'noopener')} className="gap-2">
                        <ExternalLink className="w-4 h-4" />Open on {book.source === 'google' ? 'Google Books' : 'Open Library'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ─── External Book Detail Modal ─────────────────────────────────────────
function ExternalBookDetailModal({
  book,
  open,
  onClose,
  isSaved,
  onToggleSave,
  onReadOnline,
}: {
  book: ExternalBook | null;
  open: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onReadOnline: () => void;
}) {
  if (!book) return null;

  const canEmbed = book.source === 'google' && book.infoLink
    ? !!book.infoLink.match(/[?&]id=([^&]+)/)
    : book.source === 'openlibrary' && !!book.bookId;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[calc(100%-0.75rem)] sm:w-full max-h-[92vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
        <motion.div variants={modalSlideUp} initial="hidden" animate="visible" exit="exit" className="relative">
          <button onClick={onClose} className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background active:scale-95 transition-all"><X className="w-5 h-5 text-muted-foreground" /></button>
          <ScrollArea className="max-h-[92vh]">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-52 shrink-0 bg-muted/50 flex items-center justify-center p-4 pb-2 sm:p-4">
                <div className="w-full max-w-[160px] aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                  {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full aspect-[2/3] bg-gradient-to-br from-violet-200 via-fuchsia-100 to-cyan-200 dark:from-violet-900/60 dark:via-fuchsia-900/40 dark:to-cyan-900/60 flex items-center justify-center rounded-lg"><BookOpen className="w-10 h-10 text-violet-500" /></div>}
                </div>
              </div>
              <div className="flex-1 min-w-0 p-4 pb-5 sm:p-6 space-y-3">
                <DialogHeader className="space-y-1 text-left pr-8">
                  <DialogTitle className="text-lg sm:text-xl font-bold leading-tight line-clamp-2">{book.title}</DialogTitle>
                  {book.subtitle && <DialogDescription className="text-sm italic">{book.subtitle}</DialogDescription>}
                  {book.authors && <p className="text-sm font-medium text-foreground/70">by {book.authors}</p>}
                </DialogHeader>

                {book.averageRating != null && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(book.averageRating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{book.averageRating.toFixed(1)}</span>
                    {book.ratingsCount > 0 && <span className="text-xs text-muted-foreground">({book.ratingsCount.toLocaleString()})</span>}
                  </div>
                )}

                {book.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {book.categories.map((cat) => (<Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>))}
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  {book.language && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{book.language}</span>}
                  {book.pageCount && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{book.pageCount} pages</span>}
                  {book.publishedDate && <span className="flex items-center gap-1"><History className="w-3.5 h-3.5" />{book.publishedDate}</span>}
                  <span className="flex items-center gap-1"><Library className="w-3.5 h-3.5" />{book.source === 'google' ? 'Google Books' : 'Open Library'}</span>
                </div>

                <Separator />
                {book.description && (
                  <div className="max-h-48 overflow-y-auto pr-1">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{book.description.length > 1000 ? book.description.slice(0, 1000) + '...' : book.description}</p>
                  </div>
                )}

                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button variant={isSaved ? 'default' : 'outline'} size="sm" onClick={onToggleSave} className={isSaved ? 'bg-rose-500 hover:bg-rose-600 text-white border-0' : ''}>
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />{isSaved ? 'Saved' : 'Save'}
                  </Button>
                  {(book.previewLink || book.infoLink) && (
                    <Button variant="outline" size="sm" onClick={onReadOnline} className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 gap-1.5">
                      {canEmbed ? <><Maximize2 className="w-4 h-4" />Read Now</> : <><ExternalLink className="w-3.5 h-3.5" />Read Online</>}
                    </Button>
                  )}
                  {book.pdfAvailable && book.pdfLink && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={book.pdfLink} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" />Download PDF</a>
                    </Button>
                  )}
                  {book.infoLink && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={book.infoLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /><span className="hidden sm:inline">View on </span>{book.source === 'google' ? 'Google Books' : 'Open Library'}</a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Welcome State ──────────────────────────────────────────────────────
function WelcomeState({ onCategoryClick, tab }: { onCategoryClick: (cat: string) => void; tab: 'university' | 'online' }) {
  const cats = tab === 'university'
    ? CATEGORIES.filter(c => c.value !== '')
    : SUBJECTS.filter(c => c.value !== '');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center py-8 sm:py-14 text-center">
      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="mb-5">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tab === 'university' ? 'from-violet-500 to-purple-600' : 'from-cyan-500 to-blue-600'} flex items-center justify-center shadow-lg ${tab === 'university' ? 'shadow-violet-500/25' : 'shadow-cyan-500/25'}`}>
          {tab === 'university' ? <GraduationCap className="w-8 h-8 text-white" /> : <Globe className="w-8 h-8 text-white" />}
        </div>
      </motion.div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1.5">
        {tab === 'university' ? 'University Library' : 'Online Book Search'}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6 px-4">
        {tab === 'university'
          ? 'Browse textbooks and reference materials curated for your courses.'
          : 'Search millions of books from Google Books and Open Library.'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 px-4 max-w-2xl w-full">
        {cats.map((cat) => (
          <motion.button key={cat.value} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => onCategoryClick(cat.value)} className="flex items-center gap-2 px-3 py-3 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-xs font-medium text-muted-foreground hover:text-foreground">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0 shadow-sm`}><cat.icon className="w-4 h-4 text-white" /></div>
            <span className="truncate text-left">{cat.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Featured Books Carousel ────────────────────────────────────────────
function FeaturedCarousel({ books, onSelect }: { books: LibraryBook[]; onSelect: (b: LibraryBook) => void }) {
  if (books.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Featured Books</h3>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {books.map((book) => (
            <motion.div
              key={book.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 w-32 cursor-pointer group"
              onClick={() => onSelect(book)}
            >
              <div className="w-32 aspect-[3/4] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow mb-2">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : <CoverFallback category={book.category} />}
              </div>
              <h4 className="text-xs font-semibold line-clamp-1">{book.title}</h4>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{book.author}</p>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Empty Results ──────────────────────────────────────────────────────
function EmptyResults({ query }: { query: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3"><Search className="w-6 h-6 text-muted-foreground" /></div>
      <h3 className="text-sm font-semibold mb-1">No books found</h3>
      <p className="text-xs text-muted-foreground max-w-xs px-4">{query ? `No results for "${query}". Try different keywords.` : 'No books found in this category.'}</p>
    </motion.div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3"><AlertCircle className="w-6 h-6 text-destructive" /></div>
      <h3 className="text-sm font-semibold mb-1">Something went wrong</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-4 px-4">{message}</p>
      <Button variant="outline" onClick={onRetry} className="gap-1.5 text-xs h-9"><RefreshCw className="w-3.5 h-3.5" />Try Again</Button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function BooksPage() {
  const { token } = useAppStore();
  const { toast } = useToast();

  // ─── Tab State ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'university' | 'online'>('university');

  // ─── University Library State ────────────────────────────────────
  const [libBooks, setLibBooks] = useState<LibraryBook[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libError, setLibError] = useState<string | null>(null);
  const [libSearch, setLibSearch] = useState('');
  const [libDebouncedSearch, setLibDebouncedSearch] = useState('');
  const [libCategory, setLibCategory] = useState('');
  const [libSort, setLibSort] = useState('newest');
  const [libTotal, setLibTotal] = useState(0);
  const [libPage, setLibPage] = useState(1);
  const [libHasMore, setLibHasMore] = useState(false);
  const [featuredBooks, setFeaturedBooks] = useState<LibraryBook[]>([]);
  const [selectedLibBook, setSelectedLibBook] = useState<LibraryBook | null>(null);
  const [libModalOpen, setLibModalOpen] = useState(false);
  const [libHasSearched, setLibHasSearched] = useState(false);

  // ─── Online Search State ─────────────────────────────────────────
  const [extBooks, setExtBooks] = useState<ExternalBook[]>([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState<string | null>(null);
  const [extQuery, setExtQuery] = useState('');
  const [extDebouncedQuery, setExtDebouncedQuery] = useState('');
  const [extCategory, setExtCategory] = useState('');
  const [extTotal, setExtTotal] = useState(0);
  const [extPage, setExtPage] = useState(1);
  const [extHasMore, setExtHasMore] = useState(false);
  const [extHasSearched, setExtHasSearched] = useState(false);
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const [selectedExtBook, setSelectedExtBook] = useState<ExternalBook | null>(null);
  const [extModalOpen, setExtModalOpen] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<ExternalBook | null>(null);

  // ─── Refs ───────────────────────────────────────────────────────
  const libDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extAbortRef = useRef<AbortController | null>(null);

  // ─── Fetch Featured Books ────────────────────────────────────────
  const fetchFeatured = useCallback(async () => {
    try {
      const res = await fetch('/api/library/books?featured=true&limit=10');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setFeaturedBooks(data.books || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchFeatured(); }, [fetchFeatured]);

  // ─── Fetch Library Books ─────────────────────────────────────────
  const fetchLibBooks = useCallback(async (search: string, category: string, sort: string, page: number, append: boolean) => {
    if (!append) { setLibLoading(true); setLibError(null); }

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      params.append('sort', sort);
      params.append('page', String(page));
      params.append('limit', '24');

      const res = await fetch(`/api/library/books?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch books');

      if (append) {
        setLibBooks(prev => [...prev, ...data.books]);
      } else {
        setLibBooks(data.books);
      }
      setLibTotal(data.total);
      setLibPage(page);
      setLibHasMore(data.books.length >= 24);
      setLibHasSearched(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch books';
      setLibError(msg);
    } finally {
      setLibLoading(false);
    }
  }, []);

  // ─── Lib Debounce ───────────────────────────────────────────────
  useEffect(() => {
    libDebounceRef.current = setTimeout(() => setLibDebouncedSearch(libSearch), 300);
    return () => { if (libDebounceRef.current) clearTimeout(libDebounceRef.current); };
  }, [libSearch]);

  // ─── Lib Auto-search ────────────────────────────────────────────
  useEffect(() => {
    if (libDebouncedSearch || libCategory || libHasSearched) {
      setLibPage(1);
      fetchLibBooks(libDebouncedSearch, libCategory, libSort, 1, false);
    }
  }, [libDebouncedSearch, libCategory, libSort]);

  // ─── Fetch External Books ────────────────────────────────────────
  const fetchExtBooks = useCallback(async (q: string, category: string, pageNum: number, append: boolean) => {
    extAbortRef.current?.abort();
    extAbortRef.current = new AbortController();

    if (!append) { setExtLoading(true); setExtError(null); }

    try {
      const params = new URLSearchParams({ q: q || '', category, lang: 'en', page: String(pageNum), maxResults: String(MAX_RESULTS) });
      const res = await fetch(`/api/books/search?${params.toString()}`, { signal: extAbortRef.current.signal });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Search failed');

      if (append) {
        setExtBooks(prev => [...prev, ...data.books]);
      } else {
        setExtBooks(data.books);
      }
      setExtTotal(data.totalItems || 0);
      setExtPage(pageNum);
      setExtHasMore(data.books?.length >= MAX_RESULTS);
      setExtHasSearched(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setExtError(err.message || 'Search failed');
      }
    } finally {
      setExtLoading(false);
    }
  }, []);

  // ─── Fetch Saved Book IDs ────────────────────────────────────────
  const fetchSavedBookIds = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/books/saved', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.books)) {
          const ids = new Set<string>();
          data.books.forEach((b: ExternalBook) => { ids.add(b.bookId || b.id); });
          setSavedBookIds(ids);
        }
      }
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchSavedBookIds(); }, [fetchSavedBookIds]);

  // ─── Ext Debounce ───────────────────────────────────────────────
  useEffect(() => {
    extDebounceRef.current = setTimeout(() => setExtDebouncedQuery(extQuery), 300);
    return () => { if (extDebounceRef.current) clearTimeout(extDebounceRef.current); };
  }, [extQuery]);

  // ─── Ext Auto-search ────────────────────────────────────────────
  useEffect(() => {
    if (extDebouncedQuery || extCategory || extHasSearched) {
      setExtPage(1);
      fetchExtBooks(extDebouncedQuery, extCategory, 1, false);
    }
  }, [extDebouncedQuery, extCategory]);

  // ─── Handle Toggle Save ─────────────────────────────────────────
  const handleToggleSave = useCallback(async (e: React.MouseEvent, book: ExternalBook) => {
    e.stopPropagation();
    if (!token) { toast({ title: 'Login required', description: 'Please sign in to save books.' }); return; }
    const bookId = book.bookId || book.id;
    const wasSaved = savedBookIds.has(bookId);

    setSavedBookIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(bookId); else next.add(bookId);
      return next;
    });

    try {
      if (wasSaved) {
        const res = await fetch(`/api/books/saved?bookId=${bookId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        toast({ title: 'Removed', description: `"${book.title}" removed from saved.` });
      } else {
        const res = await fetch('/api/books/saved', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ bookId: book.id, title: book.title, authors: book.authors, coverUrl: book.coverUrl, category: book.categories?.[0] || '', language: book.language, description: book.description?.slice(0, 500), infoLink: book.infoLink, pdfLink: book.pdfLink }) });
        if (!res.ok) throw new Error();
        toast({ title: 'Saved!', description: `"${book.title}" saved to your library.` });
      }
    } catch {
      setSavedBookIds(prev => { const next = new Set(prev); if (wasSaved) next.add(bookId); else next.delete(bookId); return next; });
      toast({ title: 'Error', description: 'Failed to update saved books.', variant: 'destructive' });
    }
  }, [token, savedBookIds, toast]);

  // ─── Handle Library Book Download ────────────────────────────────
  const handleLibDownload = useCallback(async () => {
    if (!selectedLibBook) return;
    try {
      const res = await fetch(`/api/library/books/${selectedLibBook.id}/download`);
      const data = await res.json();
      if (data.success && data.book?.fileUrl) {
        window.open(data.book.fileUrl, '_blank', 'noopener');
        toast({ title: 'Download started', description: `"${selectedLibBook.title}" is downloading.` });
        // Update download count locally
        setLibBooks(prev => prev.map(b => b.id === selectedLibBook.id ? { ...b, downloads: b.downloads + 1 } : b));
        setFeaturedBooks(prev => prev.map(b => b.id === selectedLibBook.id ? { ...b, downloads: b.downloads + 1 } : b));
      } else {
        toast({ title: 'Download unavailable', description: 'This book does not have a downloadable file yet.', variant: 'default' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to track download.', variant: 'destructive' });
    }
  }, [selectedLibBook, toast]);

  // ─── Load More Handlers ─────────────────────────────────────────
  const loadMoreLib = useCallback(() => {
    fetchLibBooks(libDebouncedSearch, libCategory, libSort, libPage + 1, true);
  }, [libDebouncedSearch, libCategory, libSort, libPage, fetchLibBooks]);

  const loadMoreExt = useCallback(() => {
    fetchExtBooks(extDebouncedQuery, extCategory, extPage + 1, true);
  }, [extDebouncedQuery, extCategory, extPage, fetchExtBooks]);

  // ─── Clear Handlers ─────────────────────────────────────────────
  const clearLibSearch = useCallback(() => {
    setLibSearch('');
    setLibDebouncedSearch('');
    setLibCategory('');
    setLibBooks([]);
    setLibTotal(0);
    setLibHasSearched(false);
  }, []);

  const clearExtSearch = useCallback(() => {
    setExtQuery('');
    setExtDebouncedQuery('');
    setExtCategory('');
    setExtBooks([]);
    setExtTotal(0);
    setExtHasSearched(false);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-0 sm:min-h-[calc(100vh-8rem)] flex flex-col">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Library className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              Digital Library
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {activeTab === 'university'
                ? `${libTotal > 0 ? `${libTotal} books available` : 'Browse university textbooks'}`
                : `${extTotal > 0 ? `${extTotal.toLocaleString()} books found` : 'Search millions of books online'}`}
            </p>
          </div>
        </div>

        {/* ─── Tab Switcher ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl mb-4 w-fit">
          <button
            onClick={() => setActiveTab('university')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'university'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>University Library</span>
            {libTotal > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-1">{libTotal}</Badge>}
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'online'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Online Search</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════
            UNIVERSITY LIBRARY TAB
            ═══════════════════════════════════════════════════════ */}
        {activeTab === 'university' && (
          <>
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" pointerEvents="false" />
              <Input
                type="text"
                placeholder="Search university books by title, author, or subject..."
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="h-11 pl-10 pr-10 bg-card border-border rounded-xl text-sm"
              />
              {(libSearch || libDebouncedSearch) && (
                <button onClick={clearLibSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="relative mb-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {CATEGORIES.map((cat) => {
                  const isActive = libCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => { setLibCategory(cat.value); setLibSearch(''); setLibDebouncedSearch(''); }}
                      className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort + Clear */}
            <div className="flex items-center gap-2 mb-4">
              {libHasSearched && (
                <Button variant="ghost" size="sm" onClick={clearLibSearch} className="text-xs text-muted-foreground gap-1 h-8">
                  <RefreshCw className="w-3 h-3" />Clear
                </Button>
              )}
              <div className="ml-auto flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">Sort:</span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLibSort(opt.value)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      libSort === opt.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Carousel (shown when no search active) */}
            {!libHasSearched && featuredBooks.length > 0 && (
              <FeaturedCarousel
                books={featuredBooks}
                onSelect={(b) => { setSelectedLibBook(b); setLibModalOpen(true); }}
              />
            )}

            {/* Content */}
            {libLoading && libBooks.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => <BookCardSkeleton key={i} />)}
              </div>
            )}

            {libError && !libLoading && libBooks.length === 0 && (
              <ErrorState message={libError} onRetry={() => fetchLibBooks(libDebouncedSearch, libCategory, libSort, 1, false)} />
            )}

            {!libHasSearched && !libLoading && !libError && libBooks.length === 0 && featuredBooks.length === 0 && (
              <WelcomeState tab="university" onCategoryClick={(c) => { setLibCategory(c); setLibSearch(''); }} />
            )}

            {!libHasSearched && !libLoading && featuredBooks.length > 0 && libBooks.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                <p className="text-xs text-muted-foreground">Browse by category or search for books above</p>
              </motion.div>
            )}

            {libHasSearched && !libLoading && !libError && libBooks.length === 0 && (
              <EmptyResults query={libDebouncedSearch || libCategory} />
            )}

            {libBooks.length > 0 && (
              <>
                <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" variants={staggerContainer} initial="hidden" animate="visible">
                  {libBooks.map((book) => (
                    <LibraryBookCard
                      key={book.id}
                      book={book}
                      onClick={() => { setSelectedLibBook(book); setLibModalOpen(true); }}
                    />
                  ))}
                </motion.div>
                {libHasMore && (
                  <div className="flex justify-center mt-6 mb-4">
                    <Button variant="outline" onClick={loadMoreLib} disabled={libLoading} className="gap-2 min-w-[200px]">
                      {libLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</> : <><BookOpen className="w-4 h-4" />Load More</>}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            ONLINE SEARCH TAB
            ═══════════════════════════════════════════════════════ */}
        {activeTab === 'online' && (
          <>
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" pointerEvents="false" />
              <Input
                type="text"
                placeholder="Search by title or author..."
                value={extQuery}
                onChange={(e) => setExtQuery(e.target.value)}
                className="h-11 pl-10 pr-10 bg-card border-border rounded-xl text-sm"
              />
              {(extQuery || extDebouncedQuery) && (
                <button onClick={clearExtSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="relative mb-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {SUBJECTS.map((cat) => {
                  const isActive = extCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => { setExtCategory(cat.value); setExtQuery(''); setExtDebouncedQuery(''); }}
                      className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {extHasSearched && (
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={clearExtSearch} className="text-xs text-muted-foreground gap-1 h-8">
                  <RefreshCw className="w-3 h-3" />Clear
                </Button>
              </div>
            )}

            {/* Content */}
            {extLoading && extBooks.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => <BookCardSkeleton key={i} />)}
              </div>
            )}

            {extError && !extLoading && extBooks.length === 0 && (
              <ErrorState message={extError} onRetry={() => fetchExtBooks(extDebouncedQuery, extCategory, 1, false)} />
            )}

            {!extHasSearched && !extLoading && !extError && extBooks.length === 0 && (
              <WelcomeState tab="online" onCategoryClick={(c) => { setExtCategory(c); setExtQuery(''); }} />
            )}

            {extHasSearched && !extLoading && !extError && extBooks.length === 0 && (
              <EmptyResults query={extDebouncedQuery || extCategory} />
            )}

            {extBooks.length > 0 && (
              <>
                <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" variants={staggerContainer} initial="hidden" animate="visible">
                  {extBooks.map((book) => (
                    <ExternalBookCard
                      key={book.id}
                      book={book}
                      isSaved={savedBookIds.has(book.bookId || book.id)}
                      onToggleSave={handleToggleSave}
                      onClick={() => { setSelectedExtBook(book); setExtModalOpen(true); }}
                    />
                  ))}
                </motion.div>
                {extHasMore && (
                  <div className="flex justify-center mt-6 mb-4">
                    <Button variant="outline" onClick={loadMoreExt} disabled={extLoading} className="gap-2 min-w-[200px]">
                      {extLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</> : <><BookOpen className="w-4 h-4" />Load More Books</>}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ─── Library Book Detail Modal ───────────────────────────── */}
      <LibraryBookDetailModal
        book={selectedLibBook}
        open={libModalOpen}
        onClose={() => setLibModalOpen(false)}
        onDownload={handleLibDownload}
      />

      {/* ─── External Book Detail Modal ──────────────────────────── */}
      <ExternalBookDetailModal
        book={selectedExtBook}
        open={extModalOpen}
        onClose={() => setExtModalOpen(false)}
        isSaved={selectedExtBook ? savedBookIds.has(selectedExtBook.bookId || selectedExtBook.id) : false}
        onToggleSave={() => selectedExtBook && handleToggleSave({ stopPropagation: () => {} } as React.MouseEvent, selectedExtBook)}
        onReadOnline={() => {
          if (selectedExtBook) {
            setReaderBook(selectedExtBook);
            setReaderOpen(true);
            setExtModalOpen(false);
          }
        }}
      />

      {/* ─── External Book Reader ────────────────────────────────── */}
      <BookReaderDialog
        book={readerBook}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
      />
    </div>
  );
}
