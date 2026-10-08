DO $$
DECLARE
  dry_run     boolean := true;   -- true = ensayo (no cambia nada). false SOLO el dia del lanzamiento.
  admin_email text    := 'jimmysantana109@gmail.com';
  conservar   text[]  := ARRAY['jimmysantana109@gmail.com', 'jimmisantana@gmail.com'];
  borrar      text[]  := ARRAY['pedro@demo.mercadord.com','ana@demo.mercadord.com','carlos@demo.mercadord.com','luis@demo.mercadord.com','maria@demo.mercadord.com','prueba+vendor1@gmail.com'];
  admin_id uuid; extranos int; antes jsonb; despues jsonb; restantes text; vivos jsonb;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  IF admin_id IS NULL OR NOT COALESCE((SELECT is_admin FROM public.users WHERE id = admin_id), false) THEN
    RAISE EXCEPTION 'ABORTA: la cuenta admin no existe o no es admin';
  END IF;
  SELECT COUNT(*) INTO extranos FROM auth.users u
   WHERE u.email <> ALL (borrar || conservar)
     AND (EXISTS (SELECT 1 FROM public.orders o WHERE o.user_id = u.id)
       OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.user_id = u.id)
       OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.buyer_id = u.id)
       OR EXISTS (SELECT 1 FROM public.reviews r WHERE r.user_id = u.id));
  IF extranos > 0 THEN
    RAISE EXCEPTION 'ABORTA: % cuenta(s) reales con actividad fuera de las listas. No uses este script.', extranos;
  END IF;
  IF EXISTS (SELECT 1 FROM public.vendors v JOIN auth.users u ON u.id = v.user_id JOIN public.products p ON p.vendor_id = v.id WHERE u.email = ANY (conservar)) THEN
    RAISE EXCEPTION 'ABORTA: una cuenta que se conserva tiene una tienda con productos (parece una tienda real).';
  END IF;

  antes := jsonb_build_object(
    'categories', (SELECT COUNT(*) FROM categories), 'category_attributes', (SELECT COUNT(*) FROM category_attributes),
    'attribute_options', (SELECT COUNT(*) FROM attribute_options), 'help_articles', (SELECT COUNT(*) FROM help_articles),
    'provinces_rd', (SELECT COUNT(*) FROM provinces_rd), 'shipping_rates', (SELECT COUNT(*) FROM shipping_rates),
    'site_settings', (SELECT COUNT(*) FROM site_settings), 'faq_category_templates', (SELECT COUNT(*) FROM faq_category_templates),
    'content_flag_terms', (SELECT COUNT(*) FROM content_flag_terms), 'search_synonyms', (SELECT COUNT(*) FROM search_synonyms),
    'promo_banners', (SELECT COUNT(*) FROM promo_banners), 'category_ai_actions', (SELECT COUNT(*) FROM category_ai_actions));

  TRUNCATE TABLE
    public.chat_quotes, public.chat_messages, public.conversations,
    public.dispute_messages, public.disputes, public.delivery_otps, public.payments,
    public.order_status_history, public.order_items, public.orders,
    public.reviews, public.daily_deals, public.coupons,
    public.gift_list_items, public.gift_lists, public.wishlists, public.abandoned_carts,
    public.product_view_history, public.notifications, public.push_subscriptions,
    public.flagged_content, public.external_verifications, public.audit_logs,
    public.variant_attribute_values, public.product_variants, public.product_attribute_values,
    public.product_pricing_tiers, public.product_translations, public.products,
    public.vendor_business_types, public.vendor_categories, public.vendor_faqs,
    public.vendor_services, public.vendor_subscriptions, public.vendor_target_customers, public.vendors;

  UPDATE public.site_settings SET updated_by = admin_id WHERE updated_by IS NOT NULL AND updated_by <> admin_id;
  DELETE FROM auth.users WHERE email = ANY (borrar);

  despues := jsonb_build_object(
    'categories', (SELECT COUNT(*) FROM categories), 'category_attributes', (SELECT COUNT(*) FROM category_attributes),
    'attribute_options', (SELECT COUNT(*) FROM attribute_options), 'help_articles', (SELECT COUNT(*) FROM help_articles),
    'provinces_rd', (SELECT COUNT(*) FROM provinces_rd), 'shipping_rates', (SELECT COUNT(*) FROM shipping_rates),
    'site_settings', (SELECT COUNT(*) FROM site_settings), 'faq_category_templates', (SELECT COUNT(*) FROM faq_category_templates),
    'content_flag_terms', (SELECT COUNT(*) FROM content_flag_terms), 'search_synonyms', (SELECT COUNT(*) FROM search_synonyms),
    'promo_banners', (SELECT COUNT(*) FROM promo_banners), 'category_ai_actions', (SELECT COUNT(*) FROM category_ai_actions));
  IF antes <> despues THEN
    RAISE EXCEPTION 'ABORTA Y REVIERTE: las tablas de referencia cambiaron. antes=% despues=%', antes, despues;
  END IF;
  restantes := (SELECT string_agg(email || CASE WHEN id = admin_id THEN ' [ADMIN]' ELSE '' END, ', ') FROM auth.users);
  vivos := jsonb_build_object('cuentas', (SELECT COUNT(*) FROM auth.users), 'tiendas', (SELECT COUNT(*) FROM vendors),
    'productos', (SELECT COUNT(*) FROM products), 'pedidos', (SELECT COUNT(*) FROM orders));

  IF dry_run THEN
    RAISE EXCEPTION 'ENSAYO COMPLETO (no cambio nada) | referencia intacta | quedan: % | %', restantes, vivos;
  END IF;
  RAISE NOTICE 'LIMPIEZA APLICADA | quedan: % | %', restantes, vivos;
END $$;
