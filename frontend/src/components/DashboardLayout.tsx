'use client';

import React from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const menuItems = {
    ADMIN: [
      { name: 'Dashboard', href: '/admin', icon: '📊' },
      { name: 'Doctors', href: '/admin/doctors', icon: '👨‍⚕️' },
      { name: 'Patients', href: '/admin/patients', icon: '👤' },
      { name: 'Billing', href: '/admin/billing', icon: '💰' },
      { name: 'Reports', href: '/admin/reports', icon: '📈' },
    ],
    DOCTOR: [
      { name: 'Schedule', href: '/doctor', icon: '📅' },
      { name: 'Patients', href: '/doctor/patients', icon: '👤' },
      { name: 'Prescriptions', href: '/doctor/prescriptions', icon: '💊' },
    ],
    PATIENT: [
      { name: 'My Health', href: '/patient', icon: '🏥' },
      { name: 'Book Appointment', href: '/patient/book', icon: '📅' },
      { name: 'My Invoices', href: '/patient/billing', icon: '🧾' },
    ]
  };

  const currentMenu = menuItems[role as keyof typeof menuItems] || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>C</div>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>ClinicSync</h1>
        </div>

        <nav style={{ flex: 1 }}>
          {currentMenu.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                color: 'var(--text-main)',
                textDecoration: 'none',
                borderRadius: 'var(--radius)',
                marginBottom: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.icon}</span>
              <span style={{ fontWeight: '500' }}>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <button style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem'
          }}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '70px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>John Doe</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role}</p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#e2e8f0',
              overflow: 'hidden'
            }}>
              {/* Avatar placeholder */}
            </div>
          </div>
        </header>

        <div style={{ padding: '2rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
