import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useOrders } from "../hooks/useOrders";
import OrderCard from "../components/OrderCard";
import OrderDetailModal from "./OrderDetail";

const SERVICE_CATEGORIES = [
  { label: "🛠️ 服务项目", items: ["打气/上油(2r)","除锈剂(5r)","打气筒(10r)","新车组装-通勤车(35r)","新车组装-山地车(45r)","异响排查(10r)","零件安装/拆卸-车后座/脚踏板/脚撑架(10r)"] },
  { label: "🛑 刹车系统", items: ["刹车调试-单边(10r)","刹车调试-双边(15r)","刹车器更换-单边(15r)","刹车器更换-双边(20r)","刹车器(10r)","刹车线更换-单边(12r)","刹车线更换-双边(20r)","刹车线/管(3r)","刹把更换-非油刹(15r)","刹车手柄(5r)"] },
  { label: "🔄 轮组系统", items: ["内胎更换-前轮(25r)","内胎更换-后轮(30r)","内胎(10-15r)","内外胎一起更换-前轮(30r)","内外胎一起更换-后轮(35r)"] },
  { label: "⚙️ 变速系统", items: ["后拨更换(30r)","变速调试-单边(10r)","变速调试-双边(15r)","尾勾更换(15r)"] },
  { label: "🔗 传动系统", items: ["牙盘更换(30r)","链条更换(15r)","链条(10-20r)","前叉滚珠更换(30r)","滚珠(5-10r)","掉链子(10-20r)","链条松紧器(2r)"] },
  { label: "📌 其他", items: ["其他故障"] },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, createOrder, uploadImage, fetchOrders, loading } = useOrders();
  const [showForm, setShowForm] = useState(true);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);

  const [serviceType, setServiceType] = useState("");
  const [customFault, setCustomFault] = useState("");
  const [bikeBrand, setBikeBrand] = useState("");
  const [bikeColor, setBikeColor] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [repairDay, setRepairDay] = useState("");
  const [rushTime, setRushTime] = useState("");
  const [location, setLocation] = useState("");
  const [detailLocation, setDetailLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role !== "customer") { navigate("/dashboard"); return; }
    fetchOrders("customer");
  }, [user, navigate, fetchOrders]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setSubmitError("");
    try {
      // 前端压缩图片：最大1280宽，JPEG质量0.6，把3MB压到200KB以内
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            const max = 1280;
            if (w > max) { h = h * max / w; w = max; }
            if (h > max) { w = w * max / h; h = max; }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = await uploadImage(compressedBase64);
      setImages(prev => [...prev, url]);
    } catch (err: any) { setSubmitError("图片上传失败: " + (err.message || "未知错误")); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const getFinalServiceType = () => {
    if (serviceType === "其他故障") return `其他故障: ${customFault || "未填写"}`;
    return serviceType;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType) { setSubmitError("请选择服务项目"); return; }
    if (serviceType === "其他故障" && !customFault.trim()) { setSubmitError("请填写其他故障的具体内容"); return; }
    if (!repairDay) { setSubmitError("请选择维修日期"); return; }
    if (repairDay === "加急" && !rushTime.trim()) { setSubmitError("请填写加急时间"); return; }
    if (!location) { setSubmitError("请选择维修地点"); return; }
    if (location === "上门" && !detailLocation.trim()) { setSubmitError("请填写具体上门位置（教学楼/宿舍楼）"); return; }
    if (images.length === 0) { setSubmitError("请上传至少一张单车位置图片"); return; }
    setSubmitError(""); setSubmitting(true);
    try {
      await createOrder({
        serviceType: getFinalServiceType(),
        repairDay,
        location,
        detailLocation: location === "上门" ? detailLocation : undefined,
        isRush: repairDay === "加急",
        rushTime: repairDay === "加急" ? rushTime : undefined,
        imagePaths: images,
        bikeBrand: bikeBrand || undefined,
        bikeColor: bikeColor || undefined,
        problemDescription: problemDescription || undefined,
        urgentLevel: repairDay === "加急" ? "urgent" : "normal",
      });
      setSubmitSuccess(true);
      setServiceType(""); setCustomFault(""); setBikeBrand(""); setBikeColor("");
      setProblemDescription(""); setRepairDay(""); setRushTime(""); setLocation(""); setDetailLocation("");
      setImages([]);
      fetchOrders("customer");
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) { setSubmitError(err.message || "提交失败"); }
    finally { setSubmitting(false); }
  };

  const myOrders = orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">客户中心</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className={`px-4 py-2 rounded text-sm font-medium transition ${showForm ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"}`}>提交维修</button>
          <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded text-sm font-medium transition ${!showForm ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"}`}>我的订单 ({myOrders.length})</button>
        </div>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">提交维修申请</h2>
          <p className="text-xs text-gray-400 mb-4">营业时间：每周二、五统一修 | 加急可约其他时间(+10r) | 上门(+10r)</p>
          {submitSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">✅ 维修申请已成功提交！维修员将尽快处理您的订单。</div>}
          {submitError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{submitError}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 服务项目 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务项目 <span className="text-red-500">*</span></label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">-- 请选择服务项目 --</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <optgroup key={cat.label} label={cat.label}>
                    {cat.items.map((item) => (<option key={item} value={item}>{item}</option>))}
                  </optgroup>
                ))}
              </select>
              {serviceType === "其他故障" && (
                <input type="text" value={customFault} onChange={(e) => setCustomFault(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请描述具体的故障内容" required />
              )}
            </div>

            {/* 单车信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">单车品牌</label><input type="text" value={bikeBrand} onChange={(e) => setBikeBrand(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="如：捷安特" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">颜色</label><input type="text" value={bikeColor} onChange={(e) => setBikeColor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="如：黑色" /></div>
            </div>

            {/* 补充说明 */}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">补充说明</label><textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="如有其他需要说明的情况可在此补充" /></div>

            {/* 图片上传 - 必填 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上传单车位置图片 <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition disabled:opacity-50">{uploading ? "上传中..." : "选择图片"}</button>
                <span className="text-xs text-gray-400">支持 JPG/PNG，单张不超过 5MB</span>
              </div>
              {images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden">
                      <img src={url} alt={`图片${idx+1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl text-xs px-1">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 日期 + 加急 + 地点 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">维修日期 <span className="text-red-500">*</span></label>
                <select value={repairDay} onChange={(e) => setRepairDay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">-- 请选择 --</option>
                  <option value="周二">周二</option>
                  <option value="周五">周五</option>
                  <option value="加急">加急 (+10r)</option>
                </select>
              </div>
              {repairDay === "加急" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">加急时间 <span className="text-red-500">*</span></label>
                  <input type="text" value={rushTime} onChange={(e) => setRushTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="如：周三下午3点" required />
                </div>
              ) : <div />}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">维修地点 <span className="text-red-500">*</span></label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">-- 请选择 --</option>
                  <option value="四教停车场">四教停车场</option>
                  <option value="46栋停车场">46栋停车场</option>
                  <option value="上门">上门 (+10r)</option>
                </select>
                {location === "上门" && (
                  <input type="text" value={detailLocation} onChange={(e) => setDetailLocation(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入具体位置（如：三教302、42栋宿舍楼下）" required />
                )}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md transition">
              {submitting ? "提交中..." : "提交维修申请"}
            </button>
          </form>

          <details className="mt-4 border rounded">
            <summary className="px-4 py-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 bg-gray-50 rounded">📋 查看完整价目表</summary>
            <div className="p-4 text-xs text-gray-600 space-y-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <div key={cat.label}><p className="font-medium text-gray-700">{cat.label}</p><div className="grid grid-cols-2 gap-x-4 gap-y-0.5 ml-2">{cat.items.map((item) => (<span key={item}>• {item}</span>))}</div></div>
              ))}
              <div className="mt-2 pt-2 border-t text-gray-400"><p>📌 其他疑难杂症根据具体情况定价 | 七日内包售后处理(逾期不候)</p><p>📌 单车墙有部分工具/零件可单独出售</p></div>
            </div>
          </details>
        </div>
      ) : (
        <div>
          {loading ? (<div className="text-center py-12 text-gray-500">加载中...</div>) : myOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-400 text-lg mb-2">还没有维修订单</p><button onClick={() => setShowForm(true)} className="text-blue-600 hover:text-blue-800 text-sm">去提交第一个维修申请 →</button></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{myOrders.map((order) => (<OrderCard key={order.id} order={order} onView={setViewOrderId} />))}</div>
          )}
        </div>
      )}

      {viewOrderId && (<OrderDetailModal orderId={viewOrderId} onClose={() => { setViewOrderId(null); fetchOrders("customer"); }} />)}
    </div>
  );
}
