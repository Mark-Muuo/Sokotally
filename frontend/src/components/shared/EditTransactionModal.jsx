import React from "react";
import { createPortal } from "react-dom";

const EditTransactionModal = ({
  show,
  onClose,
  onSubmit,
  formData,
  setFormData,
  modalType,
  setModalType,
  editingId,
}) => {
  if (!show) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 p-6 max-w-lg w-full rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
          {editingId ? "Edit" : "Add"} {modalType}
        </h3>
        <form
          onSubmit={onSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {editingId && (
            <div>
              <label className="text-gray-600 dark:text-slate-400 text-sm block mb-2">
                Transaction Type
              </label>
              <select
                value={modalType}
                onChange={(e) => setModalType(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white"
              >
                <option value="sale">Sale</option>
                <option value="expense">Expense</option>
                <option value="debt">Loan</option>
                <option value="loan">Loan</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-gray-600 dark:text-slate-400 text-sm block mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="text-gray-600 dark:text-slate-400 text-sm block mb-2">
              Amount (KSh)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="text-gray-600 dark:text-slate-400 text-sm block mb-2">
              Description
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white"
              rows="2"
            />
          </div>
          <div>
            <label className="text-gray-600 dark:text-slate-400 text-sm block mb-2">
              Customer/Borrower Name (Optional)
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white"
              placeholder="Enter customer or borrower name"
            />
          </div>
          <div>
            <label className="text-gray-600 dark:text-slate-400 text-sm block mb-2">
              Payment Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          {(modalType === "sale" || modalType === "debt") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-600 dark:text-slate-400 text-sm">
                  Items
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      items: [
                        ...formData.items,
                        { name: "", quantity: 1, unitPrice: 0 },
                      ],
                    })
                  }
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  + Add Item
                </button>
              </div>
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[idx].name = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white text-sm"
                    placeholder="Item name"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[idx].quantity = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="w-20 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white text-sm"
                    placeholder="Qty"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice || item.price}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                      newItems[idx].price = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="w-24 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white text-sm"
                    placeholder="Price"
                    required
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = formData.items.filter(
                          (_, i) => i !== idx
                        );
                        setFormData({ ...formData, items: newItems });
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Remove item"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Total:{" "}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  KSh{" "}
                  {formData.items
                    .reduce(
                      (sum, item) =>
                        sum +
                        (item.unitPrice || item.price || 0) *
                          (item.quantity || 0),
                      0
                    )
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium"
            >
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditTransactionModal;
