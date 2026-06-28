import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useOrders } from "../hooks/useOrders";
import OrderCard from "../components/OrderCard";
import OrderDetailModal from "./OrderDetail";

export default function OperatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, fetchOrders, loading } = useOrders();
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);

  // 筛选
  const [filterDay, setFilterDay] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterRush, setFilterRush] = useState("all");

  useEffect(() => {
    if (user?.role !== "operator") { navigate("/dashboard"); return; }
    fetchOrders(undefined, { repairDay: filterDay, location: filterLocation, isRush: filterRush });
  }, [user, navigate, fetchOrders, filterDay, filterLocation, filterRush]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">运营管理面板</h1>
        <span className="text-sm text-gray-500">共 {orders.length} 个订单</span>
      </div>

      {/* 筛选器 - 层级：日期 → 地点 → 加急 */}
      <div className="flex gap-3 mb-4 p-3 bg-white rounded-lg shadow-sm border items-center flex-wrap">
        <span className="text-sm text-gray-500 font-medium">筛选：</span>
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded">
          <option value="all">全部日期</option>
          <option value="周二">周二</option>
          <option value="周五">周五</option>
        </select>
        <span className="text-gray-300">▸</span>
        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded">
          <option value="all">全部地点</option>
          <option value="四教停车场">四教停车场</option>
          <option value="46栋停车场">46栋停车场</option>
        </select>
        <span className="text-gray-300">▸</span>
        <select value={filterRush} onChange={(e) => setFilterRush(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded">
          <option value="all">全部类型</option>
          <option value="1">仅加急</option>
          <option value="0">非加急</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">加载中...</div>
      : orders.length === 0 ? <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-400 text-lg">没有匹配的订单</p></div>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onView={setViewOrderId} showActions={true} />
          ))}
        </div>
      }

      {viewOrderId && (
        <OrderDetailModal orderId={viewOrderId} isOperator onClose={() => { setViewOrderId(null); fetchOrders(undefined, { repairDay: filterDay, location: filterLocation, isRush: filterRush }); }} />
      )}
    </div>
  );
}
