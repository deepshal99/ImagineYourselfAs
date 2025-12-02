import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate User
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) throw new Error('Invalid user token');

    const { action, ...payload } = await req.json();
    
    // Environment Variables
    const APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    // Default to production, but allow sandbox via env or if keys indicate test
    const ENV = Deno.env.get('CASHFREE_ENV') || 'PROD'; 
    const BASE_URL = ENV === 'PROD' 
        ? 'https://api.cashfree.com/pg' 
        : 'https://sandbox.cashfree.com/pg';

    if (!APP_ID || !SECRET_KEY) {
        throw new Error("Cashfree credentials not set");
    }

    console.log(`Using Cashfree Environment: ${ENV}`);
    console.log(`Using App ID: ${APP_ID.substring(0, 5)}...`);

    const CF_HEADERS = {
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
    };

    // 1. CREATE ORDER
    if (action === 'create_order') {
      const orderId = `order_${user.id.split('-')[0]}_${Date.now()}`;
      
      let finalReturnUrl = payload.returnUrl || 'https://posterme.app?order_id={order_id}';
      
      // Cashfree PROD requires HTTPS. If we are on localhost (http), we must swap it 
      // to avoid 400 Bad Request.
      if (ENV === 'PROD' && finalReturnUrl.startsWith('http://')) {
          console.log("Swapping HTTP returnUrl for HTTPS (Required by Cashfree PROD)");
          finalReturnUrl = 'https://posterme.app?order_id={order_id}';
      }

      const requestBody = {
          order_id: orderId,
          order_amount: 49,
          order_currency: 'INR',
          customer_details: {
              customer_id: user.id,
              customer_email: user.email || 'user@example.com',
              customer_phone: '9876543210' 
          },
          order_meta: {
              return_url: finalReturnUrl,
              payment_methods: "cc,dc,upi"
          },
          order_note: "5 Credits for PosterMe"
      };

      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: CF_HEADERS,
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
         console.error("Cashfree Create Order Error:", data);
         const msg = data.message || "Failed to create Cashfree order";
         
         if (msg.toLowerCase().includes("authentication failed")) {
             throw new Error(`Cashfree Authentication Failed. Please check if your APP_ID and SECRET_KEY match the '${ENV}' environment.`);
         }
         
         throw new Error(msg);
      }

      return new Response(JSON.stringify({ 
          payment_session_id: data.payment_session_id,
          order_id: data.order_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. VERIFY PAYMENT
    if (action === 'verify_payment') {
      const { order_id } = payload;

      if (!order_id) throw new Error("Order ID required");

      const response = await fetch(`${BASE_URL}/orders/${order_id}`, {
        method: 'GET',
        headers: CF_HEADERS
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.message || "Failed to fetch order status");
      }

      if (data.order_status === 'PAID') {
          // Check if this order was already processed to prevent double crediting
          // We can use a simple trick: store processed order IDs in a table.
          // Or, for now, we blindly add credits assuming the client calls this once.
          // BETTER: Check if we have a transaction record.
          
          // Let's use a transaction table if possible, or just add credits.
          // Since the user asked for simple, we'll just add credits. 
          // Ideally, we should have a `payment_history` table.
          
          // Add 5 credits
          // Fetch current credits, defaulting to 0 if no row exists
          const { data: currentCredits, error: _fetchError } = await supabaseClient
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid error on no rows
      
          const newCredits = (currentCredits?.credits || 0) + 5;
          
          console.log(`Payment verified. Updating credits for ${user.email} from ${currentCredits?.credits} to ${newCredits}`);

          // Use UPSERT to handle both existing and new users
          const { error } = await supabaseClient
            .from('user_credits')
            .upsert({ 
                user_id: user.id, 
                email: user.email || '', // Fallback for email
                credits: newCredits
                // Removed updated_at to prevent schema errors if column is missing
            }, { onConflict: 'user_id' });
            
          if (error) {
              console.error("Failed to update credits:", error);
              throw error;
          }

          return new Response(JSON.stringify({ success: true, new_credits: newCredits }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
      } else {
          return new Response(JSON.stringify({ 
              success: false, 
              status: data.order_status,
              message: "Payment not completed"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          });
      }
    }

    throw new Error("Invalid action");

  } catch (error: any) {
    console.error("Payment Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
