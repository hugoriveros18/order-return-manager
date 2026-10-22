import localFont from 'next/font/local';
export const plex = localFont({
  src: [
    { path: '../../public/fonts/plex-regular.woff2', weight: '400' },
    { path: '../../public/fonts/plex-semibold.woff2', weight: '600' },
  ],
  variable: '--font-plex',
  display: 'swap',
});
