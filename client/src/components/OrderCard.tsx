import React from 'react';
import { RepairOrder } from '../hooks/useOrders';
import { StatusBadge } from './StatusBadge';

interface Props {
  order: RepairOrder;
  onView?: (id: number) => void;
  onAccept?: (id: number) => void;
  onStatusUpdate?: (id: number) => void;
  showActions?: boolean;
}

export default function OrderCard({ order, onView, onAccept, onStatusUpdate, showActions = true }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">
            订单 #{order.id}
            <span className="ml-2"><StatusBadge status={order.status} /></span>
            {order.isRush === 1 && (
              <span className="ml-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">加急</span>
            )}
          </h3>
        </div>
        <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        {order.serviceType && (
          <div className="col-span-2">
            <span className="text-gray-400">服务：</span>
            <span className="text-gray-700 font-medium">{order.serviceType}</span>
          </div>
        )}
        <div>
          <span className="text-gray-400">日期：</span>
          <span className="text-gray-700">{order.repairDay || "-"}</span>
        </div>
        <div>
          <span className="text-gray-400">地点：</span>
          <span className="text-gray-700">{order.location || "-"}</span>
        </div>
        {order.bikeBrand && (
          <div><span className="text-gray-400">品牌：</span><span className="text-gray-700">{order.bikeBrand}</span></div>
        )}
        <div><span className="text-gray-400">客户：</span><span className="text-gray-700">{order.customerName}</span></div>
        {order.technicianName && (
          <div><span className="text-gray-400">维修员：</span><span className="text-gray-700">{order.technicianName}</span></div>
        )}
      </div>

      {order.problemDescription && (
        <div className="mb-2">
          <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">{order.problemDescription}</p>
        </div>
      )}

      {order.imagePaths && order.imagePaths.length > 0 && (
        <div className="flex gap-1 mb-2">
          {order.imagePaths.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt={`图${i+1}`} className="w-16 h-16 object-cover rounded border" />
          ))}
          {order.imagePaths.length > 3 && <span className="text-xs text-gray-400 self-end">+{order.imagePaths.length - 3}</span>}
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          {onView && (
            <button onClick={() => onView(order.id)}
              className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-400 transition">
              查看详情
            </button>
          )}
          {onAccept && order.status === 'pending' && (
            <button onClick={() => onAccept(order.id)}
              className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition">
              接单
            </button>
          )}
          {onStatusUpdate && (order.status === 'accepted' || order.status === 'repairing') && (
            <button onClick={() => onStatusUpdate(order.id)}
              className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition">
              更新进度
            </button>
          )}
        </div>
      )}
    </div>
  );
}
