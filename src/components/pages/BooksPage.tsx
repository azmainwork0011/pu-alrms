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
} from '@/components/ui/tooltip';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  BookOpen,
  Heart,
  Monitor,
  Scale,
  Briefcase,
  Wrench,
  Globe,
  Brain,
  History,
  Star,
  ExternalLink,
  Download,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Library,
  FileText,
  ChevronLeft,
  Maximize2,
  BookCopy,
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

interface SearchResponse {
  success: boolean;
  books: Book[];
  totalItems: number;
  page: number;
  maxResults: number;
  categories: string[];
  query: string;
  language: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'All Books', value: '', icon: BookOpen },
  { label: 'Computer Science', value: 'Computer Science', icon: Monitor },
  { label: 'Law (LLB)', value: 'Law (LLB)', icon: Scale },
  { label: 'Business Administration (BBA)', value: 'Business Administration (BBA)', icon: Briefcase },
  { label: 'Engineering', value: 'Engineering', icon: Wrench },
  { label: 'Web Development & UI/UX Design', value: 'Web Development & UI/UX Design', icon: Globe },
  { label: 'Data Science & Machine Learning', value: 'Data Science & Machine Learning', icon: Brain },
  { label: 'History & General Education', value: 'History & General Education', icon: History },
  { label: 'Saved Books', value: '__saved__', icon: Heart },
];

const MAX_RESULTS = 24;

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Build a Google Books embed URL from infoLink or book id.
 * Returns null if embed is not possible.
 */
function getGoogleEmbedUrl(book: Book): string | null {
  // Try to extract book ID from infoLink
  if (book.infoLink) {
    const match = book.infoLink.match(/[?&]id=([^&]+)/);
    if (match) {
      const bid = match[1];
      const hl = book.language === 'bn' ? 'bn' : 'en';
      return `https://books.google.com/books?id=${bid}&pg=PA1&hl=${hl}&output=embed`;
    }
  }
  // Try to use bookId field directly
  if (book.bookId && book.source === 'google') {
    const hl = book.language === 'bn' ? 'bn' : 'en';
    return `https://books.google.com/books?id=${book.bookId}&pg=PA1&hl=${hl}&output=embed`;
  }
  return null;
}

/**
 * Build an Open Library embed URL from the book id.
 * Returns null if embed is not possible.
 */
function getOpenLibraryEmbedUrl(book: Book): string | null {
  if (book.source === 'openlibrary' && book.bookId) {
    return `https://openlibrary.org/books/${book.bookId}/embed`;
  }
  return null;
}

/**
 * Get the best embed URL for a book, or null if none available.
 */
function getEmbedUrl(book: Book): string | null {
  if (book.source === 'google') return getGoogleEmbedUrl(book);
  if (book.source === 'openlibrary') return getOpenLibraryEmbedUrl(book);
  return null;
}

// ─── Animation Variants ─────────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const cardFadeIn = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 26, mass: 0.8 },
  },
};

const modalSlideUp = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.15 } },
};

const readerOverlayAnim = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const readerContentAnim = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.15 } },
};

// ─── Star Rating Display ────────────────────────────────────────────────

