'use client';

import { ExposureData } from '@/types/analysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ExposureChartProps {
  data: ExposureData[];
}

const COMPETITION_COLORS = {
  HIGH: '#ef4444', // red-500
  MEDIUM: '#f59e0b', // amber-500
  LOW: '#10b981', // green-500
};

const COMPETITION_LABELS = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

export default function ExposureChart({ data }: ExposureChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">검색 노출도 분석</h3>
        <p className="text-gray-500 text-center py-8">노출도 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6">검색 노출도 분석</h3>

      {/* 차트 */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="keyword" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: '월간 검색량', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ExposureData;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                      <p className="font-bold text-sm mb-2">{data.keyword}</p>
                      <p className="text-sm text-gray-600">
                        월간 검색량: <strong>{data.monthlySearchVolume.toLocaleString()}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        경쟁도: <strong style={{ color: COMPETITION_COLORS[data.competition] }}>
                          {COMPETITION_LABELS[data.competition]}
                        </strong>
                      </p>
                      {data.trend && (
                        <p className="text-sm text-gray-600">
                          트렌드: <strong>{data.trend === 'RISING' ? '상승 ↗' : data.trend === 'STABLE' ? '안정 →' : '하락 ↘'}</strong>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="monthlySearchVolume" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COMPETITION_COLORS[entry.competition]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COMPETITION_COLORS.HIGH }}></div>
          <span>경쟁도 높음</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COMPETITION_COLORS.MEDIUM }}></div>
          <span>경쟁도 보통</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COMPETITION_COLORS.LOW }}></div>
          <span>경쟁도 낮음</span>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>📈 검색 노출도란?</strong> 해당 키워드의 월간 검색량과 경쟁도를 나타냅니다. 
          검색량이 높고 경쟁도가 낮은 키워드를 활용하면 효과적인 SEO 전략을 수립할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
