import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Image from 'next/image';
import {
  HomeIcon,
  TicketIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ChevronRightIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  StarIcon,
  TruckIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: HomeIcon },
  { label: '── Mall Operations ──', divider: true },
  { href: '/admin/sales', label: 'Sales Reports', icon: CurrencyRupeeIcon },
  { href: '/admin/footfall', label: 'Footfall Tracker', icon: ChartBarIcon },
  { href: '/admin/feedback', label: 'Customer Feedback', icon: StarIcon },
  { href: '/admin/visitors', label: 'Visitor Data', icon: UsersIcon },
  { href: '/admin/parking', label: 'Parking', icon: TruckIcon },
  { href: '/admin/stores', label: 'Stores / Tenants', icon: BuildingStorefrontIcon },
  { label: '── Ticketing ──', divider: true },
  { href: '/admin/tickets', label: 'All Tickets', icon: TicketIcon },
  { label: '── Checklists ──', divider: true },
  { href: '/admin/checklists', label: 'Checklist Management', icon: ClipboardDocumentCheckIcon },
  { label: '── System ──', divider: true },
  { href: '/admin/users', label: 'User Management', icon: UserGroupIcon },
  { href: '/admin/communications', label: 'Communication', icon: ChatBubbleLeftRightIcon },
  { href: '/admin/send-notification', label: 'Send Notification', icon: BellIcon },
];

// All possible staff nav items with permission keys
const allStaffNav = [
  { href: '/staff', label: 'Dashboard', icon: HomeIcon, perm: null }, // always visible
  { label: '── Mall Operations ──', divider: true },
  { href: '/admin/sales', label: 'Sales Reports', icon: CurrencyRupeeIcon, perm: 'sales' },
  { href: '/admin/footfall', label: 'Footfall Tracker', icon: ChartBarIcon, perm: 'footfall' },
  { href: '/admin/feedback', label: 'Customer Feedback', icon: StarIcon, perm: 'feedback' },
  { href: '/admin/visitors', label: 'Visitor Data', icon: UsersIcon, perm: 'visitors' },
  { href: '/admin/parking', label: 'Parking', icon: TruckIcon, perm: 'parking' },
  { href: '/admin/stores', label: 'Stores / Tenants', icon: BuildingStorefrontIcon, perm: 'stores' },
  { label: '── Ticketing ──', divider: true },
  { href: '/staff/tickets', label: 'My Tickets', icon: ClipboardDocumentListIcon, perm: null }, // always visible
  { href: '/admin/tickets', label: 'All Tickets', icon: TicketIcon, perm: 'tickets' },
  { label: '── Checklists ──', divider: true },
  { href: '/staff/checklists', label: 'My Checklists', icon: ClipboardDocumentCheckIcon, perm: null }, // always visible
  { label: '── Other ──', divider: true },
  { href: '/admin/communications', label: 'Communication', icon: ChatBubbleLeftRightIcon, perm: 'communications' },
];

const customerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/dashboard/tickets', label: 'My Tickets', icon: TicketIcon },
  { href: '/dashboard/tickets/new', label: 'New Ticket', icon: ClipboardDocumentListIcon },
  { href: '/dashboard/amenities', label: 'Amenities Booking', icon: CalendarDaysIcon },
  { href: '/dashboard/construction', label: 'Construction Progress', icon: WrenchScrewdriverIcon },
];

// Tenant (retail shop owners) — own tickets only
const tenantNav = [
  { href: '/tenant', label: 'Dashboard', icon: HomeIcon },
  { label: '── Tickets ──', divider: true },
  { href: '/tenant/tickets', label: 'My Tickets', icon: TicketIcon },
  { href: '/tenant/tickets/new', label: 'Raise Ticket', icon: ClipboardDocumentListIcon },
];

// Security officers — own tickets + incident creation
const securityNav = [
  { href: '/security', label: 'Dashboard', icon: HomeIcon },
  { label: '── Tickets ──', divider: true },
  { href: '/security/tickets', label: 'My Tickets', icon: TicketIcon },
  { href: '/security/tickets/new', label: 'New Incident', icon: ClipboardDocumentListIcon },
];

// HelpDesk — view all tickets + create on behalf
const helpdeskNav = [
  { href: '/helpdesk', label: 'Dashboard', icon: HomeIcon },
  { label: '── Tickets ──', divider: true },
  { href: '/helpdesk/tickets', label: 'All Tickets', icon: TicketIcon },
  { href: '/helpdesk/tickets/new', label: 'New Ticket', icon: ClipboardDocumentListIcon },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  let navItems = customerNav;
  if (user?.role === 'admin') {
    navItems = adminNav;
  } else if (user?.role === 'tenant') {
    navItems = tenantNav;
  } else if (user?.role === 'security') {
    navItems = securityNav;
  } else if (user?.role === 'helpdesk') {
    navItems = helpdeskNav;
  } else if (user?.role === 'staff') {
    const perms = user.permissions; // array or null
    if (!perms || perms.length === 0) {
      // No permissions set → show default basic staff nav
      navItems = allStaffNav.filter(item => item.perm === null || item.divider === true);
      // Remove orphan dividers (dividers with no items following)
    } else {
      // Filter: show item if perm is null (always) or user has that permission
      navItems = allStaffNav.filter(item => item.divider || item.perm === null || perms.includes(item.perm));
    }
    // Remove trailing/orphan dividers
    navItems = navItems.filter((item, i) => {
      if (!item.divider) return true;
      const next = navItems[i + 1];
      return next && !next.divider;
    });
  }

  const roleLabel = {
    admin: 'Administrator',
    staff: 'Staff Member',
    customer: 'Customer',
    tenant: 'Tenant / Retailer',
    security: 'Security Officer',
    helpdesk: 'Help Desk',
  };
  const roleBadgeColor = {
    admin: 'bg-red-100 text-red-700',
    staff: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
    tenant: 'bg-purple-100 text-purple-700',
    security: 'bg-yellow-100 text-yellow-700',
    helpdesk: 'bg-cyan-100 text-cyan-700',
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1e293b] flex flex-col transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <div className="flex items-center justify-center flex-1">
            <Image src="/logo.png" alt="Alcove Triveni Mall" width={160} height={40} style={{ objectFit: 'contain' }} priority />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white ml-2">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${roleBadgeColor[user?.role] || 'bg-gray-200 text-gray-700'}`}>
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.divider) {
              return (
                <p key={idx} className="px-3 pt-3 pb-1 text-xs text-slate-500 font-semibold tracking-wider">
                  {item.label}
                </p>
              );
            }
            const Icon = item.icon;
            const isActive = router.pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && item.href !== '/staff' && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
                {isActive && <ChevronRightIcon className="w-4 h-4 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500 hover:text-white transition-all duration-150"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            {title && (
              <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <UserCircleIcon className="w-5 h-5" />
              <span>{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
