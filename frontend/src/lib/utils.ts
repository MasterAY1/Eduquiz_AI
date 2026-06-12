import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getScoreGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

export function getPerformanceMessage(percentage: number): string {
  if (percentage >= 80) return "Excellent work! 🎉 You've mastered this topic!";
  if (percentage >= 60) return 'Good job! 👍 Keep practicing to improve.';
  if (percentage >= 40) return 'Keep going! 💪 Review the topics and try again.';
  return "Don't give up! 🌟 Let's revisit this material together.";
}

export function getFileTypeColor(sourceType: string): string {
  const colors: Record<string, string> = {
    pdf: '#FF6B6B',
    docx: '#4B9EFF',
    ppt: '#FF8C42',
    txt: '#8892A4',
    image: '#00E5A0',
  };
  return colors[sourceType] || '#8892A4';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
