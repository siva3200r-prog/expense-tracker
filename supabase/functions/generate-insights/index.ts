import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  merchant_name: string | null;
  is_recurring: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { user_id } = await req.json();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: expenses, error: expensesError } = await supabaseClient
      .from('expenses')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (expensesError) throw expensesError;

    const insights = await generateInsights(expenses as Expense[], user_id, supabaseClient);

    for (const insight of insights) {
      await supabaseClient
        .from('ai_insights')
        .insert({
          user_id: user_id,
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          data: insight.data,
        });
    }

    await detectSubscriptions(expenses as Expense[], user_id, supabaseClient);

    return new Response(
      JSON.stringify({ success: true, insights_count: insights.length }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function generateInsights(expenses: Expense[], userId: string, supabaseClient: any) {
  const insights = [];

  const categoryTotals = new Map<string, number>();
  let totalSpending = 0;

  expenses.forEach(expense => {
    const amount = Number(expense.amount);
    totalSpending += amount;
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + amount
    );
  });

  const sortedCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0) {
    const topCategory = sortedCategories[0];
    const percentage = (topCategory[1] / totalSpending * 100).toFixed(0);

    insights.push({
      type: 'spending_pattern',
      title: `${topCategory[0]} is your top expense category`,
      description: `You spent $${topCategory[1].toFixed(2)} on ${topCategory[0]} this month, which is ${percentage}% of your total spending.`,
      data: {
        category: topCategory[0],
        amount: topCategory[1],
        percentage: Number(percentage)
      }
    });
  }

  if (sortedCategories.length > 0) {
    const highestCategory = sortedCategories[0];
    const potentialSavings = highestCategory[1] * 0.2;

    insights.push({
      type: 'saving_suggestion',
      title: 'Reduce spending to save more',
      description: `By reducing your ${highestCategory[0]} expenses by 20%, you could save $${potentialSavings.toFixed(2)} per month, which equals $${(potentialSavings * 12).toFixed(2)} per year.`,
      data: {
        category: highestCategory[0],
        current_spending: highestCategory[1],
        potential_savings: potentialSavings,
        yearly_savings: potentialSavings * 12
      }
    });
  }

  const avgDailySpending = totalSpending / 30;
  const weeklyBudget = avgDailySpending * 7;

  if (avgDailySpending > 50) {
    insights.push({
      type: 'alert',
      title: 'High daily spending detected',
      description: `Your average daily spending is $${avgDailySpending.toFixed(2)}. Consider setting a weekly budget of $${weeklyBudget.toFixed(2)} to better control your expenses.`,
      data: {
        daily_average: avgDailySpending,
        suggested_weekly_budget: weeklyBudget
      }
    });
  }

  return insights;
}

async function detectSubscriptions(expenses: Expense[], userId: string, supabaseClient: any) {
  const merchantExpenses = new Map<string, Expense[]>();

  expenses.forEach(expense => {
    if (expense.merchant_name) {
      const merchant = expense.merchant_name.toLowerCase();
      if (!merchantExpenses.has(merchant)) {
        merchantExpenses.set(merchant, []);
      }
      merchantExpenses.get(merchant)!.push(expense);
    }
  });

  for (const [merchant, merchantExp] of merchantExpenses.entries()) {
    if (merchantExp.length >= 2) {
      const amounts = merchantExp.map(e => Number(e.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const amountVariance = Math.max(...amounts) - Math.min(...amounts);

      if (amountVariance < avgAmount * 0.1) {
        const { data: existing } = await supabaseClient
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('merchant_name', merchant)
          .maybeSingle();

        if (!existing) {
          await supabaseClient
            .from('subscriptions')
            .insert({
              user_id: userId,
              merchant_name: merchant,
              amount: avgAmount,
              frequency: 'monthly',
              status: 'active',
              last_charged: merchantExp[merchantExp.length - 1].date
            });
        }
      }
    }
  }
}
