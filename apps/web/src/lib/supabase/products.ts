import { createServerSupabase } from './client';
import type { Product } from '@/types';

interface GetProductsOptions {
  category?: string;
  search?:   string;
  province?: number;
  limit?:    number;
  offset?:   number;
  sort?:     'price_asc' | 'price_desc' | 'popular' | 'newest';
}

// ─── Obtener lista de productos ───────────────────────────────────────────────
export async function getProducts(opts: GetProductsOptions = {}): Promise<Product[]> {
  const supabase = createServerSupabase();
  const {
    category, search, province,
    limit = 24, offset = 0,
    sort = 'popular',
  } = opts;

  let query = supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, is_verified, province_id),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .range(offset, offset + limit - 1);

  if (category)  query = query.eq('category.slug', category);
  if (search)    query = query.ilike('name', `%${search}%`);
  if (province)  query = query.eq('province_id', province);

  switch (sort) {
    case 'price_asc':  query = query.order('price_rdp', { ascending: true });  break;
    case 'price_desc': query = query.order('price_rdp', { ascending: false }); break;
    case 'newest':     query = query.order('created_at', { ascending: false }); break;
    default:           query = query.order('sold_count', { ascending: false }); break;
  }

  const { data, error } = await query;
  if (error) { console.error('getProducts error:', error); return []; }
  return (data ?? []) as Product[];
}

// ─── Obtener un producto por ID ───────────────────────────────────────────────
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(*),
      category:categories(*),
      province:provinces_rd(*)
    `)
    .eq('id', id)
    .single();

  if (error) { console.error('getProductById error:', error); return null; }
  return data as Product;
}

// ─── Incrementar contador de visitas ─────────────────────────────────────────
export async function incrementProductView(id: string) {
  const supabase = createServerSupabase();
  await supabase.rpc('increment_product_views', { product_id: id });
}
