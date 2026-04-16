alter table public.products
add column if not exists image_urls text[];

update public.products
set image_urls = case
  when image_url is null or btrim(image_url) = '' then null
  else array[image_url]
end
where image_urls is null;
