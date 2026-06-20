import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GrowthChart({ data = [], title = 'Grafik Pertumbuhan Badan', yLabel = 'Tinggi Badan (cm)' }) {
  const sampleData = data.length > 0 ? data : [
    { bulan: 0,  anak: 49, median: 49.9, minus2sd: 46.1, plus2sd: 53.7 },
    { bulan: 3,  anak: 60, median: 61.4, minus2sd: 57.2, plus2sd: 65.6 },
    { bulan: 6,  anak: 66, median: 67.6, minus2sd: 63.3, plus2sd: 71.9 },
    { bulan: 9,  anak: 71, median: 72.0, minus2sd: 67.5, plus2sd: 76.5 },
    { bulan: 12, anak: 74, median: 75.7, minus2sd: 71.1, plus2sd: 80.3 },
    { bulan: 18, anak: 80, median: 82.3, minus2sd: 77.4, plus2sd: 87.2 },
    { bulan: 24, anak: 85, median: 87.8, minus2sd: 82.6, plus2sd: 93.0 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[180px]">
        <p className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-2">Umur: {label} bulan</p>
        <div className="space-y-1.5">
          {payload.map((e, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                <span className="text-gray-600">{e.name}</span>
              </div>
              <span className="font-semibold text-gray-900">{e.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sampleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="bulan" 
            stroke="#9ca3af" 
            tick={{ fill: '#6b7280', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#9ca3af" 
            tick={{ fill: '#6b7280', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#4b5563' }}
            iconType="circle"
          />
          <Line type="monotone" dataKey="plus2sd" stroke="#93c5fd" strokeWidth={2} strokeDasharray="5 5" dot={false} name="+2 SD" />
          <Line type="monotone" dataKey="median" stroke="#10b981" strokeWidth={2} dot={false} name="Median (0)" />
          <Line type="monotone" dataKey="minus2sd" stroke="#fcd34d" strokeWidth={2} strokeDasharray="5 5" dot={false} name="-2 SD (Stunted)" />
          <Line type="monotone" dataKey="minus3sd" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="-3 SD (Severe)" />
          <Line type="monotone" dataKey="anak" stroke="#0f766e" strokeWidth={3}
            dot={{ r: 5, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }}
            name="Z-Score Anak" connectNulls={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
