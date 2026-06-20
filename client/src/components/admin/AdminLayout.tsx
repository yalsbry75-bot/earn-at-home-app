import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Wallet, 
  ShieldAlert, 
  Settings, 
  History, 
  LogOut,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/admin' },
    { icon: Users, label: 'المستخدمين', href: '/admin/users' },
    { icon: CheckSquare, label: 'المهام', href: '/admin/tasks' },
    { icon: Wallet, label: 'السحوبات', href: '/admin/withdrawals' },
    { icon: ShieldAlert, label: 'الاحتيال', href: '/admin/fraud' },
    { icon: TrendingUp, label: 'المالية', href: '/admin/finance' },
    { icon: Settings, label: 'الإعدادات', href: '/admin/settings' },
    { icon: History, label: 'السجلات', href: '/admin/logs' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-950 text-right" dir="rtl">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-primary">لوحة الإدارة</h1>
          <p className="text-xs text-muted-foreground mt-1">نظام Earn at Home</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location === item.href 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-zinc-800"
              )}>
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </a>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
            onClick={() => logout()}
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 right-0 w-64 bg-white dark:bg-zinc-900 z-50 transition-transform duration-300 transform",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-primary">لوحة الإدارة</h1>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  location === item.href 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-zinc-800"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </a>
            </Link>
          ))}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 mt-4"
            onClick={() => logout()}
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">المدير العام</p>
              <p className="text-xs text-muted-foreground">admin@earn-at-home.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              AD
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
