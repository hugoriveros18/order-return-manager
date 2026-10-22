import { Brand } from '@/components/brand';
import { ToastViewport } from '@/components/toast';
import { Suspense } from 'react';
import { SectionSkeleton } from '@/components/section-skeleton';
import type { Metadata } from 'next';
import { plex } from './fonts';
import './globals.css';
export const metadata: Metadata = {
  title: 'Order Returns Manager',
  description:
    'Explore order details, manage returns and follow each request in an interactive demo.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.dataset.theme=localStorage.getItem('orm-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}})()`,
          }}
        />
      </head>
      <body className={plex.variable}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Suspense
          fallback={
            <>
              <header className="app-header">
                <Brand />
              </header>
              <main id="main" className="page-content">
                <SectionSkeleton />
              </main>
            </>
          }
        >
          {children}
        </Suspense>
        <ToastViewport />
      </body>
    </html>
  );
}
