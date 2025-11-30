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
    const API_KEY = Deno.env.get('INSTAMOJO_API_KEY');
    const AUTH_TOKEN = Deno.env.get('INSTAMOJO_AUTH_TOKEN');
    // Use 'https://test.instamojo.com/api/1.1/' for sandbox
    const INSTAMOJO_URL = Deno.env.get('INSTAMOJO_URL') || 'https://www.instamojo.com/api/1.1/';

    if (!API_KEY || !AUTH_TOKEN) {
        throw new Error("Instamojo credentials not set");
    }

    // 1. CREATE ORDER (PAYMENT REQUEST)
    if (action === 'create_order') {
      const { redirectUrl } = payload;
      
      const params = new URLSearchParams();
      params.append('amount', '49'); // INR 49
      params.append('purpose', '5 Credits for PosterMe');
      params.append('buyer_name', user.email || 'User');
      params.append('email', user.email || 'user@example.com');
      params.append('redirect_url', redirectUrl);
      params.append('allow_repeated_payments', 'False');
      params.append('send_email', 'False');
      params.append('send_sms', 'False');

      const response = await fetch(`${INSTAMOJO_URL}payment-requests/`, {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'X-Auth-Token': AUTH_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();

      if (!data.success) {
         console.error("Instamojo Error:", data);
         // Include full details for debugging
         const errorMsg = data.message 
            ? `Instamojo: ${data.message}` 
            : `Instamojo Failed: ${JSON.stringify(data)}`;
         throw new Error(errorMsg);
      }

      return new Response(JSON.stringify({ 
          url: data.payment_request.longurl,
          payment_request_id: data.payment_request.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. VERIFY PAYMENT
    if (action === 'verify_payment') {
      const { payment_id, payment_request_id } = payload;

      // Get Payment Request Details
      const response = await fetch(`${INSTAMOJO_URL}payment-requests/${payment_request_id}/${payment_id}/`, {
        method: 'GET',
        headers: {
          'X-Api-Key': API_KEY,
          'X-Auth-Token': AUTH_TOKEN
        }
      });

      const data = await response.json();

      if (data.success && data.payment_request.status === 'Completed') {
          
          // ADD CREDITS
          const { data: currentCredits } = await supabaseClient
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();
      
          const newCredits = (currentCredits?.credits || 0) + 5;
          
          const { error } = await supabaseClient
            .from('user_credits')
            .update({ credits: newCredits })
            .eq('user_id', user.id);
            
          if (error) throw error;

          return new Response(JSON.stringify({ success: true, new_credits: newCredits }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
      } else {
          return new Response(JSON.stringify({ 
              success: false, 
              message: data.message || `Payment status: ${data.payment_request?.status || 'Unknown'}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          });
      }
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error("Payment Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
