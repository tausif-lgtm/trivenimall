export default function TicketPriorityBadge({ priority }) {
  const styles = {
    'Low': 'bg-green-100 text-green-800 border border-green-200',
    'Medium': 'bg-blue-100 text-blue-800 border border-blue-200',
    'High': 'bg-orange-100 text-orange-800 border border-orange-200',
    'Critical': 'bg-red-100 text-red-800 border border-red-200',
  };

  const dots = {
    'Low': 'bg-green-500',
    'Medium': 'bg-blue-500',
    'High': 'bg-orange-500',
    'Critical': 'bg-red-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority] || 'bg-gray-500'}`}></span>
      {priority}
    </span>
  );
}
