'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppStore, type PageView, type UserRole } from '@/store/app';
import {
  LayoutDashboard, ClipboardList, FlaskConical, Plus, FileText, Trophy,
  Megaphone, MessageSquare, Sparkles, Bell, User as UserIcon,
  LogOut, Menu, GraduationCap, Moon, Sun, BookOpen, Swords,
  Shield, BadgeCheck, Settings,
} from 'lucide-react';
import { getInitials, PageTransition, DevCredit } from '@/components/pu-helpers';

// ─── Page Components ─────────────────────────────────────
import DashboardPage from '@/components/pages/DashboardPage';
import AssignmentsPage from '@/components/pages/AssignmentsPage';
import AssignmentDetailPage from '@/components/pages/AssignmentDetailPage';
import CreateAssignmentPage from '@/components/pages/CreateAssignmentPage';
import SubmissionsPage from '@/components/pages/SubmissionsPage';
import AIChatPage from '@/components/pages/AIChatPage';
import LeaderboardPage from '@/components/pages/LeaderboardPage';
import NotificationsPage from '@/components/pages/NotificationsPage';
import ProfilePage from '@/components/pages/ProfilePage';
import StudentCommunityPage from '@/components/pages/StudentCommunityPage';
import AnnouncementsPage from '@/components/pages/AnnouncementsPage';
import QuizPage from '@/components/pages/QuizPage';
import LearnWithGame from '@/components/pages/LearnWithGame';
import BooksPage from '@/components/pages/BooksPage';
import AdminPanelPage from '@/components/pages/AdminPanelPage';

