import React, { useState, useEffect } from "react";
import { getToken } from "../storage/auth";
import { API_BASE } from "../config/api";
import {
  Package,
  Search,
  TrendingUp,
  AlertTriangle,
  Trash2,
  DollarSign,
} from "lucide-react";

const StockManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("itemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [manualForm, setManualForm] = useState({
    itemName: "",
    quantity: 1,
    unit: "pieces",
    buyingPrice: "",
    sellingPrice: "",
    supplierName: "",
    notes: "",
  });

  const fetchInventory = React.useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(
        `${API_BASE}/api/inventory?sortBy=${sortBy}&order=${sortOrder}&search=${searchTerm}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
      } else {
        console.error("Failed to fetch inventory:", await res.text());
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, searchTerm]);

  const fetchStats = React.useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/inventory/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        console.error("Failed to fetch stats:", await res.text());
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchInventory();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchInventory, fetchStats]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/inventory/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemName: manualForm.itemName,
          quantity: Number(manualForm.quantity),
          unit: manualForm.unit,
          buyingPrice: Number(manualForm.buyingPrice),
          sellingPrice: Number(manualForm.sellingPrice),
          supplierName: manualForm.supplierName,
          notes: manualForm.notes,
          rawInput: "manual",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setManualForm({
          itemName: "",
          quantity: 1,
          unit: "pieces",
          buyingPrice: "",
          sellingPrice: "",
          supplierName: "",
          notes: "",
        });
        fetchInventory();
        fetchStats();
      } else {
        console.error("Failed to add stock:", data);
      }
    } catch (err) {
      console.error("Error adding stock:", err);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchInventory();
        fetchStats();
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-2">
            Stock Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
            Manage your inventory and add stock manually
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Package className="h-6 w-6" />}
            title="Total Items"
            value={stats?.totalItems || 0}
            subtitle={`${stats?.outOfStockCount || 0} out of stock`}
            color="blue"
          />
          <StatCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Stock Value"
            value={`KES ${(stats?.totalValue || 0).toLocaleString()}`}
            subtitle="Current inventory"
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Potential Revenue"
            value={`KES ${(stats?.potentialRevenue || 0).toLocaleString()}`}
            subtitle={`${(stats?.potentialProfit || 0) >= 0 ? "Profit" : "Loss"}: KES ${Math.abs(stats?.potentialProfit || 0).toLocaleString()}`}
            color="purple"
          />
          <StatCard
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Low Stock Items"
            value={stats?.lowStockCount || 0}
            subtitle="Needs reorder"
            color={stats?.lowStockCount > 0 ? "red" : "green"}
          />
        </div>

        {/* Manual Stock Entry */}
        <div className="bg-white dark:bg-[#0f172a]/70 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/5 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add Stock Manually
          </h2>
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={manualForm.itemName}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, itemName: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Tomatoes"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Unit
                </label>
                <select
                  value={manualForm.unit}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, unit: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pieces">Pieces</option>
                  <option value="kg">Kg</option>
                  <option value="bundles">Bundles</option>
                  <option value="bags">Bags</option>
                  <option value="sacks">Sacks</option>
                  <option value="crates">Crates</option>
                  <option value="liters">Liters</option>
                  <option value="grams">Grams</option>
                  <option value="units">Units</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setManualForm({
                        ...manualForm,
                        quantity: Math.max(1, Number(manualForm.quantity) - 1),
                      })
                    }
                    className="px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.quantity}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        quantity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setManualForm({
                        ...manualForm,
                        quantity: Number(manualForm.quantity) + 1,
                      })
                    }
                    className="px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Buying Price (total)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualForm.buyingPrice}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      buyingPrice: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Selling Price (per unit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualForm.sellingPrice}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      sellingPrice: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="15"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Supplier (optional)
                </label>
                <input
                  type="text"
                  value={manualForm.supplierName}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      supplierName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={manualForm.notes}
                onChange={(e) =>
                  setManualForm({ ...manualForm, notes: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Any details about this stock"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Add Stock
            </button>
          </form>
        </div>

        {/* Low Stock Alerts */}
        {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Low Stock Alert
              </h3>
            </div>
            <div className="space-y-2">
              {stats.lowStockItems.map((item) => (
                <div
                  key={item._id}
                  className="text-sm text-red-800 dark:text-red-200"
                >
                  {item.itemName}: {item.currentQuantity} {item.unit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="itemName">Name</option>
              <option value="currentQuantity">Quantity</option>
              <option value="stockValue">Value</option>
              <option value="updatedAt">Last Updated</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => (
            <InventoryCard key={item._id} item={item} onDelete={deleteItem} />
          ))}
        </div>

        {inventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No inventory items yet. Add your first item above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    green:
      "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    red: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    purple:
      "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-[#0f172a]/70 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/5 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
};

const InventoryCard = ({ item, onDelete }) => {
  const profitMargin = (
    ((item.sellingPrice - item.buyingPrice) / item.buyingPrice) *
    100
  ).toFixed(1);
  const isLowStock = item.currentQuantity <= item.reorderLevel;

  return (
    <div className="bg-white dark:bg-[#0f172a]/70 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/5 hover:border-blue-400/40 hover:shadow-xl transition-all duration-300 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {item.itemName}
          </h3>
          {isLowStock && (
            <span className="inline-block mt-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded">
              Low Stock
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(item._id)}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {item.currentQuantity} {item.unit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">
            Buying Price:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            KES {item.buyingPrice.toLocaleString()}/{item.unit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">
            Selling Price:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            KES {item.sellingPrice.toLocaleString()}/{item.unit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Stock Value:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            KES {item.stockValue.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">
            Profit Margin:
          </span>
          <span
            className={`font-medium ${profitMargin > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {profitMargin}%
          </span>
        </div>
        {item.supplierName && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Supplier:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {item.supplierName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagement;
