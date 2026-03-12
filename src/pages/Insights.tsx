import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export default function Insights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: user!.id }),
        }
      );

      if (response.ok) {
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGenerating(false);
    }
  };

  const markAsRead = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId);

      if (error) throw error;

      setInsights(insights.map(insight =>
        insight.id === insightId ? { ...insight, is_read: true } : insight
      ));
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending_pattern':
        return <TrendingUp className="w-6 h-6 text-blue-600" />;
      case 'saving_suggestion':
        return <Lightbulb className="w-6 h-6 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      default:
        return <Sparkles className="w-6 h-6 text-purple-600" />;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'spending_pattern':
        return 'bg-blue-50 border-blue-200';
      case 'saving_suggestion':
        return 'bg-green-50 border-green-200';
      case 'alert':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Financial Insights</h1>
          <p className="text-gray-600 mt-1">
            Personalized recommendations based on your spending patterns
          </p>
        </div>
        <button
          onClick={generateInsights}
          disabled={generating}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate New Insights'}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Insights Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add some expenses and generate AI-powered insights about your spending habits
          </p>
          <button
            onClick={generateInsights}
            disabled={generating}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Generate Insights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-xl p-6 border-2 transition-all ${
                insight.is_read
                  ? 'bg-white border-gray-200'
                  : getInsightBgColor(insight.insight_type)
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  insight.is_read ? 'bg-gray-100' : 'bg-white'
                }`}>
                  {getInsightIcon(insight.insight_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {insight.title}
                    </h3>
                    {!insight.is_read && (
                      <button
                        onClick={() => markAsRead(insight.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{insight.description}</p>

                  {insight.data && Object.keys(insight.data).length > 0 && (
                    <div className="bg-white rounded-lg p-4 mt-3 border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(insight.data).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-sm text-gray-600 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {typeof value === 'number' && key.includes('amount')
                                ? `$${value.toFixed(2)}`
                                : value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-500">
                      {new Date(insight.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {insight.is_read && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3" />
                        Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