// ─── Navigation Items ────────────────────────────────────
const navItems: {
  page: PageView;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badge?: string;
  demoHidden?: boolean;
  section?: string;
}[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Main' },
  { page: 'admin-panel', label: 'Admin Panel', icon: Shield, roles: ['SUPER_ADMIN'], section: 'Main' },
  { page: 'assignments', label: 'Assignments', icon: ClipboardList, section: 'Academic' },
  { page: 'lab-reports', label: 'Lab Reports', icon: FlaskConical, section: 'Academic' },
  { page: 'create-assignment', label: 'Create Assignment', icon: Plus, roles: ['TEACHER', 'CR', 'ADMIN'], section: 'Academic' },
  { page: 'submissions', label: 'Submissions', icon: FileText, section: 'Academic' },
  { page: 'leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['STUDENT', 'CR', 'ADMIN'], section: 'Academic' },
  { page: 'announcements', label: 'Announcements', icon: Megaphone, section: 'Communication' },
  { page: 'student-community', label: 'Community Chat', icon: MessageSquare, demoHidden: true, section: 'Communication' },
  { page: 'quiz', label: 'Quick Quiz', icon: GraduationCap, section: 'Learning' },
  { page: 'code-quest', label: 'Learn With Game', icon: Swords, section: 'Learning' },
  { page: 'books', label: 'Digital Library', icon: BookOpen, section: 'Learning' },
  { page: 'ai-chat', label: 'AI Assistant', icon: Sparkles, demoHidden: true, section: 'Tools' },
  { page: 'notifications', label: 'Notifications', icon: Bell, section: 'Account' },
  { page: 'profile', label: 'Profile', icon: UserIcon, section: 'Account' },
];

// ─── Section Label ────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-5 pb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

// ─── Sidebar Navigation ──────────────────────────────────
function SidebarNav({ onNavigate, compact = false }: { onNavigate: (page: PageView) => void; compact?: boolean }) {
  const { user, currentPage, isDemoUser } = useAppStore();

  const filtered = navItems.filter(item => {
    if (item.roles && !item.roles.includes(user?.role || 'STUDENT')) return false;
    if (isDemoUser && item.demoHidden) return false;
    return true;
  });

  let currentSection = '';

  return (
    <nav className="flex flex-col py-2 flex-1" role="navigation" aria-label="Main navigation">
      {filtered.map((item) => {
        const Icon = item.icon;
        const showSectionLabel = item.section && item.section !== currentSection;
        if (item.section) currentSection = item.section;
        const isActive = currentPage === item.page;

        return (
          <React.Fragment key={item.page}>
            {showSectionLabel && !compact && <SectionLabel label={item.section!} />}
            <Button
              variant="ghost"
              className={`
                mx-2 h-9 justify-start gap-3 rounded-lg px-3 text-sm font-normal transition-all duration-200
                ${isActive
                  ? 'bg-primary/10 text-primary font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
              onClick={() => onNavigate(item.page)}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
              <span className="truncate">{item.label}</span>
            </Button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Mobile Sidebar ──────────────────────────────────────
function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen, setPage, logout } = useAppStore();
  const { user } = useAppStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 p-0 dark:bg-gray-950">
        {/* Header */}
        <SheetHeader className="p-4 border-b dark:border-gray-800">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10">
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">PU-ALRMS</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <SidebarNav onNavigate={(page) => { setPage(page); setSidebarOpen(false); }} compact />

        {/* User Card at Bottom */}
        <div className="p-3 border-t dark:border-gray-800">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-accent/50">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          <DevCredit />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Dark Mode Toggle ────────────────────────────────────
function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Page Title Map ──────────────────────────────────────
const pageTitles: Record<string, string> = {
  'dashboard': 'Dashboard',
  'admin-panel': 'Admin Panel',
  'assignments': 'Assignments',
  'lab-reports': 'Lab Reports',
  'assignment-detail': 'Assignment Details',
  'create-assignment': 'Create Assignment',
  'submissions': 'Submissions',
  'ai-chat': 'AI Assistant',
  'leaderboard': 'Leaderboard',
  'notifications': 'Notifications',
  'profile': 'Profile',
  'student-community': 'Community Chat',
  'announcements': 'Announcements',
  'quiz': 'Quick Quiz',
  'code-quest': 'Learn With Game',
  'books': 'Digital Library',
};

// ─── Main App Layout ────────────────────────────────────
export default function AppLayout() {
  const { currentPage, user, isDemoUser, toggleSidebar, notificationCount, setPage, logout } = useAppStore();

  // Listen for auth-expired events and auto-logout
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [logout]);

  const renderPage = () => {
    // Demo users cannot access hidden pages
    const demoHiddenPages: PageView[] = ['student-community', 'ai-chat', 'create-assignment', 'admin-panel'];
    if (isDemoUser && demoHiddenPages.includes(currentPage)) {
      return <DashboardPage />;
    }
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'assignments': return <AssignmentsPage />;
      case 'lab-reports': return <AssignmentsPage type="LAB_REPORT" />;
      case 'assignment-detail': return <AssignmentDetailPage />;
      case 'create-assignment': return <CreateAssignmentPage />;
      case 'submissions': return <SubmissionsPage />;
      case 'ai-chat': return <AIChatPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <ProfilePage />;
      case 'student-community': return <StudentCommunityPage />;
      case 'announcements': return <AnnouncementsPage />;
      case 'quiz': return <QuizPage />;
      case 'code-quest': return <LearnWithGame />;
      case 'books': return <BooksPage />;
      case 'admin-panel': return <AdminPanelPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card fixed top-0 left-0 h-full z-40 overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-tight">PU-ALRMS</h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 ml-12">Prime University</p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav onNavigate={(page) => setPage(page)} />
        </div>

        {/* Footer */}
        <div className="p-3 border-t">
          <DevCredit />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between h-14 px-4 gap-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={toggleSidebar}>
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-sm font-medium text-muted-foreground truncate max-w-[160px] sm:max-w-none">
                {pageTitles[currentPage] || currentPage.replace(/-/g, ' ')}
              </h2>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setPage('notifications')}
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </motion.span>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium leading-tight">{user?.name?.split(' ')[0]}</span>
                        {user?.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <span className="text-[10px] leading-tight text-muted-foreground capitalize">
                        {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'CR' ? 'Class Rep' : user?.role === 'DEVELOPER' ? 'Developer' : user?.role}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPage('profile')}>
                    <UserIcon className="w-4 h-4 mr-2" />Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('notifications')}>
                    <Bell className="w-4 h-4 mr-2" />Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        {/* Demo Mode Banner */}
        {isDemoUser && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200"
          >
            <Shield className="w-4 h-4 shrink-0" />
            <p className="text-xs flex-1">
              <span className="font-semibold">Demo Mode</span> — Read-only access. Some features are restricted.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[11px] hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg"
              onClick={logout}
            >
              Exit
            </Button>
          </motion.div>
        )}

        <main className="flex-1 p-4 pb-[env(safe-area-inset-bottom)] md:p-6 min-w-0 overflow-x-hidden">
          <PageTransition keyProp={currentPage}>
            {renderPage()}
          </PageTransition>
        </main>
      </div>

      <MobileSidebar />
    </div>
  );
}
