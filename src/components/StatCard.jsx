export default function StatCard({ title, value, sub, icon, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{value}</p>
        {sub && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
            {trend && (
              <span className={`inline-flex items-center font-semibold ${trend === 'good' ? 'text-emerald-600' : trend === 'bad' ? 'text-red-600' : 'text-amber-600'}`}>
                {trend === 'good' ? '↑' : trend === 'bad' ? '↓' : '•'} 
              </span>
            )}
            {sub}
          </p>
        )}
      </div>
      <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
        {icon}
      </div>
    </div>
  );
}
