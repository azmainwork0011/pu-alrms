'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  AlertTriangle,
  Info,
  Terminal,
  Shield,
  Key,
  Globe,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowRight,
  Rocket,
  Github,
  Database,
  Settings,
  BookOpen,
  Layers,
  Zap,
  FileWarning,
  Eye,
  Code2,
  RefreshCw,
  Bug,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

// ─── Copy Button Helper ─────────────────────────────────────────
function CopyButton({ text, variant = 'outline', size = 'sm' }: { text: string; variant?: 'outline' | 'secondary' | 'ghost'; size?: 'sm' | 'icon' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className="shrink-0 gap-1.5 text-xs"
      aria-label="Copy"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-500" />
          <span className="text-emerald-500">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          <span className="hidden sm:inline">Copy</span>
        </>
      )}
    </Button>
  );
}

// ─── Code Block ─────────────────────────────────────────────────
function CodeBlock({
  code,
  language = 'bash',
  showLineNumbers = false,
}: {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}) {
  const lines = code.split('\n');

  return (
    <div className="group relative rounded-lg border bg-muted/50 overflow-hidden">
      {/* Language badge */}
      <div className="flex items-center justify-between border-b bg-muted/80 px-3 py-1.5">
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-mono">
          {language}
        </Badge>
        <CopyButton text={code} />
      </div>
      <div className="overflow-x-auto p-3">
        <pre className="font-mono text-xs leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              {showLineNumbers && (
                <span className="text-muted-foreground/50 select-none w-6 text-right shrink-0">
                  {i + 1}
                </span>
              )}
              <code className="text-foreground/90 whitespace-pre">{line || ' '}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ─── Step Number Badge ──────────────────────────────────────────
function StepBadge({ number }: { number: number }) {
  return (
    <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 border border-primary/20 shrink-0">
      <span className="text-sm font-bold text-primary">{number}</span>
    </div>
  );
}

