'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, BarChart3, Settings, LogOut, MessageSquare } from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Analytics', href: '/superadmin', icon: BarChart3 },
    { name: 'Tenants', href: '/superadmin/tenants', icon: Building2 },
    { name: 'Users', href: '/superadmin/users', icon: Users },
    { name: 'Feedback', href: '/superadmin/feedback', icon: MessageSquare },
    { name: 'Settings', href: '/superadmin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-400">Nexus</span>Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Enterprise Admin</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/auth/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-slate-800">
            {navItems.find(item => item.href === pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              SA
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
