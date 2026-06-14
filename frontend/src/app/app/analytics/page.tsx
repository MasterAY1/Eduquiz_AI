'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, AlertCircle, Sparkles, TrendingUp, TrendingDown, BookOpen, BrainCircuit } from 'lucide-react';
import { usePerformanceReport } from '@/hooks/useAnalytics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('All');
  const [searchInput, setSearchInput] = useState('');

  const { data: report, isLoading } = usePerformanceReport(subject);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSubject(searchInput.trim());
      setSearchInput('');
    }
  };

  const generateRevisionQuiz = (topic: string) => {
    // Navigate to quizzes page with topic prefilled to start a revision quiz
    router.push(`/app/quizzes?topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}`);
  };

  // Format data for radar chart (max 6 topics for readability)
  const radarData = report?.topics.slice(0, 6).map((t) => ({
    topic: t.topic.length > 15 ? t.topic.substring(0, 15) + '...' : t.topic,
    successRate: t.success_rate,
    fullMark: 100,
  })) || [];

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-400" />
            Weakness Detection
          </h1>
          <p className="text-slate-400 mt-1">Analyze your performance and get targeted revision strategies.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Search subject (e.g. Mathematics)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64 bg-surface border-white/10"
          />
          <Button type="submit" variant="primary" className="bg-emerald-500 hover:bg-emerald-600">
            Analyze
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      ) : report ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-surface/40 backdrop-blur-md border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Subject Evaluated</p>
                <h3 className="text-xl font-bold text-white">{report.subject}</h3>
              </div>
            </Card>
            
            <Card className="p-6 bg-surface/40 backdrop-blur-md border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Overall Accuracy</p>
                <h3 className="text-xl font-bold text-white">{report.overall_score}%</h3>
              </div>
            </Card>

            <Card className="p-6 bg-surface/40 backdrop-blur-md border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Topics Analyzed</p>
                <h3 className="text-xl font-bold text-white">{report.topics.length}</h3>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Radar Chart */}
            <Card className="p-6 bg-surface/40 backdrop-blur-md border-white/5 lg:col-span-2 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6">Topic Proficiency (Radar)</h3>
              {radarData.length > 2 ? (
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Success Rate"
                        dataKey="successRate"
                        stroke="#34d399"
                        fill="#34d399"
                        fillOpacity={0.3}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#34d399' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
                  <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                  <p>Not enough topic data to generate a radar chart.</p>
                  <p className="text-sm">Complete more quizzes in this subject!</p>
                </div>
              )}
            </Card>

            {/* Action Plan */}
            <Card className="p-6 bg-surface/40 backdrop-blur-md border-white/5 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Recommended Actions</h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {report.weaknesses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 h-full border border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-emerald-400 font-medium">No critical weaknesses detected!</p>
                    <p className="text-xs text-slate-400 mt-1">Keep up the excellent work.</p>
                  </div>
                ) : (
                  report.weaknesses.map((weakTopic, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span className="font-semibold text-rose-100 text-sm">{weakTopic}</span>
                        </div>
                        <Badge className="bg-rose-500/20 text-rose-400">Weakness</Badge>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full text-xs border border-rose-500/30 hover:bg-rose-500/20 text-rose-200"
                        onClick={() => generateRevisionQuiz(weakTopic)}
                      >
                        Start Revision Quiz
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Detailed Performance Bar Chart */}
          <Card className="p-6 bg-surface/40 backdrop-blur-md border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">All Topics Accuracy</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.topics} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="topic" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="success_rate" name="Accuracy %" radius={[4, 4, 0, 0]}>
                    {report.topics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.is_weakness ? '#fb7185' : '#34d399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      ) : (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-white">No data found</h3>
          <p className="text-slate-400 mt-2 max-w-md">
            We couldn't find any quiz attempts for {subject}. Try searching for a different subject or take a quiz first!
          </p>
        </div>
      )}
    </div>
  );
}

// Ensure CheckCircle2 is imported if missing
import { CheckCircle2 } from 'lucide-react';
