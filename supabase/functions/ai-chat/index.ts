import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  siteContext?: string;
}

interface TicketRequest {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  userId?: string;
}

interface OrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  userId?: string;
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WEBSITE_CONTEXT = `
You are an AI customer service agent for an online electronics and fashion store based in Kenya that sells:

PRODUCTS & SERVICES:
- Electronics: Laptops, computers, smartphones, and tech accessories
- Fashion: Shoes and apparel items
- Current product categories: Laptops, Shoes
- All products are competitively priced and available for online purchase

BUSINESS INFO:
- Physical Store Location: Thika Town, Kenya (customers can visit our physical store)
- Online Store: https://kaffaonline.store
- Hours: Monday to Saturday, 9 AM to 6 PM (both physical and online support)
- Phone: 0743049549
- Email: Masterkaffa762@gmail.com
- WhatsApp: 0743049549 (available for quick inquiries)
- Website features: Products catalog, flash sales, vouchers, user accounts, cart system, admin panel

PRICING & PAYMENT:
- Competitive pricing across all product categories
- Payment methods: M-Pesa, bank transfers, cash payments (online and in-store)
- Regular flash sales and promotional offers available on https://kaffaonline.store
- Voucher system for discounts on orders

DELIVERY & SHOPPING OPTIONS:
- Online shopping: Visit https://kaffaonline.store for full catalog and online ordering
- Physical store visits: Come to our Thika Town location for in-person shopping
- Kenya-wide delivery available for online orders
- Delivery times vary by location
- Shipping fees calculated based on location and order size
- Express delivery options available for urgent orders

WARRANTIES & SUPPORT:
- Manufacturer warranties on electronic products
- Quality guarantee on all items
- Customer support via phone, email, WhatsApp, and live chat
- Full after-sales support and assistance
- In-store technical support available at our Thika Town location

STOCK & PRODUCT QUERIES:
- For current stock availability and detailed product information, customers should visit https://kaffaonline.store
- The website has the most up-to-date inventory and product specifications
- Customers can browse categories (laptops, shoes), compare products, and check real-time availability
- Flash sales section for special deals and limited-time offers
- User accounts for order tracking and purchase history
- Customers can also visit our physical store in Thika Town to see products in person

SPECIAL FEATURES:
- Flash sales with significant discounts on selected items available on https://kaffaonline.store
- Voucher system for additional savings
- Mobile-responsive website for easy shopping
- Secure checkout process
- Admin panel for efficient order management
- Both online and in-store shopping options available

IMPORTANT INSTRUCTIONS:
- ALWAYS use the exact website URL: https://kaffaonline.store (never use placeholders or generic text)
- NEVER say "Insert Website Address Here" or similar placeholder text
- The physical store is located in Thika Town, Kenya
- For directions and exact address, customers should visit https://kaffaonline.store
- All website references must use https://kaffaonline.store

Act as a helpful, knowledgeable customer service representative for THIS specific store. We have both an online presence at https://kaffaonline.store and a physical store location in Thika Town, Kenya. When customers ask about stock or specific product availability, direct them to check https://kaffaonline.store for the most current information or visit our physical store in Thika Town. For urgent matters, they can reach us on WhatsApp at 0743049549. If customers need human assistance, inform them you can create a support ticket for them.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    if (action === 'chat') {
      return await handleChat(data as ChatRequest);
    } else if (action === 'create_ticket') {
      return await handleCreateTicket(data as TicketRequest);
    } else if (action === 'create_order') {
      return await handleCreateOrder(data as OrderRequest);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleChat(data: ChatRequest): Promise<Response> {
  const { message, conversationHistory = [] } = data;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch current products from database
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, price, category, in_stock, is_featured, rating, stock')
      .eq('in_stock', true)
      .order('rating', { ascending: false });

    let productContext = '';
    if (!productsError && products && products.length > 0) {
      productContext = `\n\nCURRENT AVAILABLE PRODUCTS:\n${products.map(product => 
        `- ${product.name} (${product.category}) - $${product.price} - Stock: ${product.stock} - Rating: ${product.rating}/5${product.is_featured ? ' (Featured)' : ''}\n  Description: ${product.description}`
      ).join('\n')}\n\nWhen customers ask about products, recommend the best options based on their needs, budget, and our current inventory. Highlight featured products and those with high ratings. Mention specific product names, prices, and key features.`;
    }

    // Build conversation context with dynamic product data
    const contextWithProducts = `${WEBSITE_CONTEXT}${productContext}`;
    
    const messages = [
      { role: 'user', parts: [{ text: contextWithProducts }] },
      { role: 'model', parts: [{ text: 'I understand. I am now ready to assist customers with their inquiries about our electronics and fashion store, and I have access to our current product inventory to make personalized recommendations.' }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                     'I apologize, but I encountered an issue processing your request. Please try again or contact our support team.';

    // Check if the response suggests creating a support ticket or order
    const needsHumanSupport = aiResponse.toLowerCase().includes('support ticket') || 
                             aiResponse.toLowerCase().includes('human assistance') ||
                             aiResponse.toLowerCase().includes('speak to someone');

    const needsOrderCreation = aiResponse.toLowerCase().includes('place order') || 
                              aiResponse.toLowerCase().includes('create order') ||
                              aiResponse.toLowerCase().includes('buy now') ||
                              aiResponse.toLowerCase().includes('purchase');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      needsHumanSupport,
      needsOrderCreation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return new Response(JSON.stringify({ 
      response: 'I apologize, but I\'m experiencing technical difficulties. Please contact our support team at Masterkaffa762@gmail.com or call 0743049549 for immediate assistance.',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleCreateTicket(data: TicketRequest): Promise<Response> {
  const { customerName, customerEmail, subject, message, userId } = data;

  try {
    // Create support ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId || null,
        customer_name: customerName,
        customer_email: customerEmail,
        subject: subject,
        initial_message: message,
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single();

    if (ticketError) {
      throw ticketError;
    }

    // Create initial message
    const { error: messageError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: userId || null,
        sender_name: customerName,
        sender_email: customerEmail,
        message: message,
        is_internal: false
      });

    if (messageError) {
      throw messageError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ticketId: ticket.id,
      message: 'Support ticket created successfully. Our team will respond within 24 hours.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create support ticket',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleCreateOrder(data: OrderRequest): Promise<Response> {
  const { customerName, customerEmail, customerPhone, shippingAddress, items, paymentMethod, userId } = data;

  try {
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    // Update product stock
    for (const item of items) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ 
          stock: 'stock - ' + item.quantity 
        })
        .eq('id', item.productId);

      if (stockError) {
        console.error('Error updating stock for product:', item.productId, stockError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      totalAmount: totalAmount,
      message: `Order created successfully! Order ID: ${order.id}. Total: $${totalAmount}. You will receive confirmation details via email.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create order',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