function StarRating({
  rating,
  count,
  size = 'sm',
}: {
  rating: number | null;
  count?: number;
  size?: 'sm' | 'md';
}) {
  if (rating == null) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${iconSize} ${
              i < fullStars
                ? 'text-amber-400 fill-amber-400'
                : i === fullStars && hasHalf
                  ? 'text-amber-400 fill-amber-200'
                  : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
      {count != null && count > 0 && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-0.5">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

// ─── Book Card Skeleton ─────────────────────────────────────────────────

function BookCardSkeleton() {
  return (
    <div className="rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <Skeleton className="w-full aspect-[3/4]" />
      <div className="p-1.5 space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

// ─── Book Cover Fallback ────────────────────────────────────────────────

function BookCoverFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full aspect-[3/4] bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-cyan-900/40 flex items-center justify-center ${className}`}>
      <BookOpen className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
    </div>
  );
}

// ─── Book Card ──────────────────────────────────────────────────────────

function BookCard({
  book,
  index,
  isSaved,
  onToggleSave,
  onClick,
}: {
  book: Book;
  index: number;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, book: Book) => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      variants={cardFadeIn}
      className="group"
    >
      <div className="rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col" onClick={onClick}>
        {/* Cover Image */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={book.coverUrl ? 'hidden' : ''}>
            <BookCoverFallback />
          </div>

          {/* Save Button — 44px minimum touch target */}
          <motion.button
            whileTap={{ scale: 0.75 }}
            onClick={(e) => onToggleSave(e, book)}
            className="absolute top-1.5 right-1.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isSaved ? 'saved' : 'unsaved'}
                initial={isSaved ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={isSaved ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    isSaved
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* PDF Available Badge */}
          {book.pdfAvailable && book.pdfLink && (
            <div className="absolute bottom-1 left-1">
              <Badge className="text-[8px] px-1 py-0 font-medium bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 backdrop-blur-sm leading-none">
                PDF
              </Badge>
            </div>
          )}

          {/* Source indicator - subtle dot */}
          <div className="absolute bottom-1 right-1">
            <div className={`w-2 h-2 rounded-full backdrop-blur-sm ${
              book.source === 'google'
                ? 'bg-teal-400/80'
                : 'bg-orange-400/80'
            }`} title={book.source === 'google' ? 'Google Books' : 'Open Library'} />
          </div>
        </div>

        {/* Card Content - ultra compact */}
        <div className="p-1.5 sm:p-2 flex-1 flex flex-col min-h-0">
          <h3 className="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
            {book.title}
          </h3>
          {book.authors && (
            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {book.authors}
            </p>
          )}
          <div className="flex items-center justify-end mt-auto pt-1">
            <StarRating rating={book.averageRating} size="sm" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Book Reader Dialog ─────────────────────────────────────────────────

function BookReaderDialog({
  book,
  open,
  onClose,
}: {
  book: Book | null;
  open: boolean;
  onClose: () => void;
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const embedUrl = book ? getEmbedUrl(book) : null;

  if (!book) return null;

  const fallbackUrl = book.previewLink || book.infoLink || null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-screen h-screen max-w-none max-h-none translate-x-0 translate-y-0 top-0 left-0 rounded-none border-0 p-0 gap-0 [&>button]:hidden sm:rounded-none"
        showCloseButton={false}
      >
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="reader-content"
              variants={readerContentAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col w-full h-full"
            >
              {/* Reader Header */}
              <div className="shrink-0 sticky top-0 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10 safe-top">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Book cover thumbnail */}
                  <div className="hidden sm:block w-8 h-11 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800 dark:to-teal-800 flex items-center justify-center">
                        <BookOpen className="w-3 h-3 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
                      {book.title}
                    </DialogTitle>
                    {book.authors && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {book.authors}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Fallback: Open externally */}
                  {fallbackUrl && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 sm:h-8 sm:w-auto sm:px-2.5 text-xs gap-1.5 p-0 sm:p-0"
                          onClick={() => window.open(fallbackUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Open in new tab</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Open the book in a new browser tab
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="h-9 w-9 sm:h-8 sm:w-auto sm:px-3 text-xs gap-1.5 border-gray-300 dark:border-gray-700 p-0 sm:p-0"
                  >
                    <X className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Close</span>
                  </Button>
                </div>
              </div>

              {/* Reader Body */}
              <div className="flex-1 relative bg-gray-50 dark:bg-gray-950 overflow-hidden">
                {embedUrl ? (
                  <>
                    {/* Loading overlay */}
                    {!iframeLoaded && !iframeError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 z-10">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          className="mb-4"
                        >
                          <BookOpen className="w-10 h-10 text-emerald-500" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Loading book reader...
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          This may take a moment
                        </p>
                      </div>
                    )}

                    {/* Iframe */}
                    <iframe
                      key={book.id}
                      src={embedUrl}
                      className={`w-full h-full border-0 ${iframeLoaded ? 'block' : 'hidden'}`}
                      title={`Reading: ${book.title}`}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                      allow="autoplay; encrypted-media"
                      onLoad={() => setIframeLoaded(true)}
                      onError={() => setIframeError(true)}
                    />

                    {/* Error fallback */}
                    {iframeError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Reader unavailable
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center mb-4">
                          This book&apos;s preview could not be loaded in the embedded reader.
                        </p>
                        {fallbackUrl && (
                          <Button
                            onClick={() => window.open(fallbackUrl, '_blank', 'noopener,noreferrer')}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open externally
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* No embed URL available */
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <BookCopy className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No embedded preview available
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center mb-4">
                      This book doesn&apos;t have an embedded reader preview. Try opening it externally.
                    </p>
                    {fallbackUrl && (
                      <Button
                        onClick={() => window.open(fallbackUrl, '_blank', 'noopener,noreferrer')}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open on {book.source === 'google' ? 'Google Books' : 'Open Library'}
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

// ─── Book Detail Modal ──────────────────────────────────────────────────

function BookDetailModal({
  book,
  open,
  onClose,
  isSaved,
  onToggleSave,
  onReadOnline,
}: {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onReadOnline: () => void;
}) {
  if (!book) return null;

  const canEmbed = !!getEmbedUrl(book);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[calc(100%-0.75rem)] sm:w-full max-h-[92vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
        <motion.div
          variants={modalSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative"
        >
          {/* Close Button — larger touch target on mobile */}
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <ScrollArea className="max-h-[92vh]">
            <div className="flex flex-col sm:flex-row">
              {/* Cover — wider on mobile, centered */}
              <div className="sm:w-48 shrink-0 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-4 pb-2 sm:p-4 sm:pb-4">
                <div className="w-full max-w-[180px] sm:max-w-[140px] aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={book.coverUrl ? 'hidden' : ''}>
                    <div className="w-full aspect-[2/3] bg-gradient-to-br from-emerald-200 via-teal-100 to-cyan-200 dark:from-emerald-900/60 dark:via-teal-900/40 dark:to-cyan-900/60 flex items-center justify-center rounded-lg">
                      <BookOpen className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 p-4 pb-5 sm:p-6 space-y-3 sm:space-y-4">
                <DialogHeader className="space-y-1 sm:space-y-1.5 text-left pr-8">
                  <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    {book.title}
                  </DialogTitle>
                  {book.subtitle && (
                    <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 italic">
                      {book.subtitle}
                    </DialogDescription>
                  )}
                  {book.authors && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      by {book.authors}
                    </p>
                  )}
                </DialogHeader>

                {/* Rating */}
                {book.averageRating != null && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={book.averageRating} count={book.ratingsCount} size="md" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {book.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Categories */}
                {book.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {book.categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="text-xs px-2 py-0.5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {book.language && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {book.language}
                    </span>
                  )}
                  {book.pageCount && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {book.pageCount} pages
                    </span>
                  )}
                  {book.publishedDate && (
                    <span className="flex items-center gap-1">
                      <History className="w-3.5 h-3.5" />
                      {book.publishedDate}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Library className="w-3.5 h-3.5" />
                    {book.source === 'google' ? 'Google Books' : 'Open Library'}
                  </span>
                </div>

                <Separator />

                {/* Description */}
                {book.description && (
                  <div className="max-h-48 overflow-y-auto pr-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {book.description.length > 1000
                        ? book.description.slice(0, 1000) + '...'
                        : book.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Action Buttons — scrollable on small mobile */}
                <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {/* Save / Unsave */}
                  <Button
                    variant={isSaved ? 'default' : 'outline'}
                    size="sm"
                    onClick={onToggleSave}
                    className={
                      isSaved
                        ? 'bg-rose-500 hover:bg-rose-600 text-white border-0'
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>

                  {/* Read Online — opens embedded reader */}
                  {(book.previewLink || book.infoLink) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onReadOnline}
                          className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 gap-1.5"
                        >
                          {canEmbed ? (
                            <>
                              <Maximize2 className="w-4 h-4" />
                              Read Now
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              Read Online
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {canEmbed ? (
                        <TooltipContent>
                          Read this book inside the app
                        </TooltipContent>
                      ) : (
                        <TooltipContent>
                          Open book in a new tab
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}

                  {/* Download PDF */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!book.pdfAvailable || !book.pdfLink}
                          asChild={book.pdfAvailable && book.pdfLink ? true : false}
                          className="text-xs sm:text-sm"
                        >
                          {book.pdfAvailable && book.pdfLink ? (
                            <a href={book.pdfLink} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                              <span className="hidden xs:inline">Download</span> PDF
                            </a>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              No PDF
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!book.pdfAvailable && (
                      <TooltipContent>
                        PDF is not available for this book
                      </TooltipContent>
                    )}
                  </Tooltip>

                  {/* View on Source */}
                  {book.infoLink && (
                    <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm shrink-0">
                      <a href={book.infoLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">View on </span>
                        {book.source === 'google' ? 'Google Books' : 'Open Library'}
                      </a>
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

function WelcomeState({ onCategoryClick }: { onCategoryClick: (cat: string) => void }) {
  const featuredCategories = CATEGORIES.filter(
    (c) => c.value !== '' && c.value !== '__saved__'
  ).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-6 sm:py-10 text-center"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Library className="w-5 h-5 text-white" />
        </div>
      </motion.div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1.5">
        Explore Our Digital Library
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4 px-4">
        Search for books, browse by category, or save your favorites.
      </p>
      <div className="grid grid-cols-2 gap-2.5 px-4 max-w-sm w-full">
        {featuredCategories.map((cat) => (
          <motion.button
            key={cat.value}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCategoryClick(cat.value)}
            className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            <cat.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate text-left">{cat.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Something went wrong
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-3 px-4">{message}</p>
      <Button variant="outline" onClick={onRetry} className="gap-1.5 text-xs h-9">
        <RefreshCw className="w-3.5 h-3.5" />
        Try Again
      </Button>
    </motion.div>
  );
}

// ─── Empty Results ──────────────────────────────────────────────────────

function EmptyResults({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No books found
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs px-4">
        {query
          ? `No results for "${query}". Try different keywords.`
          : 'No books found in this category. Try a different one.'}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function BooksPage() {
  const { token } = useAppStore();
  const { toast } = useToast();

  // ─── State ──────────────────────────────────────────────────────────
  const [books, setBooks] = useState<Book[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
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
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Derived ────────────────────────────────────────────────────────
  const isSavedTab = activeCategory === '__saved__';
  const activeCategoryConfig = CATEGORIES.find((c) => c.value === activeCategory);

  // ─── Fetch Saved Book IDs ───────────────────────────────────────────
  const fetchSavedBooks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/books/saved', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.books)) {
          const ids = new Set<string>();
          data.books.forEach((b: Book) => {
            const bId = b.bookId || b.id;
            ids.add(bId);
          });
          setSavedBookIds(ids);
        }
      }
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    fetchSavedBooks();
  }, [fetchSavedBooks]);

  // ─── Search Books ───────────────────────────────────────────────────
  const fetchBooks = useCallback(
    async (q: string, category: string, lang: string, pageNum: number, append: boolean) => {
      // Abort previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category && category !== '__saved__') params.set('category', category);
        params.set('lang', lang);
        params.set('page', String(pageNum));
        params.set('maxResults', String(MAX_RESULTS));
        // For Bangla, prefer openlibrary
        if (lang === 'bn') params.set('source', 'openlibrary');

        const res = await fetch(`/api/books/search?${params.toString()}`, {
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch books');

        const data: SearchResponse = await res.json();

        if (append) {
          setBooks((prev) => {
            const existingIds = new Set(prev.map((b) => b.id));
            const newBooks = data.books.filter((b) => !existingIds.has(b.id));
            return [...prev, ...newBooks];
          });
        } else {
          setBooks(data.books);
        }

        setTotalItems(data.totalItems);
        setHasMore(data.books.length >= MAX_RESULTS && (pageNum * MAX_RESULTS) < data.totalItems);
        setPage(pageNum);
        setHasSearched(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (!append) {
          setError('Unable to load books. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // ─── Fetch Saved Books List ─────────────────────────────────────────
  const fetchSavedBooksList = useCallback(async () => {
    if (!token) {
      setError('Please sign in to view saved books.');
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/books/saved', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch saved books');

      const data = await res.json();

      if (data.success && Array.isArray(data.books)) {
        setBooks(data.books);
        setTotalItems(data.books.length);
        setHasMore(false);
        setHasSearched(true);
      } else {
        setBooks([]);
        setTotalItems(0);
        setHasMore(false);
        setHasSearched(true);
      }
    } catch {
      setError('Unable to load saved books. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ─── Trigger Search ─────────────────────────────────────────────────
  const performSearch = useCallback(
    (q: string, category: string, resetPage = true) => {
      const pageNum = resetPage ? 1 : page;
      if (category === '__saved__') {
        fetchSavedBooksList();
      } else {
        fetchBooks(q, category, language, pageNum, false);
      }
    },
    [fetchBooks, fetchSavedBooksList, language, page]
  );

  // ─── Debounced Search (on input change) ────────────────────────────
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // ─── Auto-search when debounced query changes (only if already searched) ───
  useEffect(() => {
    if (!hasSearched) return;
    if (debouncedQuery === query && !isSavedTab) {
      performSearch(debouncedQuery, activeCategory);
    }
  }, [debouncedQuery, hasSearched, isSavedTab, performSearch, activeCategory, query]);

  // ─── Language Toggle ────────────────────────────────────────────────
  const handleLanguageChange = useCallback(
    (lang: 'en' | 'bn') => {
      setLanguage(lang);
      if (hasSearched && !isSavedTab) {
        performSearch(query, activeCategory);
      }
    },
    [language, hasSearched, isSavedTab, performSearch, query, activeCategory]
  );

  // ─── Category Selection ─────────────────────────────────────────────
  const handleCategoryClick = useCallback(
    (categoryValue: string) => {
      setActiveCategory(categoryValue);
      setQuery('');
      setDebouncedQuery('');
      searchInputRef.current?.blur();
      if (categoryValue === '__saved__') {
        fetchSavedBooksList();
      } else {
        fetchBooks('', categoryValue, language, 1, false);
      }
    },
    [language, fetchBooks, fetchSavedBooksList]
  );

  // ─── Search on Enter ────────────────────────────────────────────────
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isSavedTab) {
        setActiveCategory('');
      }
      performSearch(query, activeCategory);
    },
    [query, activeCategory, isSavedTab, performSearch]
  );

  // ─── Load More ──────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (isSavedTab || loadingMore) return;
    fetchBooks(query, activeCategory, language, page + 1, true);
  }, [fetchBooks, query, activeCategory, language, page, loadingMore, isSavedTab]);

  // ─── Save / Unsave ──────────────────────────────────────────────────
  const handleToggleSave = useCallback(
    async (e: React.MouseEvent, book: Book) => {
      e.stopPropagation();

      if (!token) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to save books.',
          variant: 'destructive',
        });
        return;
      }

      const bookId = book.bookId || book.id;
      const currentlySaved = savedBookIds.has(bookId);

      // Optimistic update
      setSavedBookIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) {
          next.delete(bookId);
        } else {
          next.add(bookId);
        }
        return next;
      });

      try {
        if (currentlySaved) {
          const res = await fetch(`/api/books/saved?bookId=${encodeURIComponent(bookId)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to remove');
          toast({ title: 'Book removed', description: `"${book.title}" removed from saved books.` });

          // If on saved tab, remove from list
          if (isSavedTab) {
            setBooks((prev) => prev.filter((b) => (b.bookId || b.id) !== bookId));
            setTotalItems((prev) => Math.max(0, prev - 1));
          }
        } else {
          const res = await fetch('/api/books/saved', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              bookId,
              title: book.title,
              authors: book.authors,
              coverUrl: book.coverUrl,
              category: book.categories?.[0] || '',
              language: book.language,
              description: book.description?.slice(0, 500) || '',
              infoLink: book.infoLink,
              pdfLink: book.pdfLink,
            }),
          });
          if (!res.ok) throw new Error('Failed to save');
          toast({ title: 'Book saved!', description: `"${book.title}" added to your library.` });
        }
      } catch {
        // Revert on error
        setSavedBookIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) {
            next.add(bookId);
          } else {
            next.delete(bookId);
          }
          return next;
        });
        toast({
          title: 'Error',
          description: currentlySaved ? 'Failed to remove book. Try again.' : 'Failed to save book. Try again.',
          variant: 'destructive',
        });
      }
    },
    [token, savedBookIds, toast, isSavedTab]
  );

  // ─── Modal Handlers ─────────────────────────────────────────────────
  const openBookDetail = useCallback((book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    // Delay clearing so the exit animation plays
    setTimeout(() => setSelectedBook(null), 200);
  }, []);

  const handleModalToggleSave = useCallback(() => {
    if (!selectedBook) return;
    // Simply call the main handler — it already does optimistic update
    // No need for a second redundant optimistic update here
    handleToggleSave(
      { stopPropagation: () => {} } as React.MouseEvent,
      selectedBook
    );
  }, [selectedBook, handleToggleSave]);

  // ─── Reader Handlers ────────────────────────────────────────────────
  const handleReadOnline = useCallback((book: Book) => {
    // If embed is possible, open the embedded reader
    if (getEmbedUrl(book)) {
      setReaderBook(book);
      setReaderOpen(true);
    } else {
      // Fallback: open externally
      const url = book.previewLink || book.infoLink;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  const handleModalReadOnline = useCallback(() => {
    if (!selectedBook) return;
    handleReadOnline(selectedBook);
  }, [selectedBook, handleReadOnline]);

  const closeReader = useCallback(() => {
    setReaderOpen(false);
    setTimeout(() => setReaderBook(null), 200);
  }, []);

  // ─── Retry ──────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (isSavedTab) {
      fetchSavedBooksList();
    } else {
      performSearch(query, activeCategory);
    }
  }, [isSavedTab, query, activeCategory, fetchSavedBooksList, performSearch]);

  // ─── Cleanup ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-3 overflow-x-hidden px-1 sm:px-0 pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-500/15">
              <Library className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                Digital Library
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                Search, browse, and save your favorite books
              </p>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 shrink-0">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all duration-200 ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="hidden sm:inline">English</span>
              <span className="sm:hidden">EN</span>
            </button>
            <button
              onClick={() => handleLanguageChange('bn')}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all duration-200 ${
                language === 'bn'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="hidden sm:inline">বাংলা</span>
              <span className="sm:hidden">BN</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={
                language === 'bn'
                  ? 'বই খুঁজুন...'
                  : 'Search by title, author, or topic...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 pr-14 text-xs sm:text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-lg shadow-sm focus-visible:shadow-md focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 transition-all"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setDebouncedQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-medium"
              >
                Search
              </Button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* ─── Category Pills ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative"
      >
        {/* Left gradient fade */}
        <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-6 bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent z-10 pointer-events-none rounded-l-lg" />
        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 bottom-0 w-3 sm:w-6 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent z-10 pointer-events-none rounded-r-lg" />

        <div
          ref={categoryScrollRef}
          className="flex gap-1.5 overflow-x-auto py-0.5 px-0.5 -mx-0.5 snap-x [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <motion.button
                key={cat.value}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200 border snap-start ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400'
                }`}
              >
                <cat.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.label.split(' (')[0]}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Active Filter Info ──────────────────────────────────────── */}
      {(activeCategory || query) && hasSearched && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
            {activeCategoryConfig && (
              <Badge variant="outline" className="text-[10px] px-2 py-0 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1 shrink-0">
                <activeCategoryConfig.icon className="w-3 h-3" />
                <span className="hidden xs:inline">{activeCategoryConfig.label}</span>
                <span className="xs:hidden">{activeCategoryConfig.label.split(' (')[0]}</span>
              </Badge>
            )}
            {query && activeCategoryConfig && <span className="shrink-0">·</span>}
            {query && <span className="truncate">&ldquo;{query}&rdquo;</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isSavedTab && totalItems > 0 && (
              <span className="hidden sm:inline">· {totalItems.toLocaleString()} results</span>
            )}
            <button
              onClick={() => {
                setActiveCategory('');
                setQuery('');
                setDebouncedQuery('');
                setBooks([]);
                setHasSearched(false);
                setTotalItems(0);
                setHasMore(false);
                setError(null);
              }}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
            >
              <ChevronLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Clear filters</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Content Area ────────────────────────────────────────────── */}
      <div className="min-h-[300px]">
        {/* Initial loading skeletons */}
        {loading && !books.length && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div key={i} variants={cardFadeIn}>
                <BookCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {!loading && error && <ErrorState message={error} onRetry={handleRetry} />}

        {/* Welcome State */}
        {!loading && !error && !hasSearched && (
          <WelcomeState onCategoryClick={handleCategoryClick} />
        )}

        {/* Empty Results */}
        {!loading && !error && hasSearched && books.length === 0 && (
          <EmptyResults query={query} />
        )}

        {/* Books Grid */}
        {!loading && !error && books.length > 0 && (
          <>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              key={`${activeCategory}-${debouncedQuery}-${language}-${page}`}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3"
            >
              {books.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  isSaved={savedBookIds.has(book.bookId || book.id)}
                  onToggleSave={handleToggleSave}
                  onClick={() => openBookDetail(book)}
                />
              ))}
            </motion.div>

            {/* Load More */}
            {hasMore && !isSavedTab && (
              <div className="flex justify-center mt-4 px-2 sm:px-0">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full sm:w-auto sm:min-w-[140px] h-9 sm:h-8 border-gray-300 dark:border-gray-700 rounded-lg gap-1.5 text-xs"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More
                        <span className="hidden sm:inline text-xs text-gray-400">
                          ({Math.min((page + 1) * MAX_RESULTS, totalItems).toLocaleString()} of {totalItems.toLocaleString()})
                        </span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Loading More Indicator */}
        {loadingMore && books.length > 0 && (
          <div className="flex justify-center mt-4">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          </div>
        )}
      </div>

      {/* ─── Book Detail Modal ───────────────────────────────────────── */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          open={modalOpen}
          onClose={closeModal}
          isSaved={savedBookIds.has(selectedBook.bookId || selectedBook.id)}
          onToggleSave={handleModalToggleSave}
          onReadOnline={handleModalReadOnline}
        />
      )}

      {/* ─── Book Reader Dialog ──────────────────────────────────────── */}
      {readerBook && (
        <BookReaderDialog
          key={readerBook.id}
          book={readerBook}
          open={readerOpen}
          onClose={closeReader}
        />
      )}
    </div>
  );
}
