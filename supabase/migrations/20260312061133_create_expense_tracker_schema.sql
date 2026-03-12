/*
  # Expense Tracker Database Schema
  
  This migration creates the complete database schema for the AI-powered expense tracker application.
  
  ## New Tables
  
  ### 1. profiles
  Extended user profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. expenses
  Tracks all user expenses with categorization
  - `id` (uuid, primary key) - Unique expense identifier
  - `user_id` (uuid) - References profiles table
  - `amount` (decimal) - Expense amount
  - `category` (text) - Expense category (Food, Transport, Entertainment, etc.)
  - `description` (text) - Expense description
  - `date` (date) - Expense date
  - `receipt_url` (text, optional) - URL to uploaded receipt image
  - `is_recurring` (boolean) - Whether this is a detected recurring expense
  - `merchant_name` (text, optional) - Merchant/vendor name
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 3. financial_goals
  User-defined financial goals and targets
  - `id` (uuid, primary key) - Unique goal identifier
  - `user_id` (uuid) - References profiles table
  - `goal_name` (text) - Name of the goal
  - `target_amount` (decimal) - Target amount to achieve
  - `current_savings` (decimal) - Current progress towards goal
  - `deadline` (date, optional) - Target completion date
  - `status` (text) - Goal status (active, completed, abandoned)
  - `created_at` (timestamptz) - Goal creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 4. subscriptions
  Detected recurring subscriptions
  - `id` (uuid, primary key) - Unique subscription identifier
  - `user_id` (uuid) - References profiles table
  - `merchant_name` (text) - Subscription service name
  - `amount` (decimal) - Subscription cost
  - `frequency` (text) - Payment frequency (monthly, yearly, etc.)
  - `next_billing_date` (date, optional) - Expected next charge date
  - `status` (text) - Subscription status (active, cancelled)
  - `first_detected` (timestamptz) - When subscription was first detected
  - `last_charged` (timestamptz) - Last charge date
  
  ### 5. ai_insights
  AI-generated financial insights and suggestions
  - `id` (uuid, primary key) - Unique insight identifier
  - `user_id` (uuid) - References profiles table
  - `insight_type` (text) - Type of insight (spending_pattern, saving_suggestion, alert)
  - `title` (text) - Insight title
  - `description` (text) - Detailed insight description
  - `data` (jsonb) - Additional structured data
  - `is_read` (boolean) - Whether user has seen this insight
  - `created_at` (timestamptz) - Insight generation timestamp
  
  ## Security
  
  All tables have Row Level Security (RLS) enabled with policies that ensure:
  - Users can only access their own data
  - All operations require authentication
  - Data isolation between users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  category text NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  is_recurring boolean DEFAULT false,
  merchant_name text,
  created_at timestamptz DEFAULT now()
);

-- Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_name text NOT NULL,
  target_amount decimal(10,2) NOT NULL,
  current_savings decimal(10,2) DEFAULT 0,
  deadline date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  next_billing_date date,
  status text DEFAULT 'active',
  first_detected timestamptz DEFAULT now(),
  last_charged timestamptz DEFAULT now()
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON ai_insights(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Expenses policies
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Financial goals policies
CREATE POLICY "Users can view own goals"
  ON financial_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON financial_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON financial_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON financial_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI insights policies
CREATE POLICY "Users can view own insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON ai_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON ai_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();