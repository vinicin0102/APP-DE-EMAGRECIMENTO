-- Cria o bucket 'posts-images' se não existir
insert into storage.buckets (id, name, public)
values ('posts-images', 'posts-images', true)
on conflict (id) do nothing;

-- Política de acesso para SELECT (público)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'posts-images' );

-- Política de acesso para INSERT (usuários autenticados)
create policy "Authenticated Users Insert"
  on storage.objects for insert
  with check ( bucket_id = 'posts-images' and auth.role() = 'authenticated' );

-- Política de acesso para UPDATE (apenas o dono)
create policy "User Update Own Images"
  on storage.objects for update
  using ( bucket_id = 'posts-images' and auth.uid() = owner );

-- Política de acesso para DELETE (apenas o dono)
create policy "User Delete Own Images"
  on storage.objects for delete
  using ( bucket_id = 'posts-images' and auth.uid() = owner );
