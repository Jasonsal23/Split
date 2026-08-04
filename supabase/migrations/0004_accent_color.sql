-- A personal accent color, used only on the athlete's own Profile page.
alter table profiles add column if not exists accent_color text;
