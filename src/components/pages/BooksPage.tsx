'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/tooltip';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';
import {
  Search, BookOpen, Heart, Monitor, Scale, Briefcase,
  Wrench, Globe, Brain, History, Star, ExternalLink,
  Download, Loader2, AlertCircle, X, RefreshCw, Library,
  FileText, Maximize2, BookCopy, ChevronDown, TrendingUp,
  Filter, Clock, Eye, BookmarkPlus, Sparkles, BookMarked,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────
interface Book {
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

const MAX_RESULTS = 24;

// ─── Helpers ────────────────────────────────────────────────────────────
function getGoogleEmbedUrl(book: Book): string | null {
  if (book.infoLink) {
    const match = book.infoLink.match(/[?&]id=([^&]+)/);
    if (match) {
      const hl = book.language === 'bn' ? 'bn' : 'en';
      return `https://books.google.com/books?id=${match[1]}&pg=PA1&hl=${hl}&output=embed`;
    }
  }
  if (book.bookId && book.source === 'google') {
    const hl = book.language === 'bn' ? 'bn' : 'en';
    return `https://books.google.com/books?id=${book.bookId}&pg=PA1&hl=${hl}&output=embed`;
  }
  return null;
}

function getOpenLibraryEmbedUrl(book: Book): string | null {
  if (book.source === 'openlibrary' && book.bookId) {
    return `https://openlibrary.org/books/${book.bookId}/embed`;
  }
  return null;
}

function getEmbedUrl(book: Book): string | null {
  if (book.source === 'google') return getGoogleEmbedUrl(book);
  if (book.source === 'openlibrary') return getOpenLibraryEmbedUrl(book);
  return null;
}

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

// ─── Star Rating ────────────────────────────────────────────────────────
function StarRating({ rating, count, size = 'sm' }: { rating: number | null; count?: number; size?: 'sm' | 'md' }) {
  if (rating == null) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`${iconSize} ${i < fullStars ? 'text-amber-400 fill-amber-400' : i === fullStars && hasHalf ? 'text-amber-400 fill-amber-200' : 'text-gray-300 dark:text-gray-600'}`} />
        ))}
      </div>
      {count != null && count > 0 && <span className="text-[10px] text-gray-400 ml-0.5">({count.toLocaleString()})</span>}
    </div>
  );
}

