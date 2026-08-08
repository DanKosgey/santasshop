-- Create table for community links that can be managed by admins
create table community_links (
  id uuid default uuid_generate_v4() primary key,
  platform_name text not null,
  platform_key text not null unique, -- e.g., 'telegram', 'whatsapp', 'discord', 'tiktok', 'instagram'
  link_url text not null,
  description text,
  icon_color text, -- For UI display
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table community_links enable row level security;

-- Create policies for community links
create policy "Users can view active community links"
  on community_links for select
  using ( is_active = true );

create policy "Admins can manage community links"
  on community_links for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') )
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Create indexes for better performance
create index idx_community_links_active on community_links(is_active);
create index idx_community_links_sort_order on community_links(sort_order);
create index idx_community_links_platform_key on community_links(platform_key);

-- Insert default community links
insert into community_links (platform_name, platform_key, link_url, description, icon_color, sort_order) values
('Telegram', 'telegram', 'https://t.me/mbauni_protocol', 'Join our main Telegram community for signals and discussions', '#229ED9', 1),
('WhatsApp', 'whatsapp', 'https://chat.whatsapp.com/mbauni_protocol', 'Connect with fellow traders on WhatsApp', '#25D366', 2),
('TikTok', 'tiktok', 'https://tiktok.com/@mbauni_protocol', 'Follow us on TikTok for quick trading tips', '#000000', 3),
('Instagram', 'instagram', 'https://instagram.com/mbauni_protocol', 'Follow us on Instagram for behind the scenes content', '#E1306C', 4);

-- Function to get all community links for a user based on their subscription tier
create or replace function get_community_links_for_user(user_tier text)
returns table(
    platform_name text,
    platform_key text,
    link_url text,
    description text,
    icon_color text,
    is_active boolean,
    sort_order integer
) as $$
begin
    return query
    select 
        cl.platform_name,
        cl.platform_key,
        cl.link_url,
        cl.description,
        cl.icon_color,
        cl.is_active,
        cl.sort_order
    from community_links cl
    where cl.is_active = true
    order by cl.sort_order;
end;
$$ language plpgsql;

-- Add a column to track user's last selected community platform
alter table profiles add column if not exists last_community_platform text;