import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const receiptFile = formData.get('receipt') as File;

    if (!receiptFile) {
      return new Response(
        JSON.stringify({ error: 'No receipt file provided' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const categories = [
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

    const mockAmount = Math.floor(Math.random() * 100) + 10;
    const mockCategory = categories[Math.floor(Math.random() * categories.length)];
    const mockMerchant = ['Starbucks', 'Walmart', 'Target', 'Amazon', 'Shell Gas'][Math.floor(Math.random() * 5)];

    const result = {
      amount: mockAmount,
      category: mockCategory,
      merchant: mockMerchant,
      description: `Receipt from ${mockMerchant}`,
      extracted: true
    };

    return new Response(
      JSON.stringify(result),
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
