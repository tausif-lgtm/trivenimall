import Link from 'next/link';

export default function StatsCard({ title, value, icon: Icon, color, subtitle, href }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
    gray: { bg: 'bg-gray-50', icon: 'bg-gray-100 text-gray-600', text: 'text-gray-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
  };

  const c = colorMap[color] || colorMap.blue;

  const inner = (
    <>
      {Icon && (
        <div className={`p-3 rounded-xl ${c.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${c.text}`}>{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {href && <span className="ml-auto text-gray-300 text-xs">→</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
      {inner}
    </div>
  );
}
