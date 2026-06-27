-- Add INSERT policies for subscriptions and stripe_payments
create policy "Users can insert own subscriptions" 
on public.subscriptions 
for insert 
with check (auth.uid() = user_id);

create policy "Users can update own subscriptions" 
on public.subscriptions 
for update 
using (auth.uid() = user_id);

create policy "Users can insert own payments" 
on public.stripe_payments 
for insert 
with check (
    exists (
        select 1 from public.subscriptions s
        where s.id = stripe_payments.subscription_id and s.user_id = auth.uid()
    )
);
