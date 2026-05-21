'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Terminal,
  Shield,
  Key,
  Globe,
  Flame,
  Code2,
  Settings,
  Server,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowRight,
  FileWarning,
  Eye,
  Zap,
  HelpCircle,
  BookOpen,
  Layers,
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
    { label: 'Console Setup', icon: Globe },
    { label: 'Web App', icon: Code2 },
    { label: 'Auth', icon: Shield },
    { label: 'Environment', icon: Key },
    { label: 'Deploy', icon: Zap },
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
  description: string;
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
export default function FirebaseGuidePage() {
  const [currentStep, setCurrentStep] = useState(0);

  // Determine if Firebase appears configured (client-side check)
  const [isConfigured, setIsConfigured] = useState(false);

  // Check Firebase config on mount
  useState(() => {
    // Simple client-side check for common env var indicators
    // These will be defined by Next.js at build time if they exist in .env
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    setIsConfigured(!!(apiKey && projectId && appId));
  });

  const envLocalContent = `# ═══════════════════════════════════════════
# PU-ALRMS Firebase Configuration
# ═══════════════════════════════════════════
# এই ফাইলটি .env.local নামে সেভ করুন
# .gitignore এ আছে — Git-এ কমিট হবে না
# ═══════════════════════════════════════════

# Firebase Web App Config (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pu-alrms.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pu-alrms
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pu-alrms.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK (Private — Server-side only)
FIREBASE_PROJECT_ID=pu-alrms
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@pu-alrms.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"`;

  const firebaseConfigExample = `// Firebase Console → Project Settings → Web Apps → Config
const firebaseConfig = {
  apiKey:            "AIzaSy...",                        // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain:        "pu-alrms.firebaseapp.com",         // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId:         "pu-alrms",                          // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket:     "pu-alrms.appspot.com",              // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",                         // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId:             "1:123456789:web:abcdef123456",      // → NEXT_PUBLIC_FIREBASE_APP_ID
};`;

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <Section index={0} className="mb-8">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 mb-4"
            >
              <Flame className="size-8 text-amber-500" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
              🔗 Firebase Setup Guide
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Google Firebase সেটআপ করুন ধাপে ধাপে — Step-by-step setup guide for PU-ALRMS
            </p>

            {/* Status badge */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge
                variant={isConfigured ? 'default' : 'destructive'}
                className="gap-1.5 px-3 py-1 text-xs"
              >
                {isConfigured ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    Firebase Configured ✅
                  </>
                ) : (
                  <>
                    <XCircle className="size-3.5" />
                    Not Configured
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Progress Stepper */}
          <ProgressStepper currentStep={currentStep} />
        </Section>

        <Separator className="my-6" />

        {/* ─── STEP 1: Create Firebase Project ──────────────────── */}
        <Section index={1} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={1} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Firebase Project তৈরি করুন
                  </CardTitle>
                  <CardDescription>
                    Google Firebase Console-এ নতুন প্রজেক্ট তৈরি করুন
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
                title="Firebase Console-এ যান"
                description={
                  <span>
                    ব্রাউজারে খুলুন:{' '}
                    <span className="inline-flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                      https://console.firebase.google.com
                      <CopyButton text="https://console.firebase.google.com" size="icon" />
                    </span>
                  </span>
                }
              />
              <SubStep
                icon={Settings}
                title='"Create a project" / "Add project" ক্লিক করুন'
                description="প্রজেক্ট তৈরির পেজে নিচের তথ্য দিন"
              />
              <SubStep
                icon={BookOpen}
                title="Project name: PU-ALRMS"
                description="আপনার ইউনিভার্সিটি নাম ব্যবহার করতে পারেন"
                isAction
              />
              <SubStep
                icon={Code2}
                title="Project ID: pu-alrms"
                description="ছোট হাতের, কোনো স্পেস নেই (lowercase, no spaces)"
                isAction
              />
              <SubStep
                icon={Shield}
                title="Google Analytics বন্ধ রাখুন (Disable)"
                description="এখন প্রয়োজন নেই — &quot;Disable&quot; সিলেক্ট করুন"
              />
              <SubStep
                icon={CheckCircle2}
                title='"Create project" ক্লিক করুন'
                description="কিছুক্ষণ অপেক্ষা করুন, প্রজেক্ট তৈরি হবে"
              />

              <Alert className="mt-3">
                <Info className="size-4 text-blue-500" />
                <AlertTitle>💡 Tip</AlertTitle>
                <AlertDescription>
                  একটি Google অ্যাকাউন্ট দরকার। যদি আপনার ইউনিভার্সিটি ইমেইল থাকে (Google Workspace),
                  সেটি ব্যবহার করা ভালো।
                </AlertDescription>
              </Alert>
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

        {/* ─── STEP 2: Register Web App ─────────────────────────── */}
        <Section index={2} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={2} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    ওয়েব অ্যাপ রেজিস্টার করুন
                  </CardTitle>
                  <CardDescription>
                    Firebase প্রজেক্টে ওয়েব অ্যাপ যোগ করুন
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
                title="Project Overview পেজে যান"
                description="প্রজেক্ট তৈরির পর আপনি overview পেজে থাকবেন"
              />
              <SubStep
                icon={Code2}
                title="`</>` আইকনে ক্লিক করুন (Web icon)"
                description="পেজের মাঝখানে &quot;Add app&quot; বা &quot;</>&quot; আইকন দেখা যাবে"
              />
              <SubStep
                icon={BookOpen}
                title="App nickname: pu-alrms-web"
                description="যেকোনো নাম দিতে পারেন, কিন্তু এটি সহজ রাখুন"
                isAction
              />
              <SubStep
                icon={FileWarning}
                title='"Also set up Firebase Hosting" — আনচেক করুন!'
                description="হোস্টিং এখন দরকার নেই, অবশ্যই আনচেক করুন"
                isAction
              />
              <SubStep
                icon={CheckCircle2}
                title='"Register app" ক্লিক করুন'
                description="রেজিস্ট্রেশন সম্পন্ন হবে"
              />

              <Separator className="my-3" />

              {/* Config Example */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Key className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    firebaseConfig কপি করুন ⚠️ গুরুত্বপূর্ণ
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  &quot;Register app&quot; এর পর আপনি একটি <code className="font-mono bg-muted px-1 rounded">firebaseConfig</code> অবজেক্ট দেখতে পাবেন। সম্পূর্ণ অবজেক্টটি কপি করুন:
                </p>
                <CodeBlock code={firebaseConfigExample} language="javascript" showLineNumbers />

                <Alert className="mt-3">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <AlertTitle>সাবধান!</AlertTitle>
                  <AlertDescription>
                    এই কনফিগারেশনে আপনার আসল API Key থাকবে। এটি <strong>কখনো</strong> Git-এ কমিট করবেন না।
                    শুধুমাত্র <code className="font-mono text-xs bg-muted px-1 rounded">.env.local</code> ফাইলে রাখুন।
                  </AlertDescription>
                </Alert>
              </div>
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

        {/* ─── STEP 3: Enable Google Auth ────────────────────────── */}
        <Section index={3} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={3} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Google Login চালু করুন
                  </CardTitle>
                  <CardDescription>
                    Firebase Authentication-এ Google Sign-In সক্রিয় করুন
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~2 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubStep
                icon={Shield}
                title="Authentication → Sign-in method এ যান"
                description="বাম সাইডবার থেকে Authentication সিলেক্ট করুন"
              />
              <SubStep
                icon={Globe}
                title='"Google" প্রোভাইডার সিলেক্ট করুন'
                description="Sign-in providers তালিকা থেকে Google খুঁজুন"
              />
              <SubStep
                icon={Zap}
                title="Enable করুন → Support email সিলেক্ট করুন"
                description="আপনার Google ইমেইল সিলেক্ট করুন"
                isAction
              />
              <SubStep
                icon={CheckCircle2}
                title='"Save" ক্লিক করুন'
                description="Google Authentication সক্রিয় হয়ে যাবে"
              />

              <Separator className="my-3" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="size-4 text-blue-500" />
                  <h4 className="text-sm font-semibold">
                    Authorized Domains সেট করুন
                  </h4>
                </div>
                <SubStep
                  icon={Settings}
                  title="Authentication → Settings → Authorized domains"
                  description="লোকাল ডেভেলপমেন্টের জন্য domain যোগ করতে হবে"
                />
                <SubStep
                  icon={BookOpen}
                  title="Add domain: localhost"
                  description="লোকাল ডেভেলপমেন্টের জন্য অবশ্যই যোগ করুন"
                  isAction
                />
                <SubStep
                  icon={Info}
                  title="Deploy-এর পর আপনার আসল domain যোগ করুন"
                  description="যেমন: yourdomain.com, vercel.app ইত্যাদি"
                />
              </div>

              <Alert>
                <Info className="size-4 text-blue-500" />
                <AlertTitle>💡 লোকাল ডেভেলপমেন্ট</AlertTitle>
                <AlertDescription>
                  <code className="font-mono text-xs bg-muted px-1 rounded">localhost</code> ডোমেইন যোগ না করলে
                  <code className="font-mono text-xs bg-muted px-1 rounded ml-1">auth/unauthorized-domain</code> এরর আসবে।
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

        {/* ─── STEP 4: Service Account Key ──────────────────────── */}
        <Section index={4} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={4} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Service Account Key নিন
                  </CardTitle>
                  <CardDescription>
                    Admin SDK-এর জন্য (ঐচ্ছিক — Optional)
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  Optional
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="mb-2">
                <Info className="size-4 text-blue-500" />
                <AlertTitle>ঐচ্ছিক ধাপ</AlertTitle>
                <AlertDescription>
                  এই ধাপটি শুধুমাত্র সার্ভার-সাইড Firebase Admin SDK-এর জন্য দরকার।
                  শুধু Google Sign-In চাইলে এটি স্কিপ করতে পারেন।
                </AlertDescription>
              </Alert>

              <SubStep
                icon={Settings}
                title="Project Settings → Service Accounts এ যান"
                description="প্রজেক্ট সেটিংসের নিচে Service Accounts ট্যাব আছে"
              />
              <SubStep
                icon={Key}
                title='"Generate New Private Key" ক্লিক করুন'
                description="একটি JSON ফাইল ডাউনলোড হবে"
              />
              <SubStep
                icon={FileWarning}
                title="JSON ফাইল সেভ করুন — কখনো শেয়ার করবেন না!"
                description="এতে আপনার Private Key আছে, এটি গোপন রাখুন"
                isAction
              />

              <Separator className="my-3" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold">
                    JSON ফাইল থেকে এনভায়রনমেন্ট ভেরিয়েবল:
                  </h4>
                </div>
                <div className="space-y-1 text-xs font-mono bg-muted/50 rounded-lg p-3 border">
                  <p className="text-muted-foreground mb-1 font-sans text-[11px]">
                    JSON ফাইলের মধ্যে থেকে নিচের ভ্যালু নিন:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">FIREBASE_PROJECT_ID</span>
                    <span className="text-muted-foreground">←</span>
                    <span className="text-foreground/70">project_id</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">FIREBASE_CLIENT_EMAIL</span>
                    <span className="text-muted-foreground">←</span>
                    <span className="text-foreground/70">client_email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">FIREBASE_PRIVATE_KEY</span>
                    <span className="text-muted-foreground">←</span>
                    <span className="text-foreground/70">private_key</span>
                  </div>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>⚠️ সতর্কতা</AlertTitle>
                <AlertDescription>
                  Private Key কখনো ক্লায়েন্ট-সাইড কোডে ব্যবহার করবেন না!
                  এটি শুধুমাত্র সার্ভার-সাইড (.env.local) রাখুন।
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

        {/* ─── STEP 5: Environment Setup ────────────────────────── */}
        <Section index={5} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={5} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    এনভায়রনমেন্ট সেটআপ করুন
                  </CardTitle>
                  <CardDescription>
                    .env.local ফাইল তৈরি করুন — কনফিগারেশন সেট করুন
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~5 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Method 1: Script */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold">
                    পদ্ধতি ১: স্ক্রিপ্ট ব্যবহার করুন (Script)
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  প্রজেক্ট রুটে নিচের কমান্ড চালান:
                </p>
                <CodeBlock code="bash setup-firebase.sh" language="bash" />
              </div>

              <Separator />

              {/* Method 2: Manual */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    পদ্ধতি ২: ম্যানুয়ালি সেট করুন (Manual)
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  প্রজেক্ট রুটে <code className="font-mono bg-muted px-1 rounded">.env.local</code> ফাইল তৈরি করুন
                  এবং নিচের ফরম্যাটে ভ্যালু দিন:
                </p>
                <CodeBlock code={envLocalContent} language="env" showLineNumbers />

                <Alert className="mt-3">
                  <Info className="size-4 text-blue-500" />
                  <AlertTitle>📝 মনে রাখুন</AlertTitle>
                  <AlertDescription>
                    <code className="font-mono text-xs bg-muted px-1 rounded">NEXT_PUBLIC_</code> দিয়ে শুরু হলে
                    এটি ক্লায়েন্ট-সাইডেও পাওয়া যায়। ছাড়া থাকলে শুধু সার্ভার-সাইড।
                  </AlertDescription>
                </Alert>
              </div>
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

        {/* ─── STEP 6: Verify Setup ─────────────────────────────── */}
        <Section index={6} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepBadge number={6} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    সেটআপ যাচাই করুন
                  </CardTitle>
                  <CardDescription>
                    সব ঠিকমতো কাজ করছে কিনা চেক করুন
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  ~1 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubStep
                icon={Terminal}
                title="ডেভ সার্ভার চালু করুন"
                description={
                  <span>
                    কমান্ড:{' '}
                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      bun run dev
                    </code>
                  </span>
                }
              />
              <SubStep
                icon={Globe}
                title="ব্রাউজারে খুলুন"
                description={
                  <span>
                    ঠিকানা:{' '}
                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      http://localhost:3000
                    </code>
                  </span>
                }
              />
              <SubStep
                icon={Eye}
                title="Login পেজে &quot;Sign in with Google&quot; বাটন দেখুন"
                description="Firebase কনফিগার থাকলে বাটন ক্লিকযোগ্য থাকবে"
              />

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
                      কনফিগার থাকলে
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &quot;Sign in with Google&quot; বাটনে ক্লিক করলে Google popup আসবে।
                      সাইন-ইন করলে প্রোফাইল পেজে যাবে।
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] shrink-0 mt-0.5">
                      কনফিগার না থাকলে
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      বাটন থাকবে কিন্তু ক্লিক করলে error দেখাবে।
                      অ্যাপ Email/Password login-এ fallback করবে — চিন্তার কিছু নেই!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-6" />

        {/* ─── ENV VARS REFERENCE TABLE (Accordion) ─────────────── */}
        <Section index={7} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  <Layers className="size-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    এনভায়রনমেন্ট ভেরিয়েবল রেফারেন্স
                  </CardTitle>
                  <CardDescription>
                    সব env vars-এর তালিকা ও কোথায় পাবেন
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="public-vars">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Globe className="size-4 text-primary" />
                      Public Variables (NEXT_PUBLIC_*)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-0 mt-2">
                      <EnvVarRow
                        variable="NEXT_PUBLIC_FIREBASE_API_KEY"
                        isPublic
                        source="Firebase Console → Project Settings → Web App Config"
                      />
                      <EnvVarRow
                        variable="NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
                        isPublic
                        source="Same config object → authDomain"
                      />
                      <EnvVarRow
                        variable="NEXT_PUBLIC_FIREBASE_PROJECT_ID"
                        isPublic
                        source="Same config object → projectId"
                      />
                      <EnvVarRow
                        variable="NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
                        isPublic
                        source="Same config object → storageBucket"
                      />
                      <EnvVarRow
                        variable="NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
                        isPublic
                        source="Same config object → messagingSenderId"
                      />
                      <EnvVarRow
                        variable="NEXT_PUBLIC_FIREBASE_APP_ID"
                        isPublic
                        source="Same config object → appId"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="private-vars">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Shield className="size-4 text-amber-500" />
                      Private Variables (Server-side only)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-0 mt-2">
                      <EnvVarRow
                        variable="FIREBASE_PROJECT_ID"
                        isPublic={false}
                        source="Service Account JSON → project_id"
                      />
                      <EnvVarRow
                        variable="FIREBASE_CLIENT_EMAIL"
                        isPublic={false}
                        source="Service Account JSON → client_email"
                      />
                      <EnvVarRow
                        variable="FIREBASE_PRIVATE_KEY"
                        isPublic={false}
                        source="Service Account JSON → private_key"
                      />
                    </div>
                    <Alert className="mt-3" variant="destructive">
                      <AlertTriangle className="size-4" />
                      <AlertTitle>🔒 গোপনীয়</AlertTitle>
                      <AlertDescription>
                        এই ভেরিয়েবলগুলো কখনো ক্লায়েন্ট-সাইড কোডে ব্যবহার করবেন না।
                        শুধুমাত্র সার্ভার-সাইড API routes-এ ব্যবহৃত হয়।
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="full-table">
                  <AccordionTrigger className="text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      Full Reference Table
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/80 border-b">
                              <th className="text-left font-semibold p-3">Variable</th>
                              <th className="text-center font-semibold p-3">Public?</th>
                              <th className="text-left font-semibold p-3">Where to find</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            <tr className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-mono text-[11px] break-all">NEXT_PUBLIC_FIREBASE_API_KEY</td>
                              <td className="p-3 text-center">✅ Yes</td>
                              <td className="p-3 text-muted-foreground">Firebase Console → Project Settings → Web App Config</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-mono text-[11px] break-all">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</td>
                              <td className="p-3 text-center">✅ Yes</td>
                              <td className="p-3 text-muted-foreground">Same config object</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-mono text-[11px] break-all">NEXT_PUBLIC_FIREBASE_PROJECT_ID</td>
                              <td className="p-3 text-center">✅ Yes</td>
                              <td className="p-3 text-muted-foreground">Same config object</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-mono text-[11px] break-all">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</td>
                              <td className="p-3 text-center">✅ Yes</td>
                              <td className="p-3 text-muted-foreground">Same config object</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-mono text-[11px] break-all">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</td>
                              <td className="p-3 text-center">✅ Yes</td>
                              <td className="p-3 text-muted-foreground">Same config object</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-mono text-[11px] break-all">NEXT_PUBLIC_FIREBASE_APP_ID</td>
                              <td className="p-3 text-center">✅ Yes</td>
                              <td className="p-3 text-muted-foreground">Same config object</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors bg-amber-500/5">
                              <td className="p-3 font-mono text-[11px] break-all">FIREBASE_PROJECT_ID</td>
                              <td className="p-3 text-center">❌ No</td>
                              <td className="p-3 text-muted-foreground">Service Account JSON</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors bg-amber-500/5">
                              <td className="p-3 font-mono text-[11px] break-all">FIREBASE_CLIENT_EMAIL</td>
                              <td className="p-3 text-center">❌ No</td>
                              <td className="p-3 text-muted-foreground">Service Account JSON</td>
                            </tr>
                            <tr className="hover:bg-muted/30 transition-colors bg-amber-500/5">
                              <td className="p-3 font-mono text-[11px] break-all">FIREBASE_PRIVATE_KEY</td>
                              <td className="p-3 text-center">❌ No</td>
                              <td className="p-3 text-muted-foreground">Service Account JSON</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </Section>

        {/* ─── TROUBLESHOOTING (Accordion) ──────────────────────── */}
        <Section index={8} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-red-500/10 border border-red-500/20 shrink-0">
                  <HelpCircle className="size-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    সমস্যা সমাধান
                  </CardTitle>
                  <CardDescription>
                    সাধারণ সমস্যা ও সমাধান — Troubleshooting common issues
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full" defaultValue={['issue-1']}>
                {/* Issue 1 */}
                <AccordionItem value="issue-1">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <XCircle className="size-3.5 text-red-400 shrink-0" />
                      <code className="font-mono text-xs text-red-400">auth/unauthorized-domain</code>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        এই এরর আসে যখন আপনার ডোমেইন Firebase Authorized Domains-এ নেই।
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 border space-y-2">
                        <p className="text-xs font-medium">সমাধান:</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>Firebase Console → Authentication → Settings</li>
                          <li>&quot;Authorized domains&quot; সেকশনে যান</li>
                          <li>
                            <code className="font-mono bg-muted px-1 rounded">localhost</code> যোগ করুন
                          </li>
                          <li>Deploy-এর পর আপনার আসল domain যোগ করুন</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 2 */}
                <AccordionItem value="issue-2">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <XCircle className="size-3.5 text-red-400 shrink-0" />
                      <code className="font-mono text-xs text-red-400">Firebase not configured</code>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        এই মেসেজ আসে যখন .env.local ফাইল নেই বা Firebase কনফিগারেশন সঠিক নয়।
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 border space-y-2">
                        <p className="text-xs font-medium">সমাধান:</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>
                            প্রজেক্ট রুটে <code className="font-mono bg-muted px-1 rounded">.env.local</code> ফাইল আছে কিনা চেক করুন
                          </li>
                          <li>সব NEXT_PUBLIC_FIREBASE_* ভেরিয়েবল সঠিক ভ্যালু দিন</li>
                          <li>সার্ভার restart করুন: <code className="font-mono bg-muted px-1 rounded">Ctrl+C</code> তারপর <code className="font-mono bg-muted px-1 rounded">bun run dev</code></li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 3 */}
                <AccordionItem value="issue-3">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <XCircle className="size-3.5 text-red-400 shrink-0" />
                      <code className="font-mono text-xs text-red-400">SDK load timed out</code>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Firebase SDK লোড হতে সময় নিচ্ছে বা নেটওয়ার্ক সমস্যা।
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 border space-y-2">
                        <p className="text-xs font-medium">সমাধান:</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>ইন্টারনেট কানেকশন চেক করুন</li>
                          <li>Ad-blocker / VPN বন্ধ করে চেক করুন</li>
                          <li>ব্রাউজার console-এ আরো তথ্য দেখুন (F12 → Console)</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 4 */}
                <AccordionItem value="issue-4">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <XCircle className="size-3.5 text-red-400 shrink-0" />
                      Button দেখাচ্ছে না
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        &quot;Sign in with Google&quot; বাটন দেখা যাচ্ছে না।
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 border space-y-2">
                        <p className="text-xs font-medium">সমাধান:</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>
                            <code className="font-mono bg-muted px-1 rounded">isFirebaseReady</code> state চেক করুন
                          </li>
                          <li>ব্রাউজার console-এ Firebase SDK লোড হচ্ছে কিনা দেখুন</li>
                          <li>.env.local ফাইলে ভ্যালু আছে কিনা ভেরিফাই করুন</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issue 5 */}
                <AccordionItem value="issue-5">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <XCircle className="size-3.5 text-red-400 shrink-0" />
                      Token exchange failed
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Google থেকে সাইন-ইন হচ্ছে কিন্তু টোকেন এক্সচেঞ্জ ব্যর্থ হচ্ছে।
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 border space-y-2">
                        <p className="text-xs font-medium">সমাধান:</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>
                            API route <code className="font-mono bg-muted px-1 rounded">/api/auth/firebase</code> কাজ করছে কিনা চেক করুন
                          </li>
                          <li>সার্ভার লগ দেখুন (Terminal)</li>
                          <li>Private env vars (Admin SDK) সঠিক আছে কিনা চেক করুন</li>
                          <li>Service Account JSON-এর client_email ও private_key ভেরিফাই করুন</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </Section>

        {/* ─── IMPORTANT NOTES ──────────────────────────────────── */}
        <Section index={9} className="mb-8">
          <Card className="overflow-hidden border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-amber-500/15 border border-amber-500/25 shrink-0">
                  <AlertTriangle className="size-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    গুরুত্বপূর্ণ নোট
                  </CardTitle>
                  <CardDescription>
                    সবসময় মনে রাখবেন — Important things to remember
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>🚫 .env.local কখনো Git-এ কমিট করবেন না!</AlertTitle>
                <AlertDescription>
                  <code className="font-mono text-xs bg-muted/50 px-1 rounded">.env.local</code> ফাইলটি <code className="font-mono text-xs bg-muted/50 px-1 rounded">.gitignore</code> এ আছে।
                  কোনোভাবেই API Key বা Secret Git repository-তে পাঠাবেন না। এটি security risk.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>🔒 Private Key ক্লায়েন্ট-সাইডে ব্যবহার নিষেধ</AlertTitle>
                <AlertDescription>
                  Firebase Private Key শুধুমাত্র সার্ভার-সাইডে ব্যবহার করুন।
                  কখনো <code className="font-mono text-xs bg-muted/50 px-1 rounded">NEXT_PUBLIC_</code> দিয়ে Private Key expose করবেন না।
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="size-4 text-blue-500" />
                <AlertTitle>📝 Firebase ঐচ্ছিক (Optional)</AlertTitle>
                <AlertDescription>
                  এই প্রজেক্টে custom JWT auth ব্যবহৃত হয়। Firebase শুধু Google Sign-In-এর জন্য দরকার।
                  Firebase না থাকলে অ্যাপ Email/Password login-এ কাজ করবে — কোনো সমস্যা নেই!
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="size-4 text-blue-500" />
                <AlertTitle>🔄 Fallback সিস্টেম</AlertTitle>
                <AlertDescription>
                  Firebase কনফিগার না থাকলে অ্যাপ স্বয়ংক্রিয়ভাবে Email/Password login-এ fallback করে।
                  ব্যবহারকারীরা সবসময় লগইন করতে পারবেন।
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </Section>

        {/* ─── FOOTER ──────────────────────────────────────────── */}
        <Section index={10}>
          <div className="text-center py-6">
            <Separator className="mb-6" />
            <div className="flex items-center justify-center gap-2 mb-3">
              <Flame className="size-5 text-amber-500" />
              <span className="text-sm font-semibold">PU-ALRMS Firebase Guide</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              এই গাইডটি PU-ALRMS প্রজেক্টে Google Firebase সেটআপ করার জন্য।
              কোনো সমস্যা হলে ডেভেলপারকে জানান।
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-[10px] gap-1">
                <Server className="size-3" />
                Next.js 16
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Flame className="size-3" />
                Firebase
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Shield className="size-3" />
                Kali Linux
              </Badge>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
