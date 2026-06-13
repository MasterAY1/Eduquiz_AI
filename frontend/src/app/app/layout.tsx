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
  Zap,
  LogOut,
  Bell,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

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
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative',
          active
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)]'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        )}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_10px_16 185 129 / 0.5]" />
        )}
        <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', active ? 'text-emerald-400' : 'group-hover:text-emerald-400')} />
        <span className="font-medium text-sm">{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto text-emerald-500/60" />}
      </div>
    </Link>
  );
}

function MobileNavItem({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link href={href} className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative">
      {active && (
        <motion.div 
          layoutId="mobile-active-tab"
          className="absolute inset-x-2 inset-y-1 bg-emerald-500/15 border border-emerald-500/20 rounded-xl z-0"
        />
      )}
      <Icon className={cn('w-5 h-5 z-10 transition-colors', active ? 'text-emerald-400' : 'text-slate-400')} />
      <span className={cn('text-[10px] font-medium z-10 transition-colors', active ? 'text-emerald-400' : 'text-slate-400')}>{label}</span>
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex flex-col h-full bg-surface/40 backdrop-blur-[40px] border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 box-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl tracking-tight text-white leading-tight">EduQuiz</span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">AI Platform</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50 bg-black/10">
        {/* XP Badge */}
        <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-500">{user?.xp_points?.toLocaleString() ?? 0} XP</span>
          {user?.streak_days ? (
            <>
              <span className="text-slate-600 text-xs mx-1">•</span>
              <span className="text-sm font-medium text-amber-500">🔥 {user.streak_days} days</span>
            </>
          ) : null}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-emerald-500/20 box-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Student'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
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
  const pathname = usePathname();

  // Page title from pathname
  const pageTitle = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )?.label || 'Dashboard';

  return (
    <div className="flex h-[100dvh] bg-bg overflow-hidden relative">
      
      {/* Mesh Background behind everything */}
      <div className="mesh-bg opacity-30">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 relative z-20">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 pb-16 lg:pb-0">
        {/* Topbar */}
        <header className="flex-shrink-0 h-20 flex items-center justify-between px-6 lg:px-10 border-b border-border/50 bg-surface/50 backdrop-blur-[40px] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="font-heading font-bold text-2xl text-white tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Optional right-side actions can be added here in the future */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scroll-smooth">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-[40px] border-t border-white/10 flex items-center justify-around px-2 pb-safe z-40">
        {navItems.map((item) => (
          <MobileNavItem
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </div>
    </div>
  );
}
