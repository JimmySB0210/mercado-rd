-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Extensión unaccent y tabla search_synonyms
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta el estado ACTUAL de la extensión
-- `unaccent` y la tabla `search_synonyms`, ya aplicadas directamente
-- en Supabase — no se ejecutó desde este archivo. Se agrega aquí
-- solo para que quede rastro en el repo (mismo motivo que 003 y 004:
-- search_products(), documentada en 004, depende de estos dos objetos
-- y ninguno vivía en el repo hasta ahora).
--
-- unaccent: usada por search_products() para que la búsqueda sea
-- tolerante a tildes/acentos (ej. "cafe" encuentra "café").
--
-- search_synonyms: mapea un término buscado a una lista de términos
-- relacionados (maps_to) que también se incluyen en el matching —
-- así "ropa" también encuentra camisetas, vestidos, pantalones, etc.
-- sin que esas palabras aparezcan literalmente en el término
-- buscado. Semilla inicial de sinónimos incluida abajo.
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE public.search_synonyms (
  id integer PRIMARY KEY,
  term text NOT NULL,
  maps_to text[] NOT NULL,
  created_at timestamptz
);

INSERT INTO search_synonyms (term, maps_to) VALUES
('ropa', ARRAY['camiseta','vestido','pantalon','camisa','blusa','falda','short','polo','jersey','abrigo','chaqueta','jean','moda']),
('ropa de mujer', ARRAY['vestido','blusa','falda','top','moda']),
('ropa de hombre', ARRAY['camisa','pantalon','polo','jean','camiseta']),
('zapatos', ARRAY['tenis','sandalias','botas','calzado','sneakers']),
('accesorios', ARRAY['bolso','cartera','collar','pulsera','aretes','reloj']),
('cafe', ARRAY['cafe','induban','molido','espresso','capuchino','latte']),
('capuchino', ARRAY['cafe','induban','molido','espresso']),
('bebida', ARRAY['cafe','jugo','refresco','agua','ron','cerveza']),
('comida', ARRAY['alimento','arroz','habichuela','pollo','carne','pan','cafe']),
('alimento', ARRAY['cafe','arroz','habichuela','pollo','carne','pan']),
('snack', ARRAY['galleta','dulce','chocolate','chips']),
('celular', ARRAY['iphone','samsung','android','movil','smartphone','telefono']),
('telefono', ARRAY['iphone','samsung','celular','movil','smartphone']),
('computadora', ARRAY['laptop','pc','macbook','tablet','computador']),
('electronico', ARRAY['celular','laptop','televisor','audifonos','camara']),
('audifonos', ARRAY['auriculares','earphone','headphone','parlante']),
('muebles', ARRAY['silla','mesa','cama','sofa','escritorio','armario']),
('electrodomestico', ARRAY['nevera','lavadora','microondas','licuadora','estufa']),
('decoracion', ARRAY['cuadro','lampara','cortina','alfombra','florero']),
('maquillaje', ARRAY['labial','base','sombra','rimel','rubor','perfume']),
('cuidado personal', ARRAY['crema','shampoo','jabon','desodorante','locion']),
('perfume', ARRAY['colonia','fragancia','spray']),
('deporte', ARRAY['tenis','gym','pelota','guante','pesa','bicicleta','yoga']),
('gym', ARRAY['pesa','mancuerna','proteina','suplemento','banda']),
('poloche', ARRAY['camiseta','polo','camisa','jersey']),
('mahon', ARRAY['jean','pantalon','vaquero','denim']),
('abanico', ARRAY['ventilador','fan','aire']),
('nevera', ARRAY['refrigerador','heladera','frigorifico']),
('fundas', ARRAY['carcasa','cover','estuche','case']),
('tenis', ARRAY['zapatos','sneakers','calzado','deportivo']);
