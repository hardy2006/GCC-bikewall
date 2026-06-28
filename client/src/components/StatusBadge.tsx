import React from 'react';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: '待接单', color: 'bg-yellow-100 text-yellow-800' },
  accepted:   { label: '已接单', color: 'bg-blue-100 text-blue-800' },
  repairing:  { label: '维修中', color: 'bg-orange-100 text-orange-800' },
  completed:  { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled:  { label: '已取消', color: 'bg-gray-100 text-gray-800' },
};

const urgentConfig: Record<string, { label: string; color: string }> = {
  low:    { label: '低', color: 'bg-gray-100 text-gray-600' },
  normal: { label: '普通', color: 'bg-blue-50 text-blue-600' },
  high:   { label: '紧急', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: '非常紧急', color: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function UrgentBadge({ level }: { level: string }) {
  const config = urgentConfig[level] || { label: level, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
