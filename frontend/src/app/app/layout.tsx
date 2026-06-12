'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Brain,
  Settings,
  Menu,
  X,
  Zap,
  LogOut,
  Bell,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';

const navItems = [
  { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/app/documents', icon: FileText, label: 'Documents' },
  { href: '/app/quizzes', icon: Brain, label: 'Quizzes' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
  { href: '/app/admin/ai', icon: Cpu, label: 'AI Monitor' },
];

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link href={href}>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
          active
            ? 'bg-gradient-to-r from-[rgba(124,111,255,0.2)] to-[rgba(0,212,255,0.08)] text-[#F0F0FF] border border-[rgba(124,111,255,0.3)]'
            : 'text-[#8892A4] hover:text-[#F0F0FF] hover:bg-[rgba(255,255,255,0.04)]'
        )}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-[#7C6FFF] to-[#00D4FF] rounded-full" />
        )}
        <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', active ? 'text-[#7C6FFF]' : 'group-hover:text-[#7C6FFF]')} />
        <span className="font-medium text-sm">{label}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#7C6FFF] opacity-60" />}
      </div>
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex flex-col h-full bg-[#0F0F2D] border-r border-[rgba(255,255,255,0.07)]">
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center justify-between">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C6FFF] to-[#00D4FF] flex items-center justify-center shadow-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg gradient-text">EduQuiz</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[rgba(124,111,255,0.2)] text-[#9D93FF] font-semibold">AI</span>
          </Link>
          {onClose && (
            <button onClick={onClose} className="text-[#4A5568] hover:text-[#8892A4] transition-colors lg:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.07)]">
        {/* XP Badge */}
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl bg-[rgba(255,176,32,0.08)] border border-[rgba(255,176,32,0.2)]">
          <Zap className="w-3.5 h-3.5 text-[#FFB020]" />
          <span className="text-xs font-semibold text-[#FFB020]">{user?.xp_points?.toLocaleString() ?? 0} XP</span>
          {user?.streak_days ? (
            <>
              <span className="text-[#4A5568] text-xs mx-1">·</span>
              <span className="text-xs text-[#FFB020]">🔥 {user.streak_days} day streak</span>
            </>
          ) : null}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C6FFF] to-[#00D4FF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F0F0FF] truncate">{user?.full_name || 'Student'}</p>
            <p className="text-xs text-[#4A5568] truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-[#4A5568] hover:text-[#FF6B6B] transition-colors rounded-lg hover:bg-[rgba(255,107,107,0.1)]"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // Page title from pathname
  const pageTitle = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#080817] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-[rgba(255,255,255,0.07)] bg-[rgba(8,8,23,0.8)] backdrop-blur-glass">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#8892A4] hover:text-[#F0F0FF] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-semibold text-lg text-[#F0F0FF]">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-[#8892A4] hover:text-[#F0F0FF] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.05)]"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#7C6FFF]" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
