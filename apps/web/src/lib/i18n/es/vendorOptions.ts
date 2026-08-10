// ============================================================
// MercadoRD — i18n: namespace "vendorOptions" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/vendorOptions.ts
// ============================================================
// Labels de los enums del wizard de registro de vendor y de
// configuración: tipo de negocio, estado de fabricación, tiempo de
// producción, a quién vende, personalización, servicios y nivel de
// verificación. Las claves de cada bucket son los `value` reales de
// los enums (nunca se traducen — son lo que se guarda en la BD) y
// las claves de `verificationLevel` son el nivel 1-4 como string.
// Namespace anidado (a diferencia de los demás): t() soporta rutas
// con punto, ej. t('businessType.manufacturer', 'vendorOptions').
// ============================================================

export const vendorOptions = {
  businessType: {
    manufacturer: 'Fabricante',
    wholesaler: 'Mayorista',
    retailer: 'Minorista',
    importer: 'Importador',
    distributor: 'Distribuidor',
    supplier: 'Proveedor',
    private_label: 'Marca propia',
    artisan: 'Artesano/Productor',
    service_provider: 'Prestador de servicios',
  },
  manufacturingStatus: {
    fabricates_own: 'Fabrico mis productos',
    buys_from_third_parties: 'Compro a terceros',
    mixed: 'Mixto (fabrico algunos, compro otros)',
  },
  productionTime: {
    under_7_days: 'Menos de 7 días',
    days_7_15: '7 a 15 días',
    days_15_30: '15 a 30 días',
    days_30_60: '30 a 60 días',
    over_60_days: 'Más de 60 días',
    variable: 'Variable, según el pedido',
    custom: 'Personalizado',
  },
  customerType: {
    end_consumer: 'Consumidor final',
    resellers: 'Revendedores',
    stores: 'Tiendas',
    businesses: 'Negocios',
    wholesalers: 'Mayoristas',
    retailers: 'Minoristas',
    manufacturers: 'Fabricantes',
    entrepreneurs: 'Emprendedores',
    distributors: 'Distribuidores',
  },
  customizationOption: {
    yes: 'Sí',
    no: 'No',
    depends: 'Depende',
  },
  service: {
    manufacturing: 'Fabricación',
    private_label: 'Marca privada',
    product_development: 'Desarrollo de producto',
    formula_development: 'Desarrollo de fórmula',
    customization: 'Personalización',
    packaging: 'Envasado',
    labeling: 'Etiquetado',
    on_demand_production: 'Producción por encargo',
    product_design: 'Diseño de producto',
    national_shipping: 'Envíos nacionales',
    delivery: 'Delivery',
    pickup: 'Pickup',
    importing: 'Importación',
    storage: 'Almacenamiento',
    distribution: 'Distribución',
    other: 'Otro',
  },
  serviceGroupTitles: {
    manufacturing_dev: 'Fabricación y desarrollo',
    logistics: 'Logística y distribución',
  },
  verificationLevel: {
    '1': 'Cuenta básica',
    '2': 'Negocio verificado',
    '3': 'Fabricante verificado',
    '4': 'Proveedor destacado',
  },
}

export type VendorOptionsDict = typeof vendorOptions
