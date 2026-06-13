import type { Metadata } from 'next';
import { DotGothic16 } from 'next/font/google';
import './globals.css';

const dot = DotGothic16({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixel',
});

export const metadata: Metadata = {
  title: 'アーベイン・タイクーン 〜不動産経営シミュレーション〜',
  description: '36ヶ月で純資産7,500万円を目指すドット絵の不動産経営シミュレーション',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body
        className={`${dot.variable} text-[#4A3020] antialiased`}
        style={{ fontFamily: 'var(--font-pixel), sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
