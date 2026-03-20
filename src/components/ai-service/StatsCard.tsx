'use client';

import { BlogAnalysisResult } from '@/types/analysis';
import { FileText, Image, Hash, TrendingUp } from 'lucide-react';

interface StatsCardProps {
  result: BlogAnalysisResult;
}

export default function StatsCard({ result }: StatsCardProps) {
  const stats = [
    {
      icon: FileText,
      label: '총 글자수',
      value: result.stats.wordCount.toLocaleString(),
      unit: '자',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Image,
      label: '이미지 개수',
      value: result.stats.imageCount.toString(),
      unit: '개',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Hash,
      label: '키워드 밀도',
      value: result.stats.keywordDensity.toString(),
      unit: '%',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`${stat.color} w-6 h-6`} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">
              {stat.value}
              <span className="text-lg text-gray-500 ml-1">{stat.unit}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
