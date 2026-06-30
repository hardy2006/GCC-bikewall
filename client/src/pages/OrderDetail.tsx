import React, { useEffect, useState } from "react";
import { useOrders, RepairOrder, ProgressLog } from "../hooks/useOrders";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge } from "../components/StatusBadge";

interface Props { orderId: number; onClose: () => void; isOperator?: boolean; }

export default function OrderDetailModal({ orderId, onClose, isOperator }: Props) {
  const { user } = useAuth();
  const { getOrderDetail, updateStatus, acceptOrder, cancelOrder, transferRequest, transferAccept } = useOrders();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getOrderDetail(orderId).then((data) => { setOrder(data.order); setLogs(data.logs); })
      .catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [orderId, getOrderDetail]);

  const handleStatusUpdate = async (status: string) => {
    try { const updated = await updateStatus(orderId, status); setOrder(updated); const data = await getOrderDetail(orderId); setLogs(data.logs); }
    catch (err: any) { alert(err.message); }
  };

  const handleAccept = async () => {
    try { const updated = await acceptOrder(orderId); setOrder(updated); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {loading ? <div className="p-12 text-center text-gray-500">加载中...</div>
        : error ? <div className="p-6"><div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">{error}</div><button onClick={onClose} className="mt-3 text-blue-600 text-sm">关闭</button></div>
        : order ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">订单 #{order.id} 详情</h2>
                <div className="flex gap-2 mt-1">
                  <StatusBadge status={order.status} />
                  {order.isRush === 1 && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">加急</span>}
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div><span className="text-gray-400">客户：</span>{order.customerName}</div>
              <div><span className="text-gray-400">电话：</span>{order.customerPhone || "-"}</div>
              <div className="col-span-2"><span className="text-gray-400">服务项目：</span><span className="text-gray-800 font-medium">{order.serviceType || "-"}</span></div>
              <div><span className="text-gray-400">维修日期：</span>{order.repairDay || "-"}</div>
              <div><span className="text-gray-400">维修地点：</span>{order.location || "-"}</div>
              <div><span className="text-gray-400">编号：</span>{order.orderNumber || "-"}</div>
              {order.bikeColor && <div><span className="text-gray-400">颜色：</span>{order.bikeColor}</div>}
              <div><span className="text-gray-400">维修员：</span>{order.technicianName || "未分配"}</div>
              <div><span className="text-gray-400">创建时间：</span>{new Date(order.createdAt).toLocaleString("zh-CN")}</div>
              <div className="col-span-2"><span className="text-gray-400">最后更新：</span>{new Date(order.updatedAt).toLocaleString("zh-CN")}</div>
            </div>

            {order.problemDescription && (
              <div className="mb-4"><h3 className="text-sm font-medium text-gray-700 mb-1">问题描述</h3>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{order.problemDescription}</p></div>
            )}

            {order.imagePaths && order.imagePaths.length > 0 && (
              <div className="mb-4"><h3 className="text-sm font-medium text-gray-700 mb-1">位置图片</h3>
                <div className="flex gap-2 flex-wrap">
                  {order.imagePaths.map((url, i) => (
                    <img key={i} src={url} alt={`位置图${i+1}`}
                      className="w-48 h-36 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div></div>
            )}

            {order.repairNotes && (
              <div className="mb-4"><h3 className="text-sm font-medium text-gray-700 mb-1">维修备注</h3>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{order.repairNotes}</p></div>
            )}

            {isOperator && order.status !== "completed" && order.status !== "cancelled" && (
              <div className="flex gap-2 mb-4">
                {order.status === "pending" && (
                  <button onClick={handleAccept} className="px-4 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white">接单</button>
                )}
                {order.status === "accepted" && (
                  <button onClick={() => handleStatusUpdate("repairing")} className="px-4 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">开始维修</button>
                )}
                {order.status === "repairing" && (
                  <button onClick={() => handleStatusUpdate("completed")} className="px-4 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">标记完成</button>
                )}
                <button onClick={() => handleStatusUpdate("cancelled")} className="px-4 py-1.5 rounded text-sm font-medium bg-red-500 hover:bg-red-600 text-white">取消订单</button>
              </div>
            )}

            {!isOperator && order.status === "pending" && (
              <div className="flex gap-2 mb-4">
                <button onClick={async () => {
                  if (confirm("确认取消此订单？")) {
                    await cancelOrder(order.id);
                    const data = await getOrderDetail(order.id);
                    setOrder(data.order); setLogs(data.logs);
                  }
                }} className="px-4 py-1.5 rounded text-sm font-medium bg-red-100 hover:bg-red-200 text-red-700 border border-red-200">取消订单</button>
              </div>
            )}

            {user?.role === "technician" && order.technicianId === user?.id && (order.status === "accepted" || order.status === "repairing") && (
              <div className="flex gap-2 mb-4">
                <button onClick={async () => {
                  const targetId = prompt("输入目标维修员ID:");
                  if (!targetId || isNaN(Number(targetId))) return;
                  try { const r = await transferRequest(order.id, Number(targetId)); setOrder(r);
                    const d = await getOrderDetail(order.id); setOrder(d.order); setLogs(d.logs); }
                  catch (err: any) { alert(err.message); }
                }} className="px-4 py-1.5 rounded text-sm font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200">转交</button>
              </div>
            )}
            {user?.role === "technician" && order.transferStatus === "pending" && order.transferToId === user?.id && (
              <div className="flex gap-2 mb-4">
                <button onClick={async () => {
                  if (confirm("确认接受转交？")) {
                    try { const r = await transferAccept(order.id); setOrder(r);
                      const d = await getOrderDetail(order.id); setOrder(d.order); setLogs(d.logs); }
                    catch (err: any) { alert(err.message); }
                  }
                }} className="px-4 py-1.5 rounded text-sm font-medium bg-green-100 hover:bg-green-200 text-green-700 border border-green-200">接受转交</button>
              </div>
            )}

            <div><h3 className="text-sm font-medium text-gray-700 mb-2">进度记录</h3>
              {logs.length === 0 ? <p className="text-sm text-gray-400">暂无进度记录</p>
              : <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm p-2 bg-gray-50 rounded">
                      <span className="text-blue-600 font-medium min-w-[60px]">{log.operatorName}</span>
                      <span className="text-gray-500">{log.action}</span>
                      {log.note && <span className="text-gray-400">- {log.note}</span>}
                      <span className="text-gray-400 ml-auto text-xs">{new Date(log.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
