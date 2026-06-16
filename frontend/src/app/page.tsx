'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Brain, ArrowRight, Sparkles, BookOpen, Target, Zap, Shield, Globe } from 'lucide-react';
import { useRef } from 'react';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-bg relative overflow-hidden">
      {/* Background Mesh */}
      <div className="mesh-bg fixed">
        <div className="mesh-orb mesh-orb-1 opacity-60" />
        <div className="mesh-orb mesh-orb-2 opacity-50" />
        <div className="mesh-orb mesh-orb-3 opacity-30" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto glass-pill px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-white hidden sm:block">EduQuiz</span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="text-xs sm:text-sm font-semibold bg-white text-bg px-4 sm:px-5 py-2 rounded-full hover:scale-105 transition-transform"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6">
        <motion.div 
          style={{ y, opacity }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">The Future of Exam Prep is Here</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-heading font-extrabold tracking-tighter text-white mb-8 leading-[1.1]"
          >
            Master Any Subject.<br />
            <span className="gradient-text">In Minutes.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto font-medium"
          >
            Upload your lecture notes, PDFs, or slides. Our AI instantly generates WAEC, JAMB, and University-style quizzes tailored exactly to what you need to know.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/register" 
              className="btn-primary px-8 py-4 rounded-full text-lg flex items-center gap-2 group w-full sm:w-auto"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview / Floating Glass Panels */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, type: "spring" }}
          className="max-w-6xl mx-auto mt-24 relative z-20"
        >
          <div className="glass-card-heavy p-2 aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/20 relative group">
            {/* Real Dashboard Image */}
            <div className="w-full h-full relative rounded-2xl overflow-hidden bg-surface/80 border border-white/10">
              <img 
                src="/dashboard-mockup.png" 
                alt="EduQuiz AI Dashboard Interface Preview" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              {/* Optional overlay gradient for blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-32 px-6 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Designed for Excellence</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Everything you need to ace your next exam, wrapped in a beautiful, distraction-free interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 glass-card p-10 h-80 group hover:shadow-emerald-500/10 transition-shadow">
              <Brain className="w-12 h-12 text-emerald-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Smart Content Analysis</h3>
              <p className="text-slate-400 text-lg max-w-md">Our AI doesn't just read words—it understands concepts. Upload a 50-page PDF and get targeted quiz questions focusing on the most critical topics.</p>
            </div>

            {/* Feature 2 - Small */}
            <div className="glass-card p-10 h-80 group hover:shadow-amber-500/10 transition-shadow">
              <Target className="w-12 h-12 text-amber-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Exam Specific</h3>
              <p className="text-slate-400">Questions formatted exactly like WAEC, NECO, JAMB, and university theory exams.</p>
            </div>

            {/* Feature 3 - Small */}
            <div className="glass-card p-10 h-80 group hover:shadow-sky-500/10 transition-shadow">
              <Zap className="w-12 h-12 text-sky-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Instant Feedback</h3>
              <p className="text-slate-400">Detailed AI explanations for every answer, helping you learn from your mistakes instantly.</p>
            </div>

            {/* Feature 4 - Large */}
            <div className="md:col-span-2 glass-card p-10 h-80 group hover:shadow-rose-500/10 transition-shadow">
              <BookOpen className="w-12 h-12 text-rose-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Personalized Study Guides</h3>
              <p className="text-slate-400 text-lg max-w-md">Generate concise summaries and topic breakdowns from your messy lecture notes. Review the core concepts before taking the quiz.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-6 relative z-20 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Success Stories</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Hear from Nigerian students who actually gained something from our app.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 border-emerald-500/20 relative group">
              <div className="absolute -top-4 -left-4 text-6xl text-emerald-500/20 font-serif">"</div>
              <p className="text-slate-300 mb-6 relative z-10 italic">"I was struggling with Physics WAEC questions until I started generating quizzes directly from my school notes. I finally scored an A1!"</p>
              <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-sky-400 flex items-center justify-center font-bold text-white">D</div>
                <div>
                  <h4 className="font-bold text-white">David O.</h4>
                  <p className="text-xs text-slate-400">SS3 Student</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-amber-500/20 relative group">
              <div className="absolute -top-4 -left-4 text-6xl text-amber-500/20 font-serif">"</div>
              <p className="text-slate-300 mb-6 relative z-10 italic">"The JAMB formatted tests are incredibly accurate. It helped me practice my timing and I crossed the 300 mark easily."</p>
              <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center font-bold text-white">S</div>
                <div>
                  <h4 className="font-bold text-white">Sarah T.</h4>
                  <p className="text-xs text-slate-400">University Aspirant</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-sky-500/20 relative group">
              <div className="absolute -top-4 -left-4 text-6xl text-sky-500/20 font-serif">"</div>
              <p className="text-slate-300 mb-6 relative z-10 italic">"Instead of just reading 100-page handouts, I use EduQuiz to test myself. My GPA in Computer Science shot up immediately."</p>
              <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-purple-400 flex items-center justify-center font-bold text-white">E</div>
                <div>
                  <h4 className="font-bold text-white">Emmanuel K.</h4>
                  <p className="text-xs text-slate-400">100 Level, Unilag</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-6 relative z-20">
        <div className="max-w-4xl mx-auto glass-card-heavy border-emerald-500/20 p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/10 blur-[100px]" />
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 relative z-10">Stop Reading. Start Testing.</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">Active recall is proven to be the most effective way to learn. Join thousands of Nigerian students studying smarter today.</p>
          <Link 
            href="/register" 
            className="btn-primary px-10 py-5 rounded-full text-xl font-bold inline-block relative z-10 hover:scale-105 transition-transform"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 relative z-20 bg-[#0a0a1a]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-400" />
            <span className="font-heading font-bold text-xl text-white tracking-tight">EduQuiz AI</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-sm font-semibold text-emerald-400">Made by Master_AY</p>
            <p className="text-xs text-slate-500">© 2026 EduQuiz AI Platform. Designed for Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
