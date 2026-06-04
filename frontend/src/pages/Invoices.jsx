import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Printer,
  Download,
  Eye,
  X,
  FileText,
  FileSpreadsheet,
  Trash
} from 'lucide-react';

const Invoices = () => {
  const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'quotations'
  
  // Data State
  const [bills, setBills] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State (Shared mostly)
  const [clientName, setClientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [discount, setDiscount] = useState(0);
  const [advanceReceived, setAdvanceReceived] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Dynamic Services Array
  const [services, setServices] = useState([
    { serviceName: '', quantity: 1, price: 0, total: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'bills') {
        const res = await apiClient.get('/bills');
        setBills(res.data);
      } else {
        const res = await apiClient.get('/quotations');
        setQuotations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setClientName('');
    setMobileNumber('');
    setEmail('');
    setEventName('');
    setEventDate('');
    setEventLocation('');
    setDiscount(0);
    setAdvanceReceived(0);
    setNotes('');
    setServices([{ serviceName: '', quantity: 1, price: 0, total: 0 }]);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setClientName(item.clientName);
    setMobileNumber(item.mobileNumber);
    setEmail(item.email || '');
    setEventName(item.eventName);
    setEventDate(item.eventDate);
    setEventLocation(item.eventLocation || '');
    setDiscount(item.discount || 0);
    setAdvanceReceived(item.advanceReceived || 0);
    setNotes(item.notes || '');
    setServices(item.services && item.services.length > 0 ? item.services : [{ serviceName: '', quantity: 1, price: 0, total: 0 }]);
    setShowModal(true);
  };

  // Service Handlers
  const addServiceRow = () => {
    setServices([...services, { serviceName: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeServiceRow = (index) => {
    const updated = [...services];
    updated.splice(index, 1);
    setServices(updated);
  };

  const updateService = (index, field, value) => {
    const updated = [...services];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'price') {
      updated[index].total = Number(updated[index].quantity) * Number(updated[index].price);
    }
    setServices(updated);
  };

  // Calculations
  const subtotal = services.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - Number(discount));
  const remainingAmount = Math.max(0, grandTotal - Number(advanceReceived));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      clientName,
      mobileNumber,
      email,
      eventName,
      eventDate,
      eventLocation,
      services,
      subtotal,
      discount: Number(discount),
      grandTotal,
      advanceReceived: Number(advanceReceived),
      remainingAmount,
      notes
    };

    try {
      if (activeTab === 'bills') {
        if (editingId) {
          await apiClient.put(`/bills/${editingId}`, payload);
        } else {
          // Send billDate for new creation, API does the rest
          await apiClient.post('/bills', { ...payload, billDate: new Date().toISOString().split('T')[0] });
        }
      } else {
        if (editingId) {
          await apiClient.put(`/quotations/${editingId}`, payload);
        } else {
          await apiClient.post('/quotations', { ...payload, quotationDate: new Date().toISOString().split('T')[0] });
        }
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
      alert(`Save Failed:\n${errorMsg}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        if (activeTab === 'bills') await apiClient.delete(`/bills/${id}`);
        else await apiClient.delete(`/quotations/${id}`);
        fetchData();
      } catch (err) {
        alert('Error deleting record');
      }
    }
  };

  const handlePdfAction = (id, action) => {
    const baseUrl = 'http://localhost:5000/api';
    const endpoint = activeTab === 'bills' ? `/bills/${id}/pdf` : `/quotations/${id}/pdf`;
    const url = `${baseUrl}${endpoint}`;
    
    // Auth token needed since routes are protected
    const token = localStorage.getItem('token');
    
    // Fetch blob and open/download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText);
        }
        return res.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        if (action === 'download') {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${activeTab === 'bills' ? 'Bill' : 'Quotation'}_${id}.pdf`;
          a.click();
        } else {
          window.open(blobUrl, '_blank');
        }
      })
      .catch(err => console.error('PDF fetch error:', err));
  };

  const filteredData = (activeTab === 'bills' ? bills : quotations).filter(item => 
    (item.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.billNumber || item.quotationNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          Bill & Quotation
        </h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm"
        >
          <Plus size={18} />
          {activeTab === 'bills' ? 'Add New Bill' : 'Add New Quotation'}
        </button>
      </div>

      {/* TABS & SEARCH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
        
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'bills' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText size={16} />
            Bills
          </button>
          <button 
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'quotations' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileSpreadsheet size={16} />
            Quotations
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* HISTORY LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">No records found.</p>
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Number</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Client Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Date</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {item.billNumber || item.quotationNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                      {item.clientName}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.billDate || item.quotationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-right">
                      ₹{item.grandTotal?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button onClick={() => handlePdfAction(item._id, 'view')} title="View PDF" className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handlePdfAction(item._id, 'download')} title="Download PDF" className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors">
                        <Download size={16} />
                      </button>
                      <button onClick={() => handlePdfAction(item._id, 'print')} title="Print PDF" className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => openEditModal(item)} title="Edit" className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} title="Delete" className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="md:hidden flex flex-col gap-4">
            {filteredData.map(item => (
              <div key={item._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-white line-clamp-1">{item.clientName}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <span className="font-bold text-slate-400">{item.documentNumber || item.quotationNumber}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <span className="font-black text-lg text-slate-800 dark:text-white">₹{item.grandTotal?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Event</span>
                    <p className="font-medium line-clamp-1">{item.eventName}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                    <p className="font-medium">{new Date(item.billDate || item.quotationDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    <button onClick={() => handlePdfAction(item._id, 'view')} className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handlePdfAction(item._id, 'download')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                      <Download size={16} />
                    </button>
                    <button onClick={() => handlePdfAction(item._id, 'print')} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                      <Printer size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(item)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="p-2 bg-rose-500/10 text-rose-600 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl">
                {editingId ? `Edit ${activeTab === 'bills' ? 'Bill' : 'Quotation'}` : `Create ${activeTab === 'bills' ? 'Bill' : 'Quotation'}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="docForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Client & Event Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Client Details</h4>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Client Name</label>
                      <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Mobile Number</label>
                      <input required type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Email (Optional)</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Event Details</h4>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Event Name</label>
                      <input required type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Rahul's Wedding" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Event Date</label>
                      <input required type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Event Location</label>
                      <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-800 dark:text-white">Services</h4>
                    <button type="button" onClick={addServiceRow} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                      <Plus size={14} /> Add Row
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {services.map((srv, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 sm:hidden">Service Name</label>
                          <input 
                            required 
                            type="text" 
                            placeholder="e.g. Photography, Drone Shoot"
                            value={srv.serviceName} 
                            onChange={e => updateService(idx, 'serviceName', e.target.value)} 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                          />
                        </div>
                        <div className="w-full sm:w-24">
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 sm:hidden">Qty</label>
                          <input 
                            required 
                            type="number" 
                            min="1"
                            value={srv.quantity} 
                            onChange={e => updateService(idx, 'quantity', e.target.value)} 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-center" 
                          />
                        </div>
                        <div className="w-full sm:w-32">
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 sm:hidden">Price (₹)</label>
                          <input 
                            required 
                            type="number" 
                            value={srv.price} 
                            onChange={e => updateService(idx, 'price', e.target.value)} 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                          />
                        </div>
                        <div className="w-full sm:w-32 flex justify-between items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-transparent">
                          <span className="text-[10px] font-bold uppercase text-slate-400 sm:hidden">Total</span>
                          <span className="font-bold text-slate-800 dark:text-white">₹{srv.total}</span>
                        </div>
                        {services.length > 1 && (
                          <button type="button" onClick={() => removeServiceRow(idx)} className="p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0">
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals & Notes Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                  
                  {/* Left Side: Notes */}
                  <div className="space-y-4">
                    {activeTab === 'bills' && (
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Notes</label>
                        <textarea 
                          rows={4} 
                          value={notes} 
                          onChange={e => setNotes(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                          placeholder="Payment terms, special instructions, etc."
                        ></textarea>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Calculations */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <span>Discount (₹)</span>
                      <input 
                        type="number" 
                        value={discount} 
                        onChange={e => setDiscount(e.target.value)} 
                        className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="flex justify-between items-center text-lg font-black text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Grand Total</span>
                      <span>₹{grandTotal}</span>
                    </div>

                    {activeTab === 'bills' && (
                      <>
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400 pt-4">
                          <span>Advance Received (₹)</span>
                          <input 
                            type="number" 
                            value={advanceReceived} 
                            onChange={e => setAdvanceReceived(e.target.value)} 
                            className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-indigo-500" 
                          />
                        </div>
                        <div className="flex justify-between items-center text-lg font-black text-orange-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span>Remaining Balance</span>
                          <span>₹{remainingAmount}</span>
                        </div>
                      </>
                    )}
                  </div>

                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button type="submit" form="docForm" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
                {editingId ? 'Update' : 'Save'} Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Invoices;
