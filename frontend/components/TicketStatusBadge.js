export default function TicketStatusBadge({ status }) {
  const styles = {
    'Open': 'bg-blue-100 text-blue-800 border border-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Resolved': 'bg-green-100 text-green-800 border border-green-200',
    'Closed': 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
