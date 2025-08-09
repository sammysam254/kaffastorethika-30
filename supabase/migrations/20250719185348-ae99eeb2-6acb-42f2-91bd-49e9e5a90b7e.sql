-- Create voucher_usage table to track voucher usage
CREATE TABLE public.voucher_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voucher_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all voucher usage" 
ON public.voucher_usage 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own voucher usage" 
ON public.voucher_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own voucher usage" 
ON public.voucher_usage 
FOR SELECT 
USING (auth.uid() = user_id);