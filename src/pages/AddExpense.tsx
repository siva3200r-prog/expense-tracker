import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Upload,
  Camera,
  Loader
} from 'lucide-react';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Other'
];

export default function AddExpense() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'receipt'>('manual');
  const [receiptProcessing, setReceiptProcessing] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    category: CATEGORIES[0],
    description: '',
    date: new Date().toISOString().split('T')[0],
    merchantName: ''
  });

  const [receiptPreview, setReceiptPreview] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: user!.id,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        merchant_name: formData.merchantName || null
      });

      if (error) throw error;

      setFormData({
        amount: '',
        category: CATEGORIES[0],
        description: '',
        date: new Date().toISOString().split('T')[0],
        merchantName: ''
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setReceiptProcessing(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('receipt', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-receipt`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY}`,
          },
          body: formDataToSend,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.amount) {
          setFormData(prev => ({
            ...prev,
            amount: result.amount.toString(),
            category: result.category || prev.category,
            merchantName: result.merchant || '',
            description: result.description || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
    } finally {
      setReceiptProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Expense</h1>
        <p className="text-gray-600 mt-1">Track your spending manually or scan a receipt</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setUploadMode('manual')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              uploadMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            Manual Entry
          </button>
          <button
            onClick={() => setUploadMode('receipt')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              uploadMode === 'receipt'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-5 h-5" />
            Scan Receipt
          </button>
        </div>

        {uploadMode === 'receipt' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Receipt
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload" className="cursor-pointer">
                {receiptPreview ? (
                  <div className="space-y-4">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    {receiptProcessing && (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing receipt...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="merchantName" className="block text-sm font-medium text-gray-700 mb-1">
              Merchant Name (Optional)
            </label>
            <input
              id="merchantName"
              type="text"
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Starbucks, Amazon"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes about this expense..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Expense...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
