create or replace function public.save_admin_settings_admin(
  admin_password text,
  phone1 text,
  phone2 text,
  phone3 text,
  notify boolean
)
returns void
language plpgsql
security definer
as $$
begin
  if public.verify_admin(admin_password) then
    delete from public.admins where true;
    
    if phone1 is not null and phone1 <> '' then
      insert into public.admins (phone, is_primary, receive_sms) values (phone1, true, notify);
    end if;
    if phone2 is not null and phone2 <> '' then
      insert into public.admins (phone, is_primary, receive_sms) values (phone2, false, notify);
    end if;
    if phone3 is not null and phone3 <> '' then
      insert into public.admins (phone, is_primary, receive_sms) values (phone3, false, notify);
    end if;
  else
    raise exception 'Invalid admin password';
  end if;
end;
$$;
