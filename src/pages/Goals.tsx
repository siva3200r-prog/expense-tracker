import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  Trash2
} from 'lucide-react';

interface Goal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_savings: number;
  deadline: string | null;
  status: string;
  created_at: string;
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: '',
    currentSavings: '',
    deadline: ''
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('financial_goals').insert({
        user_id: user!.id,
        goal_name: formData.goalName,
        target_amount: parseFloat(formData.targetAmount),
        current_savings: formData.currentSavings ? parseFloat(formData.currentSavings) : 0,
        deadline: formData.deadline || null,
        status: 'active'
      });

      if (error) throw error;

      setFormData({
        goalName: '',
        targetAmount: '',
        currentSavings: '',
        deadline: ''
      });
      setShowAddModal(false);
      await fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal');
    }
  };

  const updateGoalSavings = async (goalId: string, newSavings: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const isCompleted = newSavings >= goal.target_amount;

      const { error } = await supabase
        .from('financial_goals')
        .update({
          current_savings: newSavings,
          status: isCompleted ? 'completed' : 'active'
        })
        .eq('id', goalId);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600 mt-1">
            Set and track your savings goals
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Goals Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start planning your financial future by setting your first goal
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_savings, goal.target_amount);
            const remaining = goal.target_amount - goal.current_savings;
            const isCompleted = goal.status === 'completed';

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                  isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${
                      isCompleted ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Target className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {goal.goal_name}
                      </h3>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(goal.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Current Savings</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${goal.current_savings.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Target Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${goal.target_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {!isCompleted && (
                    <>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-600 mb-1">Remaining</p>
                        <p className="text-xl font-bold text-blue-900">
                          ${remaining.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Add savings"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              const amount = parseFloat(input.value);
                              if (amount > 0) {
                                updateGoalSavings(goal.id, goal.current_savings + amount);
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            const amount = parseFloat(input.value);
                            if (amount > 0) {
                              updateGoalSavings(goal.id, goal.current_savings + amount);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </>
                  )}

                  {isCompleted && (
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <p className="text-green-800 font-semibold">
                        Goal Completed!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={formData.goalName}
                  onChange={(e) => setFormData({ ...formData, goalName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Buy a laptop"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Savings (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentSavings}
                  onChange={(e) => setFormData({ ...formData, currentSavings: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
