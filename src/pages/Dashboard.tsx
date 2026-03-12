import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar
} from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  merchant_name: string;
}

interface Subscription {
  merchant_name: string;
  amount: number;
  frequency: string;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    subscriptionCost: 0,
    avgDailySpending: 0
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (subsError) throw subsError;

      setExpenses(expensesData || []);
      setSubscriptions(subsData || []);

      calculateStats(expensesData || [], subsData || []);
      processCategoryData(expensesData || []);
      processMonthlyData(expensesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expensesData: Expense[], subsData: Subscription[]) => {
    const total = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const subscriptionTotal = subsData.reduce((sum, sub) => sum + Number(sub.amount), 0);
    const avgDaily = expensesData.length > 0 ? total / 30 : 0;

    setStats({
      totalExpenses: total,
      monthlyExpenses: total,
      subscriptionCost: subscriptionTotal,
      avgDailySpending: avgDaily
    });
  };

  const processCategoryData = (expensesData: Expense[]) => {
    const categoryMap = new Map<string, number>();

    expensesData.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + Number(expense.amount));
    });

    const data = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    setCategoryData(data);
  };

  const processMonthlyData = (expensesData: Expense[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyMap = new Map<string, number>();
    last7Days.forEach(date => dailyMap.set(date, 0));

    expensesData.forEach(expense => {
      if (dailyMap.has(expense.date)) {
        dailyMap.set(expense.date, dailyMap.get(expense.date)! + Number(expense.amount));
      }
    });

    const data = Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: Math.round(amount)
    }));

    setMonthlyData(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-600 mt-1">Your financial overview for the last 30 days</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.totalExpenses.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.subscriptionCost.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.avgDailySpending.toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {expenses.length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Spending by Category
          </h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expense data yet
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Last 7 Days Spending
          </h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expense data yet
            </div>
          )}
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Subscriptions
          </h2>
          <div className="space-y-3">
            {subscriptions.map((sub, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sub.merchant_name}</p>
                    <p className="text-sm text-gray-600 capitalize">{sub.frequency}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${Number(sub.amount).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h2>
        {expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.slice(0, 10).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gray-200 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.description || expense.merchant_name || 'Expense'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {expense.category} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${Number(expense.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No expenses yet. Start tracking your spending!
          </div>
        )}
      </div>
    </div>
  );
}
