'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import {
  Cpu,
  RefreshCw,
  Activity,
  AlertTriangle,
  Zap,
  Gauge,
  Clock,
  CheckCircle,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

interface ModelStatus {
  status: string;
  remaining_rpd: number;
  used_rpd: number;
  limit_rpd: number;
  success_rate: number;
  avg_latency_ms: number;
}

interface AIStatusData {
  models: Record<string, ModelStatus>;
  active_fallbacks_last_24h: number;
  total_tokens_consumed_today: number;
}

export default function AIMonitorPage() {
  const [data, setData] = useState<AIStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<AIStatusData>('/api/v1/admin/ai/model-status');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load AI system status.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all model quotas and clear today\'s logs?')) {
      return;
    }
    try {
      setResetting(true);
      await apiClient.post('/api/v1/admin/ai/reset-quotas');
      toast.success('AI quotas and database usage logs reset successfully.');
      await fetchStatus();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset AI quotas.');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-[rgba(0,229,160,0.15)] text-[#00E5A0] border border-[rgba(0,229,160,0.25)] font-semibold text-xs uppercase">
            Healthy
          </Badge>
        );
      case 'cooling_down':
        return (
          <Badge className="bg-[rgba(255,176,32,0.15)] text-[#FFB020] border border-[rgba(255,176,32,0.25)] font-semibold text-xs uppercase">
            Cooling Down
          </Badge>
        );
      case 'exhausted':
        return (
          <Badge className="bg-[rgba(255,107,107,0.15)] text-[#FF6B6B] border border-[rgba(255,107,107,0.25)] font-semibold text-xs uppercase">
            Exhausted
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[rgba(136,146,164,0.15)] text-[#8892A4] border border-[rgba(136,146,164,0.25)] font-semibold text-xs uppercase">
            Unknown
          </Badge>
        );
    }
  };

  const getFriendlyModelName = (id: string) => {
    switch (id) {
      case 'gemini-3.1-flash-lite':
        return 'Gemini 3.1 Flash Lite';
      case 'gemini-2.5-flash':
        return 'Gemini 2.5 Flash';
      case 'gemini-3.5-flash':
        return 'Gemini 3.5 Flash';
      case 'deepseek-v4':
        return 'DeepSeek V4 (Fallback)';
      default:
        return id;
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6 space-y-8 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 pb-12 max-w-5xl mx-auto"
    >
      {/* Title Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading">
            AI Model <span className="gradient-text">Router Dashboard</span>
          </h1>
          <p className="text-[#8892A4] text-sm mt-1">
            Real-time multi-model routing, failover logs, and API quota optimization.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchStatus}
            variant="ghost"
            className="text-xs text-[#8892A4] hover:text-[#F0F0FF] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)]"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleReset}
            variant="ghost"
            className="text-xs text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] hover:text-[#FF6B6B] border border-[rgba(255,107,107,0.2)]"
            disabled={resetting}
          >
            Reset Quotas
          </Button>
        </div>
      </motion.div>

      {/* Global Usage Analytics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Tokens Card */}
        <Card className="p-6 bg-gradient-to-br from-[rgba(124,111,255,0.03)] to-transparent flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[rgba(124,111,255,0.08)] border border-[rgba(124,111,255,0.15)] flex items-center justify-center text-[#7C6FFF] flex-shrink-0">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider font-semibold">Today's Token Volume</p>
            <h3 className="text-2xl font-bold font-heading text-[#F0F0FF] mt-0.5">
              {data?.total_tokens_consumed_today.toLocaleString() ?? 0}
            </h3>
          </div>
        </Card>

        {/* Failover Card */}
        <Card className="p-6 bg-gradient-to-br from-[rgba(255,107,107,0.03)] to-transparent flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,107,107,0.08)] border border-[rgba(255,107,107,0.15)] flex items-center justify-center text-[#FF6B6B] flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider font-semibold">Failovers (Last 24h)</p>
            <h3 className="text-2xl font-bold font-heading text-[#F0F0FF] mt-0.5">
              {data?.active_fallbacks_last_24h ?? 0}
            </h3>
          </div>
        </Card>

        {/* Global Router Health */}
        <Card className="p-6 bg-gradient-to-br from-[rgba(0,229,160,0.03)] to-transparent flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.15)] flex items-center justify-center text-[#00E5A0] flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider font-semibold">Router Status</p>
            <h3 className="text-2xl font-bold font-heading text-[#F0F0FF] mt-0.5">
              {(data?.active_fallbacks_last_24h ?? 0) > 3 ? 'Degraded' : 'Nominal'}
            </h3>
          </div>
        </Card>
      </motion.div>

      {/* Model Status Details */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-xl font-bold font-heading text-[#F0F0FF]">Individual Model Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data &&
            Object.entries(data.models).map(([modelId, status]) => {
              const rpdPercentage = status.limit_rpd > 0 ? (status.used_rpd / status.limit_rpd) * 100 : 0;
              return (
                <Card
                  key={modelId}
                  className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-[rgba(255,255,255,0.01)] to-transparent border-[rgba(255,255,255,0.05)] hover:border-[rgba(124,111,255,0.25)] transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Neon Glow Hover Effect */}
                  <div className="absolute inset-0 bg-radial-gradient from-[rgba(124,111,255,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Header info */}
                  <div className="flex items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(124,111,255,0.05)] border border-[rgba(124,111,255,0.1)] flex items-center justify-center text-[#7C6FFF] flex-shrink-0">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#F0F0FF] text-base leading-snug">
                          {getFriendlyModelName(modelId)}
                        </h4>
                        <p className="text-xs text-[#8892A4] mt-0.5 font-mono">{modelId}</p>
                      </div>
                    </div>
                    {getStatusBadge(status.status)}
                  </div>

                  {/* Quota Gauge */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#8892A4] uppercase tracking-wider">
                        Daily Request Volume (RPD)
                      </span>
                      <span className="font-bold text-[#F0F0FF]">
                        {status.used_rpd} / {status.limit_rpd}
                      </span>
                    </div>
                    <Progress value={rpdPercentage} className="h-2 bg-[rgba(255,255,255,0.05)]" />
                  </div>

                  {/* Performance Indicators */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {/* Success Rate */}
                    <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] space-y-1">
                      <div className="flex items-center gap-1.5 text-[#8892A4] text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-[#00E5A0]" />
                        <span>Success Rate</span>
                      </div>
                      <p className="text-lg font-bold text-[#F0F0FF] font-heading">
                        {status.success_rate}%
                      </p>
                    </div>

                    {/* Average Latency */}
                    <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] space-y-1">
                      <div className="flex items-center gap-1.5 text-[#8892A4] text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#00D4FF]" />
                        <span>Avg Latency</span>
                      </div>
                      <p className="text-lg font-bold text-[#F0F0FF] font-heading">
                        {status.avg_latency_ms > 0 ? `${status.avg_latency_ms.toFixed(0)} ms` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}
