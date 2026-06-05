import React, { useState, useEffect } from 'react';
import { useSettings } from '../services/SettingsContext';
import apiClient, { getAssetUrl } from '../services/api';
import { Camera, Save } from 'lucide-react';

const Settings = () => {
  const { settings, fetchSettings, loading } = useSettings();
  const [formData, setFormData] = useState({
    studioName: '',
    ownerName: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    address: '',
    gstNumber: '',
    websiteUrl: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (settings) {
      setFormData({
        studioName: settings.studioName || '',
        ownerName: settings.ownerName || '',
        mobileNumber: settings.mobileNumber || '',
        whatsappNumber: settings.whatsappNumber || '',
        email: settings.email || '',
        address: settings.address || '',
        gstNumber: settings.gstNumber || '',
        websiteUrl: settings.websiteUrl || ''
      });
      if (settings.companyLogo) {
        setLogoPreview(getAssetUrl(settings.companyLogo));
      }
    }
  }, [settings]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (logoFile) {
        data.append('companyLogo', logoFile);
      }

      await apiClient.post('/settings', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      await fetchSettings(); // Refresh global context
      setMessage({ text: 'Settings saved successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Loading Settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Company Settings</h1>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* LOGO UPLOAD */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start w-full">
            <div className="flex-shrink-0 flex flex-col items-center md:items-start">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center md:text-left">Company Logo</label>
              <div className="relative group cursor-pointer w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center overflow-hidden hover:border-teal-500 transition-colors">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-medium">Upload Logo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                  <span className="text-white text-xs font-bold px-3 py-1 bg-teal-500 rounded-full">Change</span>
                </div>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center w-40">Horizontal logo recommended</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Studio Name</label>
                <input type="text" name="studioName" value={formData.studioName} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Vivid Productions" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Owner Name</label>
                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
                <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="+91 9876543210" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">WhatsApp Number</label>
                <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="For WhatsApp Integration" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="hello@studio.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">GST Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Company Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} required rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Full Office Address"></textarea>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Website URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://www.yourstudio.com" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
