alter table public.body_measurements
  add column if not exists forearm_cm numeric(5,1) check (forearm_cm > 0),
  add column if not exists hip_cm numeric(5,1) check (hip_cm > 0),
  add column if not exists thigh_cm numeric(5,1) check (thigh_cm > 0),
  add column if not exists calf_cm numeric(5,1) check (calf_cm > 0),
  add column if not exists body_fat_percent numeric(4,1) check (body_fat_percent >= 0 and body_fat_percent <= 100),
  add column if not exists custom_measurements jsonb not null default '{}'::jsonb;
