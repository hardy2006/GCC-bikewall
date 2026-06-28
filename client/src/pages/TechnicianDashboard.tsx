import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useOrders } from "../hooks/useOrders";
import OrderCard from "../components/OrderCard";
import OrderDetailModal from "./OrderDetail";

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, fetchOrders, acceptOrder, updateStatus, loading } = useOrders();
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);
  const [statusOrderId, setStatusOrderId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("repairing");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");

  // 筛选
  const [filterDay, setFilterDay] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");

  useEffect(() => {
    if (user?.role !== "technician") { navigate("/dashboard"); return; }
    fetchOrders("technician", { repairDay: filterDay, location: filterLocation });
  }, [user, navigate, fetchOrders, filterDay, filterLocation]);

  const handleAccept = async (orderId: number) => {
    try { await acceptOrder(orderId); fetchOrders("technician", { repairDay: filterDay, location: filterLocation }); }
    catch (err: any) { alert(err.message || "接单失败"); }
  };

  const handleStatusUpdate = async () => {
    if (!statusOrderId) return; setActionError("");
    try { await updateStatus(statusOrderId, newStatus, note || undefined); setStatusOrderId(null); setNote("");
      fetchOrders("technician", { repairDay: filterDay, location: filterLocation }); }
    catch (err: any) { setActionError(err.message || "更新失败"); }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const myTasks = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">维修员工作台</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowMyTasks(false)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${!showMyTasks ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"}`}>
            待接订单 ({pendingOrders.length})
          </button>
          <button onClick={() => setShowMyTasks(true)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${showMyTasks ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"}`}>
            我的任务 ({myTasks.length})
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-3 mb-4 p-3 bg-white rounded-lg shadow-sm border items-center">
        <span className="text-sm text-gray-500 font-medium">筛选：</span>
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded">
          <option value="all">全部日期</option>
          <option value="周二">周二</option>
          <option value="周五">周五</option>
        </select>
        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded">
          <option value="all">全部地点</option>
          <option value="四教停车场">四教停车场</option>
          <option value="46栋停车场">46栋停车场</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">加载中...</div>
      : !showMyTasks ? (
        pendingOrders.length === 0 ? <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-400 text-lg">暂无待接订单 🎉</p></div>
        : <div className="grid gap-4 md:grid-cols-2">{pendingOrders.map((order) => (
            <OrderCard key={order.id} order={order} onView={setViewOrderId} onAccept={handleAccept} />
          ))}</div>
      ) : (
        myTasks.length === 0 ? <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-400 text-lg">还没有接单任务</p></div>
        : <div className="grid gap-4 md:grid-cols-2">{myTasks.map((order) => (
            <OrderCard key={order.id} order={order} onView={setViewOrderId} onStatusUpdate={setStatusOrderId} />
          ))}</div>
      )}

      {statusOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">更新维修进度 - #{statusOrderId}</h2>
            {actionError && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{actionError}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">新状态</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="repairing">维修中</option><option value="completed">已完成</option>
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="维修备注（可选）" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleStatusUpdate} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">确认更新</button>
              <button onClick={() => { setStatusOrderId(null); setActionError(""); }} className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium">取消</button>
            </div>
          </div>
        </div>
      )}

      {viewOrderId && (
        <OrderDetailModal orderId={viewOrderId} onClose={() => { setViewOrderId(null); fetchOrders("technician", { repairDay: filterDay, location: filterLocation }); }} />
      )}
    </div>
  );
}
