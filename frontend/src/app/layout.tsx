import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EduQuiz AI — Smart Learning for Nigerian Students',
  description:
    'Upload any study material and get instant AI-generated quizzes, study guides, and exam predictions. Built for Nigerian students preparing for WAEC, JAMB, NECO and more.',
  keywords: 'WAEC, JAMB, NECO, quiz, study, Nigeria, education, AI, learning, exam preparation',
  openGraph: {
    title: 'EduQuiz AI — Smart Learning for Nigerian Students',
    description: 'AI-powered education for Nigerian students. Generate personalized quizzes from any study material.',
    type: 'website',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduQuiz AI',
    description: 'AI-powered quiz generation for Nigerian students',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#080817] text-[#F0F0FF] antialiased font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
