'use client';

import { ExposureData } from '@/types/analysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Info } from 'lucide-react';

interface ExposureChartProps {
  data: ExposureData[];
}

const COMPETITION_COLORS = {
  HIGH: { start: '#f87171', end: '#dc2626' },
  MEDIUM: { start: '#fbbf24', end: '#d97706' },
  LOW: { start: '#34d399', end: '#059669' },
};

const COMPETITION_LABELS = {
  HIGH: '경쟁도 높음',
  MEDIUM: '경쟁도 보통',
  LOW: '경쟁도 낮음',
};

export default function ExposureChart({ data }: ExposureChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          검색 노출도 분석
        </h3>
        <p className="text-gray-400 text-center py-12">노출도 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0px_8px_24px_-4px_rgba(0,0,0,0.04)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
          <TrendingUp className="w-6 h-6 text-indigo-500" />
          검색 노출도 분석
        </h3>
        
        {/* 범례 (Top) */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mt-4 sm:mt-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: `linear-gradient(to bottom, ${COMPETITION_COLORS.HIGH.start}, ${COMPETITION_COLORS.HIGH.end})` }}></div>
            <span>경쟁 높음</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: `linear-gradient(to bottom, ${COMPETITION_COLORS.MEDIUM.start}, ${COMPETITION_COLORS.MEDIUM.end})` }}></div>
            <span>경쟁 보통</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: `linear-gradient(to bottom, ${COMPETITION_COLORS.LOW.start}, ${COMPETITION_COLORS.LOW.end})` }}></div>
            <span>경쟁 낮음</span>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="mb-4 relative">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COMPETITION_COLORS.HIGH.start} stopOpacity={1}/>
                <stop offset="100%" stopColor={COMPETITION_COLORS.HIGH.end} stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COMPETITION_COLORS.MEDIUM.start} stopOpacity={1}/>
                <stop offset="100%" stopColor={COMPETITION_COLORS.MEDIUM.end} stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COMPETITION_COLORS.LOW.start} stopOpacity={1}/>
                <stop offset="100%" stopColor={COMPETITION_COLORS.LOW.end} stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="keyword" 
              tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              width={50}
            />
            <Tooltip
              cursor={{ fill: '#f9fafb', opacity: 0.6 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ExposureData;
                  const colorConfig = COMPETITION_COLORS[data.competition];
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-gray-100 rounded-xl p-4 shadow-xl pointer-events-none min-w-[180px]">
                      <h4 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100/50">{data.keyword}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">월간 검색량</span>
                          <span className="font-bold text-gray-900">{data.monthlySearchVolume.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">경쟁도</span>
                          <span className="font-semibold px-2 py-0.5 rounded-md text-xs" style={{ 
                            backgroundColor: `${colorConfig.start}15`,
                            color: colorConfig.end 
                          }}>
                            {COMPETITION_LABELS[data.competition]}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="monthlySearchVolume" 
              radius={[6, 6, 0, 0]} 
              maxBarSize={60}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => {
                const gradientId = entry.competition === 'HIGH' ? 'url(#colorHigh)' : 
                                   entry.competition === 'MEDIUM' ? 'url(#colorMedium)' : 'url(#colorLow)';
                return <Cell key={`cell-${index}`} fill={gradientId} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 안내 메시지 Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-900 leading-relaxed">
            <strong className="block mb-1 text-indigo-950">검색 노출도 시그널</strong>
            검색량이 높고(막대 높이) 경쟁도가 낮은(초록색) 키워드를 우선순위로 포스팅 제목에 배치해보세요. 상단 노출 확률이 기하급수적으로 올라갑니다.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
