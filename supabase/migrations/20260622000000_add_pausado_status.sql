-- Add "pausado" status to car_statuses catalog
insert into public.car_statuses (name, label, sort_order) values
  ('pausado', 'Pausado', 5)
on conflict (name) do nothing;
