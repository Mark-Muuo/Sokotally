import React, { useEffect, useMemo, useState } from 'react';
import './Record.css';
import { loadTransactions, saveTransactions } from '../storage/transactions';

const Record = () => {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [selectedCategory, setSelectedCategory] = useState('all'); // all | sale | expense | debt | loan

  const [transactions, setTransactions] = useState(() => {
    const seed = [
      { id: 'S-001', date: todayIso, category: 'sale', item: 'Maize Flour', quantity: 10, amount: 1500 },
      { id: 'S-002', date: todayIso, category: 'sale', item: 'Sugar 1kg', quantity: 6, amount: 900 },
      { id: 'E-001', date: todayIso, category: 'expense', expenseType: 'Transport', item: 'Delivery Van Fuel', quantity: 1, amount: 2500 },
      { id: 'D-001', date: todayIso, category: 'debt', customerName: 'Jane Doe', item: 'Cooking Oil 2L', amount: 600, status: 'unpaid' },
      { id: 'L-001', date: todayIso, category: 'loan', lender: 'Chama Group', amount: 5000, status: 'unpaid' }
    ];
    const loaded = loadTransactions();
    return loaded && loaded.length ? loaded : seed;
  });

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const kes = useMemo(() => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }), []);

  const handleCategorySelect = (val) => setSelectedCategory(val);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredByDateAndSearch = useMemo(() => {
    return transactions.filter(t => {
      if (t.date !== selectedDate) return false;
      if (!normalizedSearch) return true;
      const haystack = [t.item, t.expenseType, t.customerName, t.lender, t.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [transactions, selectedDate, normalizedSearch]);

  const byCategory = useMemo(() => ({
    sale: filteredByDateAndSearch.filter(t => t.category === 'sale'),
    expense: filteredByDateAndSearch.filter(t => t.category === 'expense'),
    debt: filteredByDateAndSearch.filter(t => t.category === 'debt'),
    loan: filteredByDateAndSearch.filter(t => t.category === 'loan')
  }), [filteredByDateAndSearch]);

  const upsertTransaction = (category, payload, idToUpdate) => {
    setTransactions(prev => {
      if (idToUpdate) {
        return prev.map(t => t.id === idToUpdate ? { ...t, ...payload } : t);
      }
      const nextIdPrefix = category.charAt(0).toUpperCase();
      const nextIndex = prev.filter(t => t.category === category).length + 1;
      const nextId = `${nextIdPrefix}-${String(nextIndex).padStart(3, '0')}`;
      return [...prev, { id: nextId, date: selectedDate, category, ...payload }];
    });
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="record-page">
      <header className="page-header">
        <h1>Record Transactions</h1>
        <p>Search, filter and manage daily records</p>
      </header>

      <div className="filters-bar">
        <div className="search-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search items, customer, lender, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="date-group">
          <label className="control-label">Date</label>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="category-group">
          <label className="control-label">Category</label>
          <select className="category-select" value={selectedCategory} onChange={(e) => handleCategorySelect(e.target.value)}>
            <option value="all">All</option>
            <option value="sale">Sales</option>
            <option value="expense">Expenses</option>
            <option value="debt">Debt</option>
            <option value="loan">Loans</option>
          </select>
        </div>
      </div>

      <div className="tables-wrap">
        {(selectedCategory === 'all' || selectedCategory === 'sale') && (
          <CategoryTable
            title="Sales"
            categoryKey="sale"
            rows={byCategory.sale}
            kes={kes}
            columns={[
              { key: 'item', label: 'Item', type: 'text' },
              { key: 'quantity', label: 'Quantity', type: 'number', min: 1 },
              { key: 'amount', label: 'Amount (KSH)', type: 'number', min: 0 }
            ]}
            onAdd={(data) => upsertTransaction('sale', data)}
            onUpdate={(id, data) => upsertTransaction('sale', data, id)}
            onDelete={deleteTransaction}
          />
        )}

        {(selectedCategory === 'all' || selectedCategory === 'expense') && (
          <CategoryTable
            title="Expenses"
            categoryKey="expense"
            rows={byCategory.expense}
            kes={kes}
            columns={[
              { key: 'expenseType', label: 'Expense Type', type: 'text' },
              { key: 'item', label: 'Item', type: 'text' },
              { key: 'quantity', label: 'Quantity', type: 'number', min: 1 },
              { key: 'amount', label: 'Amount (KSH)', type: 'number', min: 0 }
            ]}
            onAdd={(data) => upsertTransaction('expense', data)}
            onUpdate={(id, data) => upsertTransaction('expense', data, id)}
            onDelete={deleteTransaction}
          />
        )}

        {(selectedCategory === 'all' || selectedCategory === 'debt') && (
          <CategoryTable
            title="Debt"
            categoryKey="debt"
            rows={byCategory.debt}
            kes={kes}
            columns={[
              { key: 'customerName', label: 'Customer Name', type: 'text' },
              { key: 'item', label: 'Item', type: 'text' },
              { key: 'amount', label: 'Amount (KSH)', type: 'number', min: 0 },
              { key: 'status', label: 'Status', type: 'select', options: ['paid', 'unpaid'] }
            ]}
            onAdd={(data) => upsertTransaction('debt', data)}
            onUpdate={(id, data) => upsertTransaction('debt', data, id)}
            onDelete={deleteTransaction}
          />
        )}

        {(selectedCategory === 'all' || selectedCategory === 'loan') && (
          <CategoryTable
            title="Loans"
            categoryKey="loan"
            rows={byCategory.loan}
            kes={kes}
            columns={[
              { key: 'lender', label: 'Lender', type: 'text' },
              { key: 'amount', label: 'Amount (KSH)', type: 'number', min: 0 },
              { key: 'status', label: 'Status', type: 'select', options: ['paid', 'unpaid'] }
            ]}
            onAdd={(data) => upsertTransaction('loan', data)}
            onUpdate={(id, data) => upsertTransaction('loan', data, id)}
            onDelete={deleteTransaction}
          />
        )}
      </div>
    </div>
  );
};

export default Record;

const CategoryTable = ({ title, categoryKey, rows, columns, kes, onAdd, onUpdate, onDelete }) => {
  const total = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0), [rows]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [modalData, setModalData] = useState({});
  const [editingId, setEditingId] = useState(null);

  const openAddModal = () => {
    setModalMode('add');
    setModalData({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode('edit');
    setModalData(row);
    setEditingId(row.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData({});
    setEditingId(null);
  };

  const submitModal = (data) => {
    const cleaned = cleanObject(data);
    if (modalMode === 'add') {
      if (!window.confirm(`Add new ${title.slice(0, -1)}?`)) return;
      onAdd(cleaned);
    } else if (modalMode === 'edit' && editingId) {
      if (!window.confirm('Save changes?')) return;
      onUpdate(editingId, cleaned);
    }
    closeModal();
  };

  return (
    <section className="category-card">
      <div className="category-header">
        <h3>{title}</h3>
        <div className="category-actions">
          <button type="button" className="btn primary" onClick={openAddModal}>Add</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>S/N</th>
              {columns.map(c => (<th key={c.key}>{c.label}</th>))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="empty">No records</td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                {columns.map(c => (
                  <td key={c.key}>
                    {renderCell(row, c, kes)}
                  </td>
                ))}
                <td className="row-actions">
                  <button className="btn small" onClick={() => openEditModal(row)}>Edit</button>
                  <button className="btn small danger" onClick={() => { if (window.confirm('Delete this record?')) onDelete(row.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="total-cell" colSpan={columns.length + 1}>Total</td>
              <td className="total-amount">{kes.format(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {modalOpen && (
        <ModalForm
          title={`${modalMode === 'add' ? 'Add' : 'Edit'} ${title.slice(0, -1)}`}
          columns={columns}
          initialData={modalData}
          onCancel={closeModal}
          onSubmit={submitModal}
        />
      )}
    </section>
  );
};

const renderCell = (row, column, kes) => {
  const value = row[column.key];
  if (column.key === 'amount') {
    return kes.format(Number(value) || 0);
  }
  return value ?? '';
};

const normalizeValue = (key, value) => {
  if (key === 'quantity' || key === 'amount') {
    const num = Number(value);
    return Number.isFinite(num) ? num : '';
  }
  return value;
};

const cleanObject = (obj) => {
  const out = {};
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    if (v !== '' && v !== undefined) out[k] = v;
  });
  return out;
};

const ModalForm = ({ title, columns, initialData, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState(() => {
    const base = {};
    columns.forEach(c => { base[c.key] = initialData[c.key] ?? ''; });
    return base;
  });

  const handleChange = (key, value, column) => {
    let v = value;
    if (column.type === 'number') {
      const num = Number(v);
      v = Number.isFinite(num) ? num : '';
    }
    setFormData(prev => ({ ...prev, [key]: v }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // basic validation: ensure required-like fields are present if numeric or select
    for (const col of columns) {
      const v = formData[col.key];
      if (col.type === 'number') {
        if (!Number.isFinite(v) || (col.min !== undefined && v < col.min)) {
          alert(`${col.label} must be a valid number${col.min !== undefined ? ` (min ${col.min})` : ''}.`);
          return;
        }
      }
      if (col.type === 'select' && v && col.options && !col.options.includes(v)) {
        alert(`${col.label} must be one of: ${col.options.join(', ')}`);
        return;
      }
    }
    onSubmit(formData);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h4>{title}</h4>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {columns.map(col => (
            <div className="modal-field" key={col.key}>
              <label className="modal-label">{col.label}</label>
              {col.type === 'select' ? (
                <select className="input" value={formData[col.key]} onChange={(e) => handleChange(col.key, e.target.value, col)}>
                  <option value="">Select</option>
                  {col.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type={col.type}
                  min={col.min}
                  value={formData[col.key]}
                  onChange={(e) => handleChange(col.key, e.target.value, col)}
                />
              )}
            </div>
          ))}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

