# AI Powered Smart Expense Tracker

A comprehensive financial management application that helps users track expenses, analyze spending patterns, and achieve financial goals through AI-powered insights.

## Features

### Core Functionality
- **Expense Tracking** - Manual entry and receipt scanning for quick expense logging
- **Smart Receipt Scanner** - Upload receipt photos and automatically extract transaction details
- **Financial Dashboard** - Visual overview of spending with charts and statistics
- **Financial Goal Planner** - Set savings goals and track progress
- **AI Financial Insights** - Get personalized recommendations based on spending patterns
- **Subscription Detector** - Automatically identifies recurring payments
- **Smart Saving Suggestions** - AI-generated tips to reduce spending

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)
- **Charts**: Recharts
- **Edge Functions**: Deno-based serverless functions
- **Icons**: Lucide React

## Database Schema

The application uses the following main tables:
- `profiles` - User profile information
- `expenses` - Transaction records with categorization
- `financial_goals` - User-defined savings goals
- `subscriptions` - Detected recurring payments
- `ai_insights` - AI-generated financial recommendations

All tables implement Row Level Security for data isolation.

## Key Features Explained

### AI Financial Advisor
Analyzes spending patterns and generates personalized insights including:
- Top spending categories
- Potential savings opportunities
- Spending alerts and recommendations

### Smart Receipt Scanner
Edge function that processes uploaded receipt images and extracts:
- Transaction amount
- Merchant name
- Category classification
- Transaction description

### Subscription Detector
Automatically identifies recurring expenses by analyzing:
- Same merchant names
- Similar amounts
- Regular payment patterns

### Smart Saving Suggestions
AI-powered recommendations that calculate potential savings based on:
- Category-wise spending analysis
- Historical spending patterns
- Percentage-based reduction strategies

### Financial Goal Planner
Helps users:
- Set savings targets with deadlines
- Track progress visually
- Add incremental savings
- Complete goals and celebrate achievements

## Getting Started

The application is pre-configured with Supabase and ready to use.
