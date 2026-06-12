'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain,
  Database,
  ScanLine,
  Award,
  TrendingUp,
  Target,
  ChevronDown,
  Zap,
  BookOpen,
  BarChart3,
  FileText,
  Play,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Brain,
    title: 'AI Quiz Generation',
    description: 'Generate personalized quizzes from any study material in seconds using advanced AI.',
    color: '#7C6FFF',
    bg: 'rgba(124,111,255,0.12)',
  },
  {
    icon: Database,
    title: 'Knowledge Base (RAG)',
    description: 'Your documents become a searchable knowledge base for accurate, contextual questions.',
    color: '#00D4FF',
    bg: 'rgba(0,212,255,0.12)',
  },
  {
    icon: ScanLine,
    title: 'Document Analysis',
    description: 'AI extracts topics, subtopics, and key concepts automatically from uploaded files.',
    color: '#00E5A0',
    bg: 'rgba(0,229,160,0.12)',
  },
  {
    icon: Award,
    title: 'WAEC/JAMB/NECO Style',
    description: 'Questions formatted exactly like official Nigerian exams you know and trust.',
    color: '#FFB020',
    bg: 'rgba(255,176,32,0.12)',
  },
  {
    icon: TrendingUp,
    title: 'Exam Predictions',
    description: 'AI identifies high-probability topics and question patterns from past questions.',
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.12)',
  },
  {
    icon: Target,
    title: 'Weakness Detection',
    description: 'Track your performance and get targeted practice on topics where you struggle most.',
    color: '#00D4FF',
    bg: 'rgba(0,212,255,0.12)',
  },
];

const steps = [
  {
    number: '01',
    title: 'Upload Your Material',
    description: 'Upload PDFs, DOCX, PPT, TXT or images — textbooks, notes, past questions, anything.',
    icon: FileText,
  },
  {
    number: '02',
    title: 'AI Analyzes & Indexes',
    description: 'Our AI builds a knowledge base from your material, extracting topics and key concepts.',
    icon: Brain,
  },
  {
    number: '03',
    title: 'Study Smarter',
    description: 'Generate quizzes, get exam predictions, and track your progress to score higher.',
    icon: BarChart3,
  },
];

const examFormats = ['WAEC', 'NECO', 'JAMB', 'BECE', 'University', 'Polytechnic', 'O-Level'];

