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
  Shield, BadgeCheck,
} from 'lucide-react';
import { getInitials, PageTransition, DevCredit, playNotificationSound } from '@/components/pu-helpers';

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

// ─── Sidebar Navigation ──────────────────────────────────
function SidebarNav({ onNavigate }: { onNavigate: (page: PageView) => void }) {
  const { user, currentPage, isDemoUser } = useAppStore();

  const navItems: { page: PageView; label: string; icon: React.ReactNode; roles?: UserRole[]; badge?: string; demoHidden?: boolean }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { page: 'admin-panel', label: 'Admin Panel', icon: <Shield className="w-4 h-4" />, roles: ['SUPER_ADMIN'] },
    { page: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
    { page: 'lab-reports', label: 'Lab Reports', icon: <FlaskConical className="w-4 h-4" /> },
    { page: 'create-assignment', label: 'Create Assignment', icon: <Plus className="w-4 h-4" />, roles: ['TEACHER', 'CR', 'ADMIN'] },
    { page: 'submissions', label: user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions', icon: <FileText className="w-4 h-4" /> },
    { page: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" />, roles: ['STUDENT', 'CR', 'ADMIN'] },
    { page: 'announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
    { page: 'student-community', label: 'Community Chat', icon: <MessageSquare className="w-4 h-4" />, demoHidden: true },
    { page: 'quiz', label: 'Quick Quiz', icon: <GraduationCap className="w-4 h-4" /> },
    { page: 'code-quest', label: 'Learn With Game', icon: <Swords className="w-4 h-4" /> },
    { page: 'books', label: 'Digital Library', icon: <BookOpen className="w-4 h-4" /> },
    { page: 'ai-chat', label: 'Lucky Strick AI', icon: <Sparkles className="w-4 h-4" />, demoHidden: true },
    { page: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { page: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const filtered = navItems.filter(item => {
    // Hide items restricted by role
    if (item.roles && !item.roles.includes(user?.role || 'STUDENT')) return false;
    // Hide write-interactive features for demo users
    if (isDemoUser && item.demoHidden) return false;
    return true;
  });

  return (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      {filtered.map((item) => (
        <motion.div key={item.page} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={currentPage === item.page ? 'secondary' : 'ghost'}
            className={`w-full h-10 md:h-9 justify-start gap-3 rounded-r-lg rounded-l-none border-l-2 ${currentPage === item.page ? 'border-l-emerald-500 bg-emerald-100 text-emerald-800 font-medium dark:bg-emerald-900/40 dark:text-emerald-300' : 'border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-emerald-300 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'}`}
            onClick={() => onNavigate(item.page)}
          >
            {item.icon}
            {item.label}
          </Button>
        </motion.div>
      ))}
    </nav>
  );
}

// ─── Mobile Sidebar ──────────────────────────────────────
function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen, setPage } = useAppStore();
  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 p-0 dark:bg-gray-900">
        <SheetHeader className="p-4 border-b dark:border-gray-800">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-gray-200/60 dark:ring-gray-700/60">
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <span>PU-ALRMS</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={(page) => { setPage(page); setSidebarOpen(false); }} />
        <div className="p-3 border-t dark:border-gray-800">
          <DevCredit />
          <div className="flex justify-center mt-1.5">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">v2.0</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Dark Mode Toggle ────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
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
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 overflow-hidden max-w-full w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 fixed top-0 left-0 h-full z-40 overflow-y-auto overflow-x-hidden">
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-700/60">
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-gray-900 dark:text-white tracking-tight">PU-ALRMS</h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-12">Prime University</p>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav onNavigate={(page) => setPage(page)} />
        </div>
        <div className="p-3 border-t dark:border-gray-800">
          <DevCredit />
          <div className="flex justify-center mt-1.5">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">v2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm min-w-0 overflow-x-hidden">
          <div className="flex items-center justify-between h-14 px-4 gap-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden h-11 w-11" onClick={toggleSidebar}>
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize truncate max-w-[160px] sm:max-w-none">
                {currentPage === 'student-community' ? 'Community Chat' : currentPage === 'announcements' ? 'Announcements' : currentPage === 'ai-chat' ? 'Lucky Strick AI' : currentPage === 'books' ? 'Digital Library' : currentPage === 'quiz' ? 'Quick Quiz' : currentPage === 'code-quest' ? 'Learn With Game' : currentPage === 'admin-panel' ? 'Admin Panel' : currentPage.replace(/-/g, ' ')}
              </h2>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11"
                onClick={() => { playNotificationSound(); setPage('notifications'); }}
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </motion.span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-11 px-3">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium leading-tight dark:text-gray-200">{user?.name?.split(' ')[0]}</span>
                        {user?.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <span className="text-[10px] leading-tight text-gray-400 dark:text-gray-500 capitalize">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'CR' ? 'Class Rep' : user?.role === 'ADMIN' ? 'Admin' : user?.role === 'DEVELOPER' ? 'Developer' : user?.role}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-800">
                  <DropdownMenuItem onClick={() => setPage('profile')} className="dark:text-gray-300 dark:focus:bg-gray-800">
                    <UserIcon className="w-4 h-4 mr-2" />Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('notifications')} className="dark:text-gray-300 dark:focus:bg-gray-800">
                    <Bell className="w-4 h-4 mr-2" />Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-gray-800" />
                  <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 dark:focus:bg-gray-800">
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
          <div
            className="mx-4 md:mx-6 mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.12)' }}
          >
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300/80 flex-1">
              <span className="font-semibold text-amber-300">Demo Mode</span> — You have read-only access. Some features are restricted.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg"
              onClick={logout}
            >
              Exit Demo
            </Button>
          </div>
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
