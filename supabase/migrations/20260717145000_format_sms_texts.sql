CREATE OR REPLACE FUNCTION public.notify_sms_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
      if (req_headers::jsonb)->>'origin' like '%localhost%' then
        origin := 'http://localhost:5173';
      else
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
          'body', 'Neue Anfrage: ' || guest_name || ' 🏖️' || E'\n\n' || 'Bitte auf der Website prüfen.'
        );
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token);
        perform net.http_post(
          url := sms_url, 
          body := req_body, 
          headers := headers, 
          timeout_milliseconds := 1000
        );
      exception when others then
        raise warning 'SMS failed for admin %: %', admin_rec.phone, SQLERRM;
      end;
    end loop;

    if NEW.phone is not null and NEW.phone != '' then
      begin
        req_body := jsonb_build_object(
          'to', NEW.phone,
          'body', 'Ciao ' || guest_name || ' 🌴' || E'\n\n' || 'Deine Anfrage fürs Casa Cassone ist da!' || E'\n\n' || 'Du erhältst eine SMS, sobald sie genehmigt wird.' || E'\n\n' || 'Bearbeiten: ' || edit_link
        );
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token);
        perform net.http_post(
          url := sms_url, 
          body := req_body, 
          headers := headers, 
          timeout_milliseconds := 1000
        );
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
            'body', 'Fantastico ' || guest_name || ' ✅' || E'\n\n' || 'Deine Buchung fürs Casa Cassone ist bestätigt! Wir freuen uns auf dich.' || E'\n\n' || 'Bearbeiten: ' || edit_link
          );
        else
          req_body := jsonb_build_object(
            'to', NEW.phone,
            'body', 'Ciao ' || guest_name || ' ❌' || E'\n\n' || 'Deine Buchung fürs Casa Cassone wurde leider abgelehnt.' || E'\n\n' || 'Bei Fragen: ' || primary_admin
          );
        end if;
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token);
        perform net.http_post(
          url := sms_url, 
          body := req_body, 
          headers := headers, 
          timeout_milliseconds := 1000
        );
      exception when others then
        raise warning 'SMS failed for guest: %', SQLERRM;
      end;
    end if;
  end if;

  return NEW;
end;
$function$;
