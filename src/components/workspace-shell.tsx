'use client';
import Link from 'next/link';
import { usePathname, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useDemoData, ErrorNotice, clearDemoData, checkDemoAccess } from './demo-context';
import { Brand } from './brand';
import { Icon } from './icon';
import { ThemeToggle } from './theme-toggle';
import { CustomerPicker } from './customer-picker';
import type { CustomerView, Paged, ReturnView } from '@/lib/contracts';
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    params = useParams(),
    query = useSearchParams(),
    router = useRouter();
  const admin =
    path.startsWith('/admin') || (path.startsWith('/demo') && query.get('view') === 'admin');
  const customers = useDemoData<CustomerView[]>('/api/customers');
  const context = useDemoData<{ generation: number; expiresAt: string }>('/api/demo');
  const requests = useDemoData<Paged<ReturnView>>(admin ? '/api/admin/returns' : null);
  const id = String(params.customerId ?? query.get('customer') ?? customers.data?.[0]?.id ?? '');
  useEffect(() => {
    const check = context.refresh;
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [context.refresh]);
  useEffect(() => {
    if (!context.data) return;
    const wait = new Date(context.data.expiresAt).getTime() - Date.now();
    const timer = setTimeout(checkDemoAccess, Math.max(0, Math.min(wait, 2147483647)));
    return () => clearTimeout(timer);
  }, [context.data, context.refresh]);
  const refreshContext = context.refresh,
    refreshCustomers = customers.refresh;
  useEffect(() => {
    const receive = (e: StorageEvent) => {
      if (e.key === 'orm-reset') {
        clearDemoData();
        router.refresh();
        refreshContext();
        refreshCustomers();
      }
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [router, refreshContext, refreshCustomers]);
  const links = admin
    ? [
        ['Requests', '/admin/returns', 'returns'],
        ['Return policy', '/admin/policy', 'settings'],
      ]
    : [
        ['Orders', `/customer/${id}/orders`, 'box'],
        ['My returns', `/customer/${id}/returns`, 'returns'],
      ];
  return (
    <>
      <header className="app-header">
        <Brand />
        <div className="header-controls">
          <div className="role-switch" role="group" aria-label="Demonstration view">
            <Link
              href={
                path.startsWith('/demo')
                  ? `${path}?view=customer&customer=${id}`
                  : `/customer/${id}/orders`
              }
              prefetch={false}
              aria-current={!admin ? 'page' : undefined}
            >
              <Icon name="user" />
              Customer
            </Link>
            <Link
              href={
                path.startsWith('/demo')
                  ? `${path}?view=admin&customer=${id}`
                  : `/admin/returns?customer=${id}`
              }
              prefetch={false}
              aria-current={admin ? 'page' : undefined}
            >
              <Icon name="admin" />
              Administrator
            </Link>
          </div>
          <div className="profile-slot">
            {admin ? (
              <div className="admin-identity">
                <span className="avatar">DM</span>
                <span>
                  <strong>Demo administrator</strong>
                  <small>Your workspace only</small>
                </span>
              </div>
            ) : (
              <CustomerPicker
                customers={customers.data ?? []}
                value={id}
                onChange={(customer) =>
                  router.push(
                    path === '/demo/guide'
                      ? `${path}?view=customer&customer=${customer}`
                      : `/customer/${customer}/orders`,
                  )
                }
              />
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="demo-notice">
        <Icon name="info" />
        Demonstration only. No real refunds, shipments or pickups.
      </div>
      <div className="app-frame">
        <nav className="rail" aria-label="Main navigation">
          <p className="nav-label">Your workspace</p>
          {links.map(([label, url, glyph]) => (
            <Link
              key={url}
              aria-label={label}
              href={url + (admin ? '?customer=' + id : '')}
              prefetch={false}
              className={path.startsWith(url) ? 'active' : ''}
            >
              <Icon name={glyph as 'box' | 'returns' | 'settings'} />
              <span>{label}</span>
              {label === 'Requests' && !!requests.pendingCount && (
                <span
                  className="nav-count"
                  aria-label={`${requests.pendingCount} pending requests`}
                >
                  {requests.pendingCount}
                </span>
              )}
            </Link>
          ))}
          <Link
            aria-label="How returns work"
            className={'guide-link' + (path === '/demo/guide' ? ' active' : '')}
            aria-current={path === '/demo/guide' ? 'page' : undefined}
            href={`/demo/guide?view=${admin ? 'admin' : 'customer'}&customer=${id}`}
            prefetch={false}
          >
            <Icon name="route" />
            <span>How returns work</span>
          </Link>
          <Link
            aria-label="Demo settings"
            className={'settings-link' + (path === '/demo/reset' ? ' active' : '')}
            aria-current={path === '/demo/reset' ? 'page' : undefined}
            href={`/demo/reset?view=${admin ? 'admin' : 'customer'}&customer=${id}`}
            prefetch={false}
          >
            <Icon name="settings" />
            <span>Demo settings</span>
          </Link>
          <p className="rail-note">
            Your own fictional workspace.
            <br />
            Reset it to explore again.
          </p>
        </nav>
        <main id="main" className="page-content">
          {context.error ? <ErrorNotice error={context.error} retry={context.refresh} /> : children}
        </main>
      </div>
    </>
  );
}
