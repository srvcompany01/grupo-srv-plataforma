-- E-mail no perfil (a equipe vê o e-mail dos colegas; o app não lê auth.users).

alter table public.profiles add column email text;

update public.profiles p set email = lower(u.email) from auth.users u where u.id = p.id;

create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name, email, role, active)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), lower(new.email), 'cliente', false);
  return new;
end $$;

create function public.copiar_email_perfil() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update profiles set email = lower(new.email) where id = new.id;
  return null;
end $$;

create trigger copiar_email_perfil after update of email on auth.users
for each row when (new.email is distinct from old.email)
execute function public.copiar_email_perfil();

create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and auth.uid() is not null and not is_admin() then
    raise exception 'Somente administradores alteram papel ou status';
  end if;
  -- E-mail só muda pelo login (gatilho em auth.users roda sem usuário logado).
  if auth.uid() is not null then
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;