// ─── Progress Stepper ───────────────────────────────────────────
function ProgressStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: 'GitHub', icon: Github },
    { label: 'Vercel', icon: Rocket },
    { label: 'Turso DB', icon: Database },
    { label: 'Prisma', icon: Code2 },
    { label: 'Deploy', icon: Globe },
    { label: 'Verify', icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex items-center gap-1 sm:gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
                isActive
                  ? isCurrent
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted text-muted-foreground border border-border'
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden md:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight
                className={cn(
                  'size-3.5 shrink-0 transition-colors',
                  index < currentStep ? 'text-primary' : 'text-muted-foreground/40'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-step Item ──────────────────────────────────────────────
function SubStep({
  icon: Icon,
  title,
  description,
  isAction = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  isAction?: boolean;
}) {
  return (
    <div className="flex gap-3 py-1.5">
      <div
        className={cn(
          'flex items-center justify-center size-6 rounded-md shrink-0 mt-0.5',
          isAction
            ? 'bg-amber-500/10 border border-amber-500/20'
            : 'bg-muted border border-border'
        )}
      >
        <Icon
          className={cn('size-3.5', isAction ? 'text-amber-500' : 'text-muted-foreground')}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Env Var Row ────────────────────────────────────────────────
function EnvVarRow({
  variable,
  isPublic,
  source,
}: {
  variable: string;
  isPublic: boolean;
  source: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-1 lg:gap-4 items-start py-2.5 border-b border-border/50 last:border-0">
      <div className="font-mono text-xs bg-muted/70 px-2 py-1 rounded break-all">
        {variable}
      </div>
      <div className="flex items-center justify-center lg:justify-center">
        <Badge variant={isPublic ? 'default' : 'secondary'} className="text-[10px] gap-1">
          {isPublic ? (
            <>
              <CheckCircle2 className="size-3" />
              Public
            </>
          ) : (
            <>
              <XCircle className="size-3" />
              Private
            </>
          )}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{source}</div>
    </div>
  );
}

// ─── Section Wrapper with Animation ─────────────────────────────
function Section({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DeployGuidePage() {
  const [currentStep, setCurrentStep] = useState(0);

  // ─── Code Snippets ──────────────────────────────────────
  const gitInitSnippet = `# প্রজেক্ট ফোল্ডারে যান
cd pu-alrms

# Git ইনিশিয়ালাইজ করুন (যদি না করা থাকে)
git init

# সব ফাইল অ্যাড করুন
git add .

# প্রথম কমিট
git commit -m "Initial commit: PU-ALRMS v2.0"

# GitHub রিমোট যোগ করুন (আপনার GitHub username ব্যবহার করুন)
git remote add origin https://github.com/YOUR_USERNAME/pu-alrms.git

# GitHub-এ পুশ করুন
git push -u origin main`;

  const tursoCLISnippet = `# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm https://get.tur.so/install.ps1 | iex`;

  const tursoCreateSnippet = `# Turso-তে লগইন করুন
turso auth login

# ডাটাবেস তৈরি করুন
turso db create pu-alrms

# Connection URL নিন
turso db show pu-alrms --url

# Auth Token তৈরি করুন
turso db tokens create pu-alrms`;

  const prismaSchemaSnippet = `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "libsql"          // ← "sqlite" থেকে "libsql" করুন
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}`;

  const prismaPushSnippet = `# Turso-তে স্কিমা পুশ করুন
npx prisma db push

# Prisma Client জেনারেট করুন
npx prisma generate`;

  const jwtGenSnippet = `# macOS / Linux
openssl rand -hex 32

# Node.js (সব OS)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`;

  const gitignoreCheckSnippet = `# .gitignore ফাইলে নিচেরগুলো আছে কিনা চেক করুন
.env
.env.local
.env*.local
*.db
*.db-journal`;

  // ─── RENDER ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <Section index={0} className="mb-8">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 mb-4"
            >
              <Rocket className="size-8 text-emerald-500" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
              🚀 Vercel Deployment Guide
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Vercel-এ ডিপ্লয় করুন ধাপে ধাপে — Step-by-step deployment guide for PU-ALRMS
            </p>

            {/* Status badge */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40"
              >
                <Zap className="size-3.5" />
                সম্পূর্ণ ফ্রি — Completely Free
              </Badge>
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 text-xs"
              >
                ~30 min
              </Badge>
            </div>
          </div>

          {/* Why Vercel info card */}
          <div className="rounded-xl border bg-muted/30 p-4 sm:p-5 max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <Info className="size-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">কেন Vercel? (Why Vercel?)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vercel Next.js তৈরি করেছে — তাই Next.js প্রজেক্টের জন্য এটি সবচেয়ে ভালো।
                  সম্পূর্ণ ফ্রি, HTTPS সাপোর্ট, অটো ডিপ্লয়, এবং কাস্টম ডোমেইন সাপোর্ট আছে।
                  কিন্তু একটি সমস্যা: <strong>SQLite Vercel-এ কাজ করে না</strong> (read-only filesystem)।
                  তাই আমরা <strong>Turso</strong> নামে একটি ফ্রি cloud database ব্যবহার করব — যেটি SQLite-এর সাথে 100% compatible।
                </p>
              </div>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="mt-6">
            <ProgressStepper currentStep={currentStep} />
          </div>
        </Section>

        <Separator className="my-6" />

        {/* ─── STEP 1: Upload to GitHub ─────────────────────────── */}
        <Section index={1} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={1} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    GitHub-এ আপলোড করুন
                  </CardTitle>
                  <CardDescription>
                    প্রজেক্ট কোড GitHub-এ পুশ করুন — Upload your code to GitHub
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~5 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubStep
                icon={Github}
                title="GitHub-এ নতুন রিপোজিটরি তৈরি করুন"
                description={
                  <span>
                    যান:{' '}
                    <span className="inline-flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                      https://github.com/new
                      <CopyButton text="https://github.com/new" size="icon" />
                    </span>
                  </span>
                }
              />
              <SubStep
                icon={BookOpen}
                title="Repository name: pu-alrms"
                description="Public বা Private — যেকোনোটি হতে পারে"
                isAction
              />
              <SubStep
                icon={FileWarning}
                title='"Add a README file" আনচেক করুন'
                description="আমাদের কাছে ইতোমধ্যে README আছে, তাই দরকার নেই"
                isAction
              />
              <SubStep
                icon={CheckCircle2}
                title='"Create repository" ক্লিক করুন'
                description="রিপোজিটরি তৈরি হয়ে যাবে"
              />

              <Separator className="my-3" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold">
                    Terminal-এ কোড পুশ করুন
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  নিচের কমান্ডগুলো একটি একটি করে চালান। <code className="font-mono bg-muted px-1 rounded">YOUR_USERNAME</code> আপনার GitHub username দিয়ে পরিবর্তন করুন:
                </p>
                <CodeBlock code={gitInitSnippet} language="bash" showLineNumbers />

                <Alert className="mt-3">
                  <Info className="size-4 text-blue-500" />
                  <AlertTitle>💡 Git ইনস্টল নেই?</AlertTitle>
                  <AlertDescription>
                    আপনার কম্পিউটারে গিট ইনস্টল না থাকলে{' '}
                    <span className="font-mono text-xs bg-muted px-1 rounded">git-scm.com</span> থেকে ডাউনলোড করুন।
                    GitHub Desktop অ্যাপও ব্যবহার করতে পারেন।
                  </AlertDescription>
                </Alert>
              </div>

              <Separator className="my-3" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    .gitignore চেক করুন — গুরুত্বপূর্ণ!
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  নিশ্চিত করুন যে <code className="font-mono bg-muted px-1 rounded">.gitignore</code> ফাইলে নিচের এন্ট্রিগুলো আছে:
                </p>
                <CodeBlock code={gitignoreCheckSnippet} language="gitignore" />

                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>⚠️ সতর্কতা!</AlertTitle>
                  <AlertDescription>
                    <code className="font-mono text-xs bg-muted px-1 rounded">.env</code> বা <code className="font-mono text-xs bg-muted px-1 rounded">.env.local</code> ফাইল কখনো GitHub-এ পুশ করবেন না!
                    এতে আপনার সিক্রেট কী ও ডাটাবেস তথ্য থাকে।
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary ml-auto"
                onClick={() => setCurrentStep(Math.max(0, 1))}
              >
                পরবর্তী ধাপ <ArrowRight className="size-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </Section>

        {/* ─── STEP 2: Create Vercel Account ─────────────────────── */}
        <Section index={2} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={2} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Vercel অ্যাকাউন্ট তৈরি করুন
                  </CardTitle>
                  <CardDescription>
                    Vercel-এ সাইন আপ করুন — সম্পূর্ণ ফ্রি!
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~2 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubStep
                icon={Globe}
                title="Vercel ওয়েবসাইটে যান"
                description={
                  <span>
                    ব্রাউজারে খুলুন:{' '}
                    <span className="inline-flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                      https://vercel.com
                      <CopyButton text="https://vercel.com" size="icon" />
                    </span>
                  </span>
                }
              />
              <SubStep
                icon={Github}
                title="GitHub দিয়ে সাইন আপ করুন"
                description='"Sign Up" → "Continue with GitHub" সিলেক্ট করুন'
                isAction
              />
              <SubStep
                icon={CheckCircle2}
                title="Vercel GitHub রিপোজিটরি অ্যাক্সেস দিন"
                description="Vercel আপনার GitHub রিপো দেখতে পাবে — এটি দরকার ডিপ্লয়মেন্টের জন্য"
              />
              <SubStep
                icon={CheckCircle2}
                title="সাইন আপ সম্পন্ন!"
                description="ব্যস, আপনার Vercel অ্যাকাউন্ট তৈরি! এটি সম্পূর্ণ ফ্রি 🎉"
              />

              <Alert className="mt-3">
                <Info className="size-4 text-blue-500" />
                <AlertTitle>💡 Vercel Free Plan</AlertTitle>
                <AlertDescription>
                  Hobby plan সম্পূর্ণ ফ্রি। এতে প্রতি মাসে সীমিত bandwidth ও build minutes পাবেন —
                  পার্সোনাল/ইউনিভার্সিটি প্রজেক্টের জন্য যথেষ্ট।
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary ml-auto"
                onClick={() => setCurrentStep(Math.max(0, 2))}
              >
                পরবর্তী ধাপ <ArrowRight className="size-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </Section>

        {/* ─── STEP 3: Turso Database Setup ──────────────────────── */}
        <Section index={3} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={3} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Turso ডাটাবেস সেটআপ করুন
                  </CardTitle>
                  <CardDescription>
                    Turso-তে ফ্রি cloud database তৈরি করুন (SQLite compatible)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~10 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Why Turso */}
              <Alert className="mb-2">
                <Database className="size-4 text-cyan-500" />
                <AlertTitle>🗄️ কেন Turso?</AlertTitle>
                <AlertDescription>
                  Vercel-এ filesystem read-only, তাই সরাসরি SQLite ব্যবহার করা যায় না।
                  Turso একটি <strong>ফ্রি</strong> cloud database যেটি SQLite-এর সাথে 100% compatible।
                  মাসে 500 database পর্যন্ত ফ্রি!
                </AlertDescription>
              </Alert>

              {/* Install CLI */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold">
                    পদ্ধতি ১: Turso CLI ইনস্টল করুন
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Terminal-এ নিচের কমান্ড চালান:
                </p>
                <CodeBlock code={tursoCLISnippet} language="bash" showLineNumbers />
              </div>

              <Separator />

              {/* Sign up on web */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="size-4 text-cyan-500" />
                  <h4 className="text-sm font-semibold">
                    পদ্ধতি ২: ওয়েবে সাইন আপ করুন (CLI ছাড়া)
                  </h4>
                </div>
                <SubStep
                  icon={Globe}
                  title="Turso ওয়েবসাইটে যান"
                  description={
                    <span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                        https://turso.tech
                        <CopyButton text="https://turso.tech" size="icon" />
                      </span>
                    </span>
                  }
                />
                <SubStep
                  icon={Github}
                  title="GitHub দিয়ে সাইন আপ করুন"
                  description="এটি সবচেয়ে সহজ পদ্ধতি"
                  isAction
                />
              </div>

              <Separator className="my-3" />

              {/* Create database */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Database className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    ডাটাবেস তৈরি করুন (CLI বা Dashboard)
                  </h4>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  <strong>CLI দিয়ে</strong> (ফাস্ট):
                </p>
                <CodeBlock code={tursoCreateSnippet} language="bash" showLineNumbers />

                <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Dashboard দিয়ে</strong> (GUI):
                  </p>
                  <SubStep
                    icon={Globe}
                    title="Turso Dashboard → Databases → Create Database"
                    description="Name দিন: pu-alrms"
                  />
                  <SubStep
                    icon={CheckCircle2}
                    title="ডাটাবেস তৈরি হলে → Settings থেকে URL ও Token নিন"
                    description="নিচে Environment Variables-এ ব্যবহার হবে"
                  />
                </div>
              </div>

              <Alert className="mt-3">
                <Info className="size-4 text-blue-500" />
                <AlertTitle>📝 কী সেভ করবেন</AlertTitle>
                <AlertDescription>
                  <strong>Database URL</strong> দেখতে এমন: <code className="font-mono text-xs bg-muted px-1 rounded">libsql://pu-alrms-username.turso.io</code>
                  <br />
                  <strong>Auth Token</strong> একটি দীর্ঘ string — এটি সেভ রাখুন, পরে দরকার হবে।
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary ml-auto"
                onClick={() => setCurrentStep(Math.max(0, 3))}
              >
                পরবর্তী ধাপ <ArrowRight className="size-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </Section>

        {/* ─── STEP 4: Update Prisma Schema ──────────────────────── */}
        <Section index={4} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={4} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Prisma Schema আপডেট করুন
                  </CardTitle>
                  <CardDescription>
                    SQLite থেকে libsql (Turso) এ মাইগ্রেট করুন
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~5 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubStep
                icon={Code2}
                title="prisma/schema.prisma ফাইল খুলুন"
                description="VS Code বা যেকোনো text editor দিয়ে খুলুন"
              />

              <Separator className="my-3" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    provider ও url আপডেট করুন
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  <code className="font-mono bg-muted px-1 rounded">datasource</code> ব্লকে দুটি পরিবর্তন করুন:
                </p>
                <CodeBlock code={prismaSchemaSnippet} language="prisma" showLineNumbers />

                <div className="mt-3 rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex gap-3 items-start">
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] shrink-0 mt-0.5">
                      পরিবর্তন ১
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <code className="font-mono bg-muted px-1 rounded">provider = &quot;sqlite&quot;</code> কে{' '}
                      <code className="font-mono bg-muted px-1 rounded">provider = &quot;libsql&quot;</code> করুন
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] shrink-0 mt-0.5">
                      পরিবর্তন ২
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <code className="font-mono bg-muted px-1 rounded">directUrl = env(&quot;DATABASE_URL&quot;)</code> লাইনটি যোগ করুন
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Key className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    DATABASE_URL আপডেট করুন
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  আপনার <code className="font-mono bg-muted px-1 rounded">.env.local</code> ফাইলে DATABASE_URL আপডেট করুন:
                </p>
                <CodeBlock
                  code={`# পুরানো (local SQLite — এটি মুছে দিন বা কমেন্ট করুন)
# DATABASE_URL="file:./dev.db"

# নতুন (Turso cloud database)
DATABASE_URL="libsql://pu-alrms-username.turso.io?authToken=YOUR_TURSO_AUTH_TOKEN"`}
                  language="env"
                  showLineNumbers
                />
              </div>

              <Separator className="my-3" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold">
                    Prisma Push ও Generate করুন
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Schema আপডেট হলে নিচের কমান্ড চালান:
                </p>
                <CodeBlock code={prismaPushSnippet} language="bash" showLineNumbers />
              </div>

              <Alert className="mt-3">
                <Info className="size-4 text-blue-500" />
                <AlertTitle>💡 টিপস</AlertTitle>
                <AlertDescription>
                  প্রতিবার আপনি <code className="font-mono text-xs bg-muted px-1 rounded">schema.prisma</code> পরিবর্তন করলে{' '}
                  <code className="font-mono text-xs bg-muted px-1 rounded ml-1">npx prisma db push</code> চালাতে হবে।
                  এটি Turso-তে tables আপডেট করবে।
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary ml-auto"
                onClick={() => setCurrentStep(Math.max(0, 4))}
              >
                পরবর্তী ধাপ <ArrowRight className="size-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </Section>

        {/* ─── STEP 5: Deploy to Vercel ──────────────────────────── */}
        <Section index={5} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={5} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Vercel-এ ডিপ্লয় করুন
                  </CardTitle>
                  <CardDescription>
                    GitHub থেকে প্রজেক্ট ইম্পোর্ট করে ডিপ্লয় করুন
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~5 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubStep
                icon={Globe}
                title="Vercel Dashboard-এ যান"
                description={
                  <span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                      https://vercel.com/new
                      <CopyButton text="https://vercel.com/new" size="icon" />
                    </span>
                  </span>
                }
              />
              <SubStep
                icon={Github}
                title="GitHub রিপোজিটরি ইম্পোর্ট করুন"
                description='"Import Git Repository" সিলেক্ট করুন → pu-alrms রিপো খুঁজুন'
                isAction
              />
              <SubStep
                icon={Settings}
                title="Framework Preset: Next.js (অটো ডিটেক্ট হবে)"
                description="Vercel স্বয়ংক্রিয়ভাবে Next.js প্রজেক্ট চিনতে পারবে"
              />
              <SubStep
                icon={CheckCircle2}
                title='"Deploy" ক্লিক করুন (প্রথমে skip করুন)'
                description="প্রথমে Environment Variables ছাড়া ডিপ্লয় হবে — পরে যোগ করব"
              />

              <Separator className="my-3" />

              {/* Environment Variables */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Key className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    Environment Variables যোগ করুন ⚠️ গুরুত্বপূর্ণ
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  ডিপ্লয় হলে Vercel Dashboard → Project → Settings → Environment Variables-এ যান এবং নিচের ভেরিয়েবলগুলো যোগ করুন:
                </p>

                <div className="space-y-3">
                  {/* DATABASE_URL */}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold">DATABASE_URL</span>
                      <Badge variant="secondary" className="text-[10px]">Required</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Turso থেকে পাওয়া URL — ফরম্যাট:{' '}
                      <code className="font-mono bg-muted px-1 rounded">libsql://pu-alrms-username.turso.io?authToken=YOUR_TOKEN</code>
                    </p>
                  </div>

                  {/* JWT_SECRET */}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold">JWT_SECRET</span>
                      <Badge variant="secondary" className="text-[10px]">Required</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      একটি র‍্যান্ডম secret key — নিচের যেকোনো কমান্ড দিয়ে তৈরি করুন:
                    </p>
                    <CodeBlock code={jwtGenSnippet} language="bash" />
                  </div>

                  {/* Optional vars */}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold">Optional Variables</span>
                      <Badge variant="outline" className="text-[10px]">Optional</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        • <code className="font-mono bg-muted px-1 rounded">ZAI_TOKEN</code> — AI features চাইলে
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              {/* Redeploy */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold">
                    Redeploy করুন
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Environment Variables যোগ করার পর:
                </p>
                <SubStep
                  icon={RefreshCw}
                  title="Vercel Dashboard → Deployments → সাম্প্রতিক deployment-এ ক্লিক"
                  description="এরপর ডানদিকে '...' (three dots) → Redeploy ক্লিক করুন"
                />
                <SubStep
                  icon={CheckCircle2}
                  title="কিছুক্ষণ অপেক্ষা করুন — ডিপ্লয় সম্পন্ন হবে"
                  description="প্রায় 2-3 মিনিট সময় লাগতে পারে"
                />
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>⚠️ সতর্কতা</AlertTitle>
                <AlertDescription>
                  Environment Variables না দিলে অ্যাপ লগইন করতে পারবে না এবং ডাটাবেস এরর দেখাবে।
                  অবশ্যই সব required variables যোগ করুন!
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary ml-auto"
                onClick={() => setCurrentStep(Math.max(0, 5))}
              >
                পরবর্তী ধাপ <ArrowRight className="size-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </Section>

        {/* ─── STEP 6: Verify Deployment ─────────────────────────── */}
        <Section index={6} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={6} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    যাচাই করুন
                  </CardTitle>
                  <CardDescription>
                    সব ঠিকমতো কাজ করছে কিনা চেক করুন — Verify everything works
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~3 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubStep
                icon={Globe}
                title="Deployed URL এ যান"
                description={
                  <span>
                    Vercel আপনাকে একটি URL দিয়েছে, যেমন:{' '}
                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      pu-alrms.vercel.app
                    </code>
                  </span>
                }
              />
              <SubStep
                icon={Eye}
                title="হোম পেজ লোড হচ্ছে কিনা দেখুন"
                description="PU-ALRMS এর login পেজ দেখা যাবে"
              />
              <SubStep
                icon={Shield}
                title="Sign in করুন"
                description="Email/Password দিয়ে লগইন করুন — নতুন অ্যাকাউন্ট রেজিস্টার করুন"
              />
              <SubStep
                icon={CheckCircle2}
                title="Dashboard দেখুন"
                description="লগইন হলে dashboard দেখা যাবে — মানে ডাটাবেস কাজ করছে!"
              />

              <Separator className="my-3" />

              {/* Seed Database */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    ডাটাবেস Seed করুন (ঐচ্ছিক)
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  ডেমো ডাটা দরকার হলে Vercel-এর মাধ্যমে seed করতে হবে:
                </p>
                <CodeBlock
                  code={`# Vercel CLI ইনস্টল করুন
npm i -g vercel

# লগইন করুন
vercel login

# আপনার প্রজেক্টে লিংক করুন
vercel link

# Seed কমান্ড চালান
vercel env pull .env.local
npx prisma db seed`}
                  language="bash"
                  showLineNumbers
                />

                <Alert className="mt-3">
                  <Info className="size-4 text-blue-500" />
                  <AlertTitle>💡 বিকল্প পদ্ধতি</AlertTitle>
                  <AlertDescription>
                    অ্যাপ ডিপ্লয় হলে Admin Panel থেকেও ব্যবহারকারী তৈরি করতে পারেন।
                    শুধু প্রথম ইউজারকে Super Admin করতে হবে — seed script সেটা করে দেয়।
                  </AlertDescription>
                </Alert>
              </div>

              <Separator className="my-3" />

              {/* Expected behavior */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  প্রত্যাশিত আচরণ (Expected Behavior)
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] shrink-0 mt-0.5">
                      সফল হলে
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Login পেজ দেখা যাবে → সাইন আপ/ইন করলে Dashboard আসবে → সব feature কাজ করবে।
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Badge className="bg-red-500/15 text-red-500 border-red-500/30 text-[10px] shrink-0 mt-0.5">
                      ডাটাবেস এরর
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &quot;500 Internal Server Error&quot; বা &quot;Prisma Client Error&quot; — DATABASE_URL ঠিক আছে কিনা চেক করুন।
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] shrink-0 mt-0.5">
                      Login এরর
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      JWT_SECRET সেট না থাকলে login কাজ করবে না। Vercel environment variables চেক করুন।
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-6" />

        {/* ─── ENV VARS REFERENCE TABLE ──────────────────────────── */}
        <Section index={7} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  <Layers className="size-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Environment Variables রেফারেন্স
                  </CardTitle>
                  <CardDescription>
                    Vercel-এ সেট করতে হবে এমন সব ভেরিয়েবল
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="required-vars">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-500" />
                      Required Variables (অবশ্যই লাগবে)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-0 mt-2">
                      <EnvVarRow
                        variable="DATABASE_URL"
                        isPublic={false}
                        source="Turso Dashboard → Databases → Settings → Connection URL (authToken সহ)"
                      />
                      <EnvVarRow
                        variable="JWT_SECRET"
                        isPublic={false}
                        source="openssl rand -hex 32 দিয়ে তৈরি করুন"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="optional-vars">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Settings className="size-4 text-muted-foreground" />
                      Optional Variables (ঐচ্ছিক)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-0 mt-2">
                      <EnvVarRow
                        variable="ZAI_TOKEN"
                        isPublic={false}
                        source="AI chat feature enable করতে (যদি থাকে)"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </Section>

        {/* ─── TROUBLESHOOTING ───────────────────────────────────── */}
        <Section index={8} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-red-500/10 border border-red-500/20 shrink-0">
                  <Bug className="size-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    সমস্যা সমাধান (Troubleshooting)
                  </CardTitle>
                  <CardDescription>
                    সাধারণ সমস্যা ও সমাধান — Common issues & fixes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {/* Issue 1 */}
                <AccordionItem value="issue-1">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2 text-left">
                      <XCircle className="size-4 text-red-500 shrink-0" />
                      ডিপ্লয় ফেইল হচ্ছে (Build Error)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-semibold">সম্ভাব্য কারণ:</p>
                        <p className="text-xs text-muted-foreground">• <code className="font-mono bg-muted px-1 rounded">output: &quot;standalone&quot;</code> next.config.ts এ আছে — মুছে দিন</p>
                        <p className="text-xs text-muted-foreground">• TypeScript এরর — লোকালে <code className="font-mono bg-muted px-1 rounded">bun run lint</code> চালান</p>
                        <p className="text-xs text-muted-foreground">• কোনো import missing — সব dependency install আছে কিনা চেক করুন</p>
                      </div>
                      <CodeBlock
                        code={`# লোকালে build টেস্ট করুন
bun install
bun run lint
bun run build`}
                        language="bash"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 2 */}
                <AccordionItem value="issue-2">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2 text-left">
                      <XCircle className="size-4 text-red-500 shrink-0" />
                      Prisma Client এরর / 500 Internal Server Error
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-semibold">সমাধান:</p>
                        <p className="text-xs text-muted-foreground">1. <code className="font-mono bg-muted px-1 rounded">DATABASE_URL</code> সঠিক কিনা চেক করুন</p>
                        <p className="text-xs text-muted-foreground">2. Auth token সহ URL ব্যবহার করুন: <code className="font-mono bg-muted px-1 rounded">libsql://...?authToken=...</code></p>
                        <p className="text-xs text-muted-foreground">3. Turso-তে ডাটাবেস আছে কিনা চেক করুন: <code className="font-mono bg-muted px-1 rounded">turso db list</code></p>
                        <p className="text-xs text-muted-foreground">4. Prisma schema-এ <code className="font-mono bg-muted px-1 rounded">provider = &quot;libsql&quot;</code> আছে কিনা নিশ্চিত করুন</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 3 */}
                <AccordionItem value="issue-3">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2 text-left">
                      <XCircle className="size-4 text-red-500 shrink-0" />
                      Login কাজ করছে না / JWT এরর
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-semibold">সমাধান:</p>
                        <p className="text-xs text-muted-foreground">1. <code className="font-mono bg-muted px-1 rounded">JWT_SECRET</code> Vercel environment variables এ আছে কিনা চেক করুন</p>
                        <p className="text-xs text-muted-foreground">2. JWT_SECRET কমপক্ষে 32 characters হতে হবে</p>
                        <p className="text-xs text-muted-foreground">3. Environment variables যোগ করার পর Redeploy করুন</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 5 */}
                <AccordionItem value="issue-5">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2 text-left">
                      <XCircle className="size-4 text-red-500 shrink-0" />
                      Pages পরিবর্তন হচ্ছে না / পুরানো ভার্সন দেখাচ্ছে
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-semibold">সমাধান:</p>
                        <p className="text-xs text-muted-foreground">1. GitHub-এ নতুন কোড পুশ হয়েছে কিনা চেক করুন</p>
                        <p className="text-xs text-muted-foreground">2. Vercel অটো-ডিপ্লয় চালু আছে কিনা দেখুন (Deployments ট্যাব)</p>
                        <p className="text-xs text-muted-foreground">3. ব্রাউজার cache ক্লিয়ার করুন: <code className="font-mono bg-muted px-1 rounded">Ctrl + Shift + R</code></p>
                        <p className="text-xs text-muted-foreground">4. ম্যানুয়ালি Redeploy করুন</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 6 */}
                <AccordionItem value="issue-6">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2 text-left">
                      <HelpCircle className="size-4 text-amber-500 shrink-0" />
                      কাস্টম ডোমেইন কিভাবে যোগ করব?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-semibold">ধাপ:</p>
                        <p className="text-xs text-muted-foreground">1. Vercel Dashboard → Project → Settings → Domains</p>
                        <p className="text-xs text-muted-foreground">2. আপনার domain (যেমন: pu-alrms.com) যোগ করুন</p>
                        <p className="text-xs text-muted-foreground">3. DNS settings-এ Vercel দেওয়া records যোগ করুন</p>
                        <p className="text-xs text-muted-foreground">4. SSL সার্টিফিকেট অটোmatic তৈরি হবে (ফ্রি!)</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </Section>

        {/* ─── QUICK CHECKLIST ───────────────────────────────────── */}
        <Section index={9} className="mb-6">
          <Card className="overflow-hidden border-dashed">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                  <CheckCircle2 className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    ডিপ্লয়মেন্ট চেকলিস্ট ✅
                  </CardTitle>
                  <CardDescription>
                    সব সম্পন্ন করেছেন কিনা চেক করুন
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'GitHub-এ কোড পুশ হয়েছে', done: true },
                  { label: 'Vercel অ্যাকাউন্ট তৈরি হয়েছে', done: true },
                  { label: 'Turso ডাটাবেস তৈরি হয়েছে', done: true },
                  { label: 'Prisma schema libsql-এ আপডেট হয়েছে', done: true },
                  { label: 'DATABASE_URL Vercel-এ সেট হয়েছে', done: true },
                  { label: 'JWT_SECRET Vercel-এ সেট হয়েছে', done: true },
                  { label: 'Redeploy করা হয়েছে', done: true },
                  { label: 'Deployed URL-এ টেস্ট করা হয়েছে', done: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border"
                  >
                    <div className="size-5 rounded-full border-2 border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="size-3 text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ─── FOOTER ─────────────────────────────────────────────── */}
        <Section index={10}>
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Rocket className="size-5 text-emerald-500" />
              <span className="text-sm font-semibold">Happy Deploying! 🎉</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              কোনো সমস্যা হলে Vercel Dashboard-এ ডিপ্লয়মেন্ট লগ চেক করুন, অথবা GitHub Issues-এ পোস্ট করুন।
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
