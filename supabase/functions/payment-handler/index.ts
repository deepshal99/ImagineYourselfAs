import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate HMAC SHA256 signature using Web Crypto API
async function generateHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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
    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!KEY_ID || !KEY_SECRET) {
      throw new Error("Razorpay credentials not set");
    }

    const AUTH_HEADER = 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`);

    // 1. CREATE ORDER
    if (action === 'create_order') {
      const orderId = `order_${user.id.split('-')[0]}_${Date.now()}`;

      const requestBody = {
        amount: 4900, // Amount in paise (₹49 = 4900 paise)
        currency: 'INR',
        receipt: orderId,
        notes: {
          user_id: user.id,
          credits: 5,
          description: '5 Credits for PosterMe'
        }
      };

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Razorpay Create Order Error:", data);
        throw new Error(data.error?.description || "Failed to create Razorpay order");
      }

      return new Response(JSON.stringify({
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
        key_id: KEY_ID
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. VERIFY PAYMENT
    if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error("Missing payment verification parameters");
      }

      // Verify signature using HMAC SHA256
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = await generateHmacSha256(KEY_SECRET, body);

      if (expectedSignature !== razorpay_signature) {
        console.error("Signature mismatch:", { expected: expectedSignature, received: razorpay_signature });
        return new Response(JSON.stringify({
          success: false,
          message: "Payment verification failed - invalid signature"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      // Signature verified! Add credits
      // Fetch current credits
      const { data: currentCredits, error: _fetchError } = await supabaseClient
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();

      const newCredits = (currentCredits?.credits || 0) + 5;

      console.log(`Payment verified. Updating credits for ${user.email} from ${currentCredits?.credits || 0} to ${newCredits}`);

      // Use UPSERT to handle both existing and new users
      const { error } = await supabaseClient
        .from('user_credits')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          credits: newCredits
        }, { onConflict: 'user_id' });

      if (error) {
        console.error("Failed to update credits:", error);
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        new_credits: newCredits,
        payment_id: razorpay_payment_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
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