// ─── Book Cover Fallback ────────────────────────────────────────────────
function BookCoverFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full aspect-[3/4] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-cyan-100 dark:from-violet-900/30 dark:via-fuchsia-900/20 dark:to-cyan-900/20 flex items-center justify-center ${className}`}>
      <BookOpen className="w-6 h-6 text-violet-400 dark:text-violet-500" />
    </div>
  );
}

// ─── Book Card Skeleton ─────────────────────────────────────────────────
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

// ─── Book Card ──────────────────────────────────────────────────────────
function BookCard({ book, isSaved, onToggleSave, onClick }: { book: Book; isSaved: boolean; onToggleSave: (e: React.MouseEvent, book: Book) => void; onClick: () => void }) {
  return (
    <motion.div variants={cardFadeIn} className="group">
      <div
        className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col"
        onClick={onClick}
      >
        {/* Cover */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
          {book.coverUrl ? (
            <img
              src={book.coverUrl} alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
            />
          ) : null}
          <div className={book.coverUrl ? 'hidden' : ''}><BookCoverFallback /></div>

          {/* Save button */}
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

          {/* Badges */}
          <div className="absolute bottom-1.5 left-1.5 flex gap-1">
            {book.pdfAvailable && book.pdfLink && (
              <Badge className="text-[9px] px-1.5 py-0 font-medium bg-emerald-500/90 text-white border-0 shadow-sm leading-none">PDF</Badge>
            )}
            {(book.previewLink || book.infoLink) && !book.pdfAvailable && (
              <Badge className="text-[9px] px-1.5 py-0 font-medium bg-blue-500/90 text-white border-0 shadow-sm leading-none">Preview</Badge>
            )}
          </div>

          {/* Source dot */}
          <div className="absolute bottom-1.5 right-1.5">
            <div className={`w-2 h-2 rounded-full ${book.source === 'google' ? 'bg-teal-400' : 'bg-orange-400'}`} title={book.source === 'google' ? 'Google Books' : 'Open Library'} />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col min-h-0 gap-1.5">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{book.title}</h3>
          {book.authors && <p className="text-xs text-muted-foreground line-clamp-1">{book.authors}</p>}
          <div className="flex items-center justify-between mt-auto pt-1">
            <StarRating rating={book.averageRating} size="sm" />
            {book.pageCount && <span className="text-[10px] text-muted-foreground">{book.pageCount}p</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Book Reader Dialog ─────────────────────────────────────────────────
function BookReaderDialog({ book, open, onClose }: { book: Book | null; open: boolean; onClose: () => void }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const embedUrl = book ? getEmbedUrl(book) : null;
  if (!book) return null;
  const fallbackUrl = book.previewLink || book.infoLink || null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full h-full max-w-none max-h-none translate-x-0 translate-y-0 top-0 left-0 rounded-none border-0 p-0 gap-0 [&>button]:hidden sm:rounded-none fixed inset-0">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="reader-content"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col w-full h-full"
            >
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between px-3 py-2 sm:px-4 bg-background border-b z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:block w-8 h-11 rounded bg-muted overflow-hidden shrink-0">
                    {book.coverUrl ? <img src={book.coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-violet-200 to-fuchsia-200 flex items-center justify-center"><BookOpen className="w-3 h-3 text-violet-600" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-sm font-semibold truncate pr-4">{book.title}</DialogTitle>
                    {book.authors && <p className="text-xs text-muted-foreground truncate">{book.authors}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {fallbackUrl && (
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 sm:h-8 sm:w-auto sm:px-2.5 text-xs gap-1.5 p-0 sm:p-0" onClick={() => window.open(fallbackUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">Open in new tab</span></Button></TooltipTrigger><TooltipContent>Open in a new browser tab</TooltipContent></Tooltip>
                  )}
                  <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 sm:h-8 sm:w-auto sm:px-3 text-xs gap-1.5 p-0 sm:p-0"><X className="w-5 h-5 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">Close</span></Button>
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 relative bg-muted/30 overflow-hidden">
                {embedUrl ? (
                  <>
                    {!iframeLoaded && !iframeError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="mb-4"><BookOpen className="w-10 h-10 text-violet-500" /></motion.div>
                        <p className="text-sm font-medium text-muted-foreground">Loading book reader...</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">This may take a moment</p>
                      </div>
                    )}
                    <iframe key={book.id} src={embedUrl} className={`w-full h-full border-0 ${iframeLoaded ? 'block' : 'hidden'}`} title={`Reading: ${book.title}`} sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation" allow="autoplay; encrypted-media" onLoad={() => setIframeLoaded(true)} onError={() => setIframeError(true)} />
                    {iframeError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-lg font-semibold mb-2">Reader unavailable</h3>
                        <p className="text-sm text-muted-foreground max-w-sm text-center mb-4">This book&apos;s preview could not be loaded.</p>
                        {fallbackUrl && <Button onClick={() => window.open(fallbackUrl, '_blank', 'noopener,noreferrer')} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><ExternalLink className="w-4 h-4" />Open externally</Button>}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><BookCopy className="w-8 h-8 text-muted-foreground" /></div>
                    <h3 className="text-lg font-semibold mb-2">No embedded preview available</h3>
                    <p className="text-sm text-muted-foreground max-w-sm text-center mb-4">This book doesn&apos;t have an embedded reader. Try opening it externally.</p>
                    {fallbackUrl && <Button onClick={() => window.open(fallbackUrl, '_blank', 'noopener,noreferrer')} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><ExternalLink className="w-4 h-4" />Open on {book.source === 'google' ? 'Google Books' : 'Open Library'}</Button>}
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

// ─── Book Detail Modal ──────────────────────────────────────────────────
function BookDetailModal({ book, open, onClose, isSaved, onToggleSave, onReadOnline }: { book: Book | null; open: boolean; onClose: () => void; isSaved: boolean; onToggleSave: () => void; onReadOnline: () => void }) {
  if (!book) return null;
  const canEmbed = !!getEmbedUrl(book);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[calc(100%-0.75rem)] sm:w-full max-h-[92vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
        <motion.div variants={modalSlideUp} initial="hidden" animate="visible" exit="exit" className="relative">
          <button onClick={onClose} className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background active:scale-95 transition-all"><X className="w-5 h-5 text-muted-foreground" /></button>
          <ScrollArea className="max-h-[92vh]">
            <div className="flex flex-col sm:flex-row">
              {/* Cover */}
              <div className="sm:w-52 shrink-0 bg-muted/50 flex items-center justify-center p-4 pb-2 sm:p-4 sm:pb-4">
                <div className="w-full max-w-[180px] sm:max-w-[160px] aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                  {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} /> : null}
                  <div className={book.coverUrl ? 'hidden' : ''}><div className="w-full aspect-[2/3] bg-gradient-to-br from-violet-200 via-fuchsia-100 to-cyan-200 dark:from-violet-900/60 dark:via-fuchsia-900/40 dark:to-cyan-900/60 flex items-center justify-center rounded-lg"><BookOpen className="w-10 h-10 text-violet-500" /></div></div>
                </div>
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0 p-4 pb-5 sm:p-6 space-y-3">
                <DialogHeader className="space-y-1 text-left pr-8">
                  <DialogTitle className="text-lg sm:text-xl font-bold leading-tight line-clamp-2">{book.title}</DialogTitle>
                  {book.subtitle && <DialogDescription className="text-sm text-muted-foreground italic">{book.subtitle}</DialogDescription>}
                  {book.authors && <p className="text-sm text-muted-foreground font-medium">by {book.authors}</p>}
                </DialogHeader>

                {book.averageRating != null && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={book.averageRating} count={book.ratingsCount} size="md" />
                    <span className="text-sm font-semibold text-foreground">{book.averageRating.toFixed(1)}</span>
                  </div>
                )}

                {book.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {book.categories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                    ))}
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
                <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <Button variant={isSaved ? 'default' : 'outline'} size="sm" onClick={onToggleSave} className={isSaved ? 'bg-rose-500 hover:bg-rose-600 text-white border-0' : ''}><Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />{isSaved ? 'Saved' : 'Save'}</Button>
                  {(book.previewLink || book.infoLink) && (
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={onReadOnline} className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 gap-1.5">{canEmbed ? <><Maximize2 className="w-4 h-4" />Read Now</> : <><ExternalLink className="w-3.5 h-3.5" />Read Online</>}</Button></TooltipTrigger><TooltipContent>{canEmbed ? 'Read inside the app' : 'Open in a new tab'}</TooltipContent></Tooltip>
                  )}
                  <Tooltip><TooltipTrigger asChild><span className="inline-block shrink-0"><Button variant="outline" size="sm" disabled={!book.pdfAvailable || !book.pdfLink} asChild={book.pdfAvailable && book.pdfLink ? true : false}>{book.pdfAvailable && book.pdfLink ? <a href={book.pdfLink} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /><span className="hidden xs:inline">Download</span> PDF</a> : <><Download className="w-4 h-4" />No PDF</>}</Button></span></TooltipTrigger>{!book.pdfAvailable && <TooltipContent>PDF not available</TooltipContent>}</Tooltip>
                  {book.infoLink && <Button variant="ghost" size="sm" asChild><a href={book.infoLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /><span className="hidden sm:inline">View on </span>{book.source === 'google' ? 'Google Books' : 'Open Library'}</a></Button>}
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
function WelcomeState({ onCategoryClick }: { onCategoryClick: (cat: string) => void }) {
  const allCats = SUBJECTS.filter(c => c.value !== '');
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25"><Library className="w-8 h-8 text-white" /></div>
      </motion.div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1.5">Digital Library</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6 px-4">Search books, browse by subject, save your favorites, and read online.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 px-4 max-w-2xl w-full">
        {allCats.map((cat) => (
          <motion.button key={cat.value} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => onCategoryClick(cat.value)} className="flex items-center gap-2 px-3 py-3 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-xs font-medium text-muted-foreground hover:text-foreground">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0 shadow-sm`}><cat.icon className="w-4 h-4 text-white" /></div>
            <span className="truncate text-left">{cat.label}</span>
          </motion.button>
        ))}
      </div>
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

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function BooksPage() {
  const { token } = useAppStore();
  const { toast } = useToast();

  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<Book | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isSavedTab = activeCategory === '__saved__';

  // ─── Fetch Saved Book IDs ───────────────────────────────────────────
  const fetchSavedBooks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/books/saved', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.books)) {
          const ids = new Set<string>();
          data.books.forEach((b: Book) => { ids.add(b.bookId || b.id); });
          setSavedBookIds(ids);
        }
      }
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchSavedBooks(); }, [fetchSavedBooks]);

  // ─── Debounce Query ───────────────────────────────────────────────
  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [query]);

  // ─── Auto-search when category changes ─────────────────────────
  useEffect(() => {
    if (isSavedTab) {
      fetchSavedBooksContent();
      return;
    }
    if (debouncedQuery || activeCategory || hasSearched) {
      setPage(1);
      fetchBooks(debouncedQuery, activeCategory, 'en', 1, false);
    }
  }, [debouncedQuery, activeCategory]);

  // ─── Fetch Books ─────────────────────────────────────────────────
  const fetchBooks = useCallback(async (q: string, category: string, lang: string, pageNum: number, append: boolean) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (!append) { setLoading(true); setError(null); } else { setLoadingMore(true); }
    try {
      const params = new URLSearchParams({ q: q || '', category, lang, page: String(pageNum), maxResults: String(MAX_RESULTS) });
      const res = await fetch(`/api/books/search?${params.toString()}`, { signal: abortRef.current.signal });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Search failed');
      if (append) {
        setBooks(prev => [...prev, ...data.books]);
      } else {
        setBooks(data.books);
      }
      setTotalItems(data.totalItems || 0);
      setHasMore(data.books?.length >= MAX_RESULTS);
      setPage(pageNum);
      setHasSearched(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message || 'Failed to search books. Please try again.');
    } finally { setLoading(false); setLoadingMore(false); }
  }, []);

  // ─── Fetch Saved Books Content ───────────────────────────────────────
  const fetchSavedBooksContent = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/books/saved', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load saved books');
      const data = await res.json();
      if (data.success && Array.isArray(data.books)) {
        setBooks(data.books);
        setTotalItems(data.books.length);
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load saved books.');
    } finally { setLoading(false); }
  }, [token]);

  // ─── Load More ───────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    fetchBooks(debouncedQuery, activeCategory, 'en', page + 1, true);
  }, [debouncedQuery, activeCategory, page, fetchBooks]);

  // ─── Handle Save Toggle ─────────────────────────────────────────────
  const handleToggleSave = useCallback(async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    if (!token) { toast({ title: 'Login required', description: 'Please sign in to save books.', variant: 'default' }); return; }
    const bookId = book.bookId || book.id;
    const wasSaved = savedBookIds.has(bookId);

    // Optimistic update
    setSavedBookIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(bookId); else next.add(bookId);
      return next;
    });

    try {
      if (wasSaved) {
        const res = await fetch(`/api/books/saved?bookId=${bookId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        toast({ title: 'Removed', description: `"${book.title}" removed from saved.`, variant: 'default' });
      } else {
        const res = await fetch('/api/books/saved', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ bookId: book.id, title: book.title, authors: book.authors, coverUrl: book.coverUrl, category: book.categories?.[0] || '', language: book.language, description: book.description?.slice(0, 500), infoLink: book.infoLink, pdfLink: book.pdfLink }) });
        if (!res.ok) throw new Error();
        toast({ title: 'Saved!', description: `"${book.title}" saved to your library.`, variant: 'default' });
      }
    } catch {
      // Revert
      setSavedBookIds(prev => { const next = new Set(prev); if (wasSaved) next.add(bookId); else next.delete(bookId); return next; });
      toast({ title: 'Error', description: 'Failed to update saved books.', variant: 'destructive' });
    }
  }, [token, savedBookIds]);

  // ─── Handle Read Online ──────────────────────────────────────────────
  const handleReadOnline = useCallback(() => {
    if (!selectedBook) return;
    setReaderBook(selectedBook);
    setReaderOpen(true);
    setModalOpen(false);
  }, [selectedBook]);

  // ─── Handle Category Click ──────────────────────────────────────────
  const handleCategoryClick = useCallback((cat: string) => {
    setActiveCategory(cat);
    setQuery('');
    setDebouncedQuery('');
    setSavedBookIds(new Set());
  }, []);

  // ─── Handle Book Click ──────────────────────────────────────────────
  const handleBookClick = useCallback((book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  }, []);

  // ─── Clear Search ──────────────────────────────────────────────────
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setActiveCategory('');
    setBooks([]);
    setTotalItems(0);
    setHasSearched(false);
  }, []);

  const activeCatConfig = SUBJECTS.find(c => c.value === activeCategory);

  return (
    <div className="min-h-0 sm:min-h-[calc(100vh-8rem)] flex flex-col">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm"><Library className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
              Digital Library
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{totalItems > 0 ? `${totalItems.toLocaleString()} books found` : 'Browse & search books'}</p>
          </div>
          {(books.length > 0 || hasSearched) && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="text-xs text-muted-foreground hover:text-foreground gap-1"><RefreshCw className="w-3.5 h-3.5" />Clear</Button>
          )}
        </div>

        {/* ─── Search Bar ─────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search by title or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-10 pr-10 bg-card border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-primary/20"
          />
          {(query || debouncedQuery) && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ─── Category Tabs ──────────────────────────────────────── */}
        <div className="relative">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {SUBJECTS.map((cat) => {
              const isActive = activeCategory === cat.value;
              const isSaved = cat.value === '__saved__';
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryClick(cat.value)}
                  className={`
                    shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                    ${isActive
                      ? isSaved
                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25'
                        : 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  {cat.icon === Heart && !isActive && <Heart className="w-3.5 h-3.5" />}
                  {cat.icon !== Heart && <cat.icon className="w-3.5 h-3.5" />}
                  <span>{cat.label}</span>
                  {isActive && !isSaved && <Badge className="ml-1.5 h-4 text-[10px] px-1">{books.length}</Badge>}
                  {isActive && isSaved && <Badge className="ml-1.5 h-4 text-[10px] px-1">{books.length}</Badge>}
                </button>
              );
            })}
          </div>
          {/* Gradient fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {/* Loading State */}
        {loading && books.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error State */}
        {error && !loading && books.length === 0 && (
          <ErrorState message={error} onRetry={() => fetchBooks(debouncedQuery, activeCategory, 'en', 1, false)} />
        )}

        {/* Empty State (initial) */}
        {!hasSearched && !loading && !error && books.length === 0 && (
          <WelcomeState onCategoryClick={handleCategoryClick} />
        )}

        {/* Empty Results */}
        {hasSearched && !loading && !error && books.length === 0 && (
          <EmptyResults query={debouncedQuery || activeCategory} />
        )}

        {/* Book Grid */}
        {books.length > 0 && (
          <>
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" variants={staggerContainer} initial="hidden" animate="visible">
              {books.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={i}
                  isSaved={savedBookIds.has(book.bookId || book.id)}
                  onToggleSave={handleToggleSave}
                  onClick={() => handleBookClick(book)}
                />
              ))}
            </motion.div>

            {/* Load More */}
            {hasMore && !isSavedTab && (
              <div className="flex justify-center mt-6 mb-4">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="gap-2 min-w-[200px]">
                  {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</> : <><BookOpen className="w-4 h-4" />Load More Books}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Saved Books: Load More */}
        {isSavedTab && books.length > 0 && !loading && (
          <div className="text-center mt-4 text-xs text-muted-foreground">
            {books.length} saved book{books.length !== 1 ? 's' : ''} in your library
          </div>
        )}
      </div>

      {/* ─── Detail Modal ───────────────────────────────────────────── */}
      <BookDetailModal
        book={selectedBook}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isSaved={selectedBook ? savedBookIds.has(selectedBook.bookId || selectedBook.id) : false}
        onToggleSave={() => selectedBook && handleToggleSave({ stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent, book: selectedBook)}
        onReadOnline={handleReadOnline}
      />

      {/* ─── Reader Dialog ─────────────────────────────────────────────── */}
      <BookReaderDialog book={readerBook} open={readerOpen} onClose={() => setReaderOpen(false)} />
    </div>
  );
}
