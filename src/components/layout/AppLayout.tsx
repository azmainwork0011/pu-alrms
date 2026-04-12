'use client';

import React from 'react';
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
  LogOut, Menu, GraduationCap, Moon, Sun,
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

// ─── Sidebar Navigation ──────────────────────────────────
function SidebarNav({ onNavigate }: { onNavigate: (page: PageView) => void }) {
  const { user, currentPage } = useAppStore();

  const navItems: { page: PageView; label: string; icon: React.ReactNode; roles?: UserRole[]; badge?: string }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { page: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
    { page: 'lab-reports', label: 'Lab Reports', icon: <FlaskConical className="w-4 h-4" /> },
    { page: 'create-assignment', label: 'Create Assignment', icon: <Plus className="w-4 h-4" />, roles: ['TEACHER', 'CR', 'ADMIN'] },
    { page: 'submissions', label: user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions', icon: <FileText className="w-4 h-4" /> },
    { page: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" />, roles: ['STUDENT', 'CR', 'ADMIN'] },
    { page: 'announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
    { page: 'student-community', label: 'Community Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { page: 'quiz', label: 'Quick Quiz', icon: <GraduationCap className="w-4 h-4" /> },
    { page: 'ai-chat', label: 'Lucky Strick AI', icon: <Sparkles className="w-4 h-4" /> },
    { page: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { page: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const filtered = navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'STUDENT'));

  return (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      {filtered.map((item) => (
        <motion.div key={item.page} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={currentPage === item.page ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 ${currentPage === item.page ? 'bg-emerald-100 text-emerald-800 font-medium dark:bg-emerald-900/30 dark:text-emerald-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
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
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </div>
            PU-ALRMS
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={(page) => { setPage(page); setSidebarOpen(false); }} />
        <div className="p-3 border-t dark:border-gray-800">
          <DevCredit />
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
  const { currentPage, user, toggleSidebar, notificationCount, setPage, logout } = useAppStore();

  const renderPage = () => {
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
      default: return <DashboardPage />;
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 fixed top-0 left-0 h-full z-40">
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-sm">
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">PU-ALRMS</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Prime University</p>
            </div>
          </div>
        </div>
        <SidebarNav onNavigate={(page) => setPage(page)} />
        <div className="p-3 border-t dark:border-gray-800 mt-auto">
          <DevCredit />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden h-11 w-11" onClick={toggleSidebar}>
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                {currentPage === 'student-community' ? 'Community Chat' : currentPage === 'announcements' ? 'Announcements' : currentPage === 'ai-chat' ? 'Lucky Strick AI' : currentPage.replace(/-/g, ' ')}
              </h2>
            </div>

            <div className="flex items-center gap-2">
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
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
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
                    <span className="text-sm font-medium hidden sm:block dark:text-gray-200">{user?.name?.split(' ')[0]}</span>
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
        <main className="flex-1 p-4 md:p-6">
          <PageTransition keyProp={currentPage}>
            {renderPage()}
          </PageTransition>
        </main>
      </div>

      <MobileSidebar />
    </div>
  );
}