const stats = [
  { value: '50K+', label: 'Students' },
  { value: '2M+', label: 'Questions Generated' },
  { value: '15+', label: 'Exam Styles' },
  { value: '98%', label: 'Satisfaction' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#080817] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-glass border-b border-[rgba(255,255,255,0.06)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C6FFF] to-[#00D4FF] flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-xl gradient-text">EduQuiz</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-[rgba(124,111,255,0.2)] text-[#9D93FF] font-medium">AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#8892A4]">
          <Link href="#features" className="hover:text-[#F0F0FF] transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-[#F0F0FF] transition-colors">How it works</Link>
          <Link href="#exams" className="hover:text-[#F0F0FF] transition-colors">Exams</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#8892A4] hover:text-[#F0F0FF] transition-colors px-4 py-2">
            Log in
          </Link>
          <Link href="/register" className="btn-primary text-sm px-5 py-2.5 rounded-xl">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 starfield">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,111,255,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 text-sm text-[#9D93FF]">
              <span className="text-base">🇳🇬</span>
              <span className="font-medium">Built for Nigerian Students</span>
              <Zap className="w-3.5 h-3.5 text-[#FFB020]" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
            >
              Transform Any{' '}
              <span className="gradient-text">Material</span>
              <br />
              into Smart{' '}
              <span className="gradient-text">Quizzes</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p variants={fadeUp} className="text-lg text-[#8892A4] max-w-xl mb-10 leading-relaxed">
              Upload your lecture notes, textbooks, or past questions. Our AI creates personalized{' '}
              <span className="text-[#F0F0FF]">WAEC, JAMB & NECO-style</span> quizzes instantly.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary px-8 py-4 text-base rounded-2xl glow-primary"
                >
                  <Zap className="w-5 h-5" />
                  Start Learning Free
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-ghost px-8 py-4 text-base rounded-2xl flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C6FFF] to-[#00D4FF] flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Trust line */}
            <motion.p variants={fadeUp} className="mt-6 text-sm text-[#4A5568]">
              No credit card required · Free forever plan available
            </motion.p>
          </motion.div>

          {/* Right: Floating Cards */}
          <div className="relative hidden lg:flex items-center justify-center h-[480px]">
            {/* Main Quiz Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute top-0 right-0 w-72 glass-card p-5 shadow-2xl z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C6FFF] to-[#9D93FF] flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F0F0FF]">WAEC Quiz</p>
                  <p className="text-xs text-[#8892A4]">Biology · 20 Questions</p>
                </div>
              </div>
              <p className="text-sm text-[#F0F0FF] mb-4 font-medium">
                Which organelle is responsible for protein synthesis?
              </p>
              <div className="space-y-2">
                {['A. Mitochondria', 'B. Ribosome', 'C. Nucleus', 'D. Golgi body'].map((opt, i) => (
                  <div key={opt} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${i === 1
                    ? 'bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] text-white'
                    : 'bg-[rgba(255,255,255,0.04)] text-[#8892A4] border border-[rgba(255,255,255,0.06)]'
                  }`}>
                    {opt}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Document Analysis Card */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 1 }}
              className="absolute top-24 left-0 w-60 glass-card p-4 shadow-xl z-20"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-[rgba(0,229,160,0.2)] flex items-center justify-center">
                  <ScanLine className="w-3.5 h-3.5 text-[#00E5A0]" />
                </div>
                <p className="text-xs font-semibold text-[#F0F0FF]">Document Analysis</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8892A4]">Topics found</span>
                  <span className="text-[#00E5A0] font-semibold">24</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8892A4]">Keywords</span>
                  <span className="text-[#00D4FF] font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8892A4]">Subject</span>
                  <span className="text-[#9D93FF] font-semibold">Chemistry</span>
                </div>
                <div className="w-full bg-[rgba(0,229,160,0.1)] rounded-full h-1.5 mt-2">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-[#00E5A0] to-[#00C87A] w-4/5" />
                </div>
                <p className="text-[10px] text-[#00E5A0]">Indexed ✓</p>
              </div>
            </motion.div>

            {/* Score Card */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 2 }}
              className="absolute bottom-8 right-8 w-56 glass-card p-4 shadow-xl"
            >
              <p className="text-xs text-[#8892A4] mb-2">Latest Score</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="font-heading text-4xl font-bold gradient-text">85</span>
                <span className="text-[#8892A4] text-sm mb-1">/100</span>
              </div>
              <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] w-[85%]" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-[#00E5A0]" />
                <p className="text-xs text-[#00E5A0]">+12% from last attempt</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#4A5568] flex flex-col items-center gap-1"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-[rgba(255,255,255,0.06)]"
        style={{ background: 'rgba(15,15,45,0.5)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-heading text-3xl font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-sm text-[#8892A4]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-[#7C6FFF] uppercase tracking-widest mb-4">Features</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-5">
            Everything You Need to{' '}
            <span className="gradient-text">Excel</span>
          </h2>
          <p className="text-[#8892A4] max-w-2xl mx-auto text-lg">
            Powerful AI tools designed specifically for the Nigerian curriculum and exam formats.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="glass-card p-6 cursor-default group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                style={{ background: feature.bg }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="font-heading text-lg font-semibold text-[#F0F0FF] mb-2">
                {feature.title}
              </h3>
              <p className="text-[#8892A4] text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24" style={{ background: 'rgba(15,15,45,0.4)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-[#00D4FF] uppercase tracking-widest mb-4">Process</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-5">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-[#8892A4] max-w-xl mx-auto">
              From upload to quiz in under 60 seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px border-t-2 border-dashed border-[rgba(124,111,255,0.3)]" />

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-24 h-24 rounded-full glass-card flex items-center justify-center border border-[rgba(124,111,255,0.3)]">
                    <step.icon className="w-8 h-8 text-[#7C6FFF]" />
                  </div>
                  <span className="absolute -top-2 -right-2 font-heading text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] text-white">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-bold text-[#F0F0FF] mb-3">{step.title}</h3>
                <p className="text-[#8892A4] text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Formats */}
      <section id="exams" className="py-24 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm font-semibold text-[#FFB020] uppercase tracking-widest mb-4">Supported</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            All Major <span className="gradient-text">Exam Formats</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {examFormats.map((exam, i) => (
            <motion.div
              key={exam}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 glass-card border border-[rgba(124,111,255,0.25)] rounded-full text-sm font-semibold text-[#9D93FF] hover:border-[rgba(124,111,255,0.5)] hover:text-[#7C6FFF] transition-all cursor-default"
            >
              {exam}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative glass-card p-12 overflow-hidden">
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,111,255,0.15) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="text-5xl mb-6">🎓</div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-5">
                Ready to Score <span className="gradient-text">Higher?</span>
              </h2>
              <p className="text-[#8892A4] text-lg mb-10 max-w-md mx-auto">
                Join 50,000+ Nigerian students already acing their exams with EduQuiz AI.
              </p>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary px-10 py-5 text-lg rounded-2xl glow-primary"
                >
                  <Zap className="w-5 h-5" />
                  Create Free Account
                </motion.button>
              </Link>
              <p className="mt-4 text-xs text-[#4A5568]">No credit card · Takes 30 seconds</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[rgba(255,255,255,0.06)] px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C6FFF] to-[#00D4FF] flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg gradient-text">EduQuiz AI</span>
            <span className="text-xs text-[#4A5568] ml-1">· Smart Learning for Nigerian Students</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#4A5568]">
            <Link href="#" className="hover:text-[#8892A4] transition-colors">About</Link>
            <Link href="#" className="hover:text-[#8892A4] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#8892A4] transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-[#4A5568]">
            © {new Date().getFullYear()} EduQuiz AI. Built with ❤️ in Nigeria.
          </p>
        </div>
      </footer>
    </main>
  );
}
