create or replace function public.notify_sms_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  admin_rec record;
  guest_name text;
  req_body jsonb;
  url text;
  headers jsonb;
  sms_url text := 'https://cqeqfiuswdvpokgznwpk.supabase.co/functions/v1/send-sms';
  sms_token text := 'secret_cassone_sms_token_2026';
  edit_link text;
  primary_admin text := '';
  req_headers text;
  origin text := 'https://casa-cassone.vercel.app';
begin
  req_headers := current_setting('request.headers', true);
  if req_headers is not null and req_headers != '' then
    begin
      origin := (req_headers::jsonb)->>'origin';
      if origin is null or origin = '' then
        origin := 'https://casa-cassone.vercel.app';
      end if;
    exception when others then
      origin := 'https://casa-cassone.vercel.app';
    end;
  end if;

  select phone into primary_admin from public.admins where is_primary = true limit 1;
  if primary_admin is null then
    primary_admin := '+4917642055531';
  end if;

  if TG_OP = 'INSERT' then
    guest_name := NEW.name;
    edit_link := origin || '?edit=' || NEW.id;

    for admin_rec in select phone from public.admins where receive_sms = true loop
      begin
        req_body := jsonb_build_object(
          'to', admin_rec.phone,
          'body', 'Neue Buchung von ' || guest_name || '! Bitte auf der Website genehmigen oder ablehnen.'
        );
        url := sms_url;
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token);
        perform net.http_post(url, req_body, headers, '1000');
      exception when others then
        raise warning 'SMS failed for admin %: %', admin_rec.phone, SQLERRM;
      end;
    end loop;

    if NEW.phone is not null and NEW.phone != '' then
      begin
        req_body := jsonb_build_object(
          'to', NEW.phone,
          'body', 'Ciao ' || guest_name || '! Deine Anfrage für das Casa Cassone Aperta ist eingegangen. Du erhältst eine SMS, sobald sie genehmigt wurde. Deinen Eintrag kannst du hier bearbeiten: ' || edit_link || ' (Bei Fragen: ' || primary_admin || ')'
        );
        url := sms_url;
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token);
        perform net.http_post(url, req_body, headers, '1000');
      exception when others then
        raise warning 'SMS failed for guest: %', SQLERRM;
      end;
    end if;

  elsif TG_OP = 'UPDATE' and OLD.status = 'Ausstehend' and NEW.status != 'Ausstehend' then
    guest_name := NEW.name;
    edit_link := origin || '?edit=' || NEW.id;

    if NEW.phone is not null and NEW.phone != '' then
      begin
        if NEW.status = 'Genehmigt' then
          req_body := jsonb_build_object(
            'to', NEW.phone,
            'body', 'Fantastico ' || guest_name || '! Deine Buchung für das Casa Cassone Aperta wurde genehmigt ✅. Wir freuen uns auf dich! Bearbeiten: ' || edit_link || ' (Fragen: ' || primary_admin || ')'
          );
        else
          req_body := jsonb_build_object(
            'to', NEW.phone,
            'body', 'Ciao ' || guest_name || ', deine Buchung für das Casa Cassone Aperta wurde leider abgelehnt ❌. Bitte melde dich bei uns für Details. (Kontakt: ' || primary_admin || ')'
          );
        end if;
        url := sms_url;
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token);
        perform net.http_post(url, req_body, headers, '1000');
      exception when others then
        raise warning 'SMS failed for guest: %', SQLERRM;
      end;
    end if;
  end if;

  return NEW;
end;
$$;
