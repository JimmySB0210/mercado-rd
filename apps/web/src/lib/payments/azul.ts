// ============================================================
// MercadoRD — Cliente de pagos Azul (Webservices API)
// Ruta: src/lib/payments/azul.ts
// ============================================================
// MODO ACTUAL: simulado (AZUL_MODE no configurado o = 'mock')
// El lunes, cuando tengas las credenciales reales de Azul:
//   1. Agrega en .env.local / Vercel:
//      AZUL_MODE=live
//      AZUL_STORE_ID=...        (tu Store/Merchant ID)
//      AZUL_AUTH1=...           (usuario de autenticación)
//      AZUL_AUTH2=...           (clave de autenticación)
//      AZUL_CERT_PATH=...       (certificado .pem que Azul te entrega)
//   2. No hay que tocar código — processPayment() detecta el modo
//      automáticamente y cambia de simulación a la API real.
//
// Referencia: Azul Webservices API usa autenticación por
// certificado SSL + Auth1/Auth2, y devuelve un ResponseCode
// ('00' = aprobado) junto con AuthorizationCode y AzulOrderId.
// ============================================================

export interface PaymentRequest {
  orderId: string
  amountCents: number      // monto total en centavos de RD$
  itbisCents: number       // ITBIS incluido, en centavos
  cardNumber?: string      // solo en modo simulado — en producción se tokeniza client-side
  expiration?: string      // MMYY
  cvc?: string
  customerName: string
}

export interface PaymentResult {
  success: boolean
  azulOrderId: string | null
  authCode: string | null
  responseCode: string
  responseMessage: string
  rawResponse: Record<string, unknown>
}

type AzulMode = 'mock' | 'live'

function getMode(): AzulMode {
  return (process.env.AZUL_MODE as AzulMode) ?? 'mock'
}

// ─── Modo simulado — para desarrollo sin credenciales bancarias ──
// Aprueba siempre, excepto si la tarjeta termina en "0000" (para
// poder probar también el flujo de pago rechazado en el frontend)
async function processMockPayment(req: PaymentRequest): Promise<PaymentResult> {
  // Simular latencia real de red/banco
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))

  const isDeclined = req.cardNumber?.endsWith('0000') ?? false

  if (isDeclined) {
    return {
      success: false,
      azulOrderId: null,
      authCode: null,
      responseCode: '05',
      responseMessage: 'Transacción rechazada (simulado — tarjeta terminada en 0000)',
      rawResponse: { mode: 'mock', declined: true },
    }
  }

  const mockAzulOrderId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const mockAuthCode = Math.random().toString(36).slice(2, 8).toUpperCase()

  return {
    success: true,
    azulOrderId: mockAzulOrderId,
    authCode: mockAuthCode,
    responseCode: '00',
    responseMessage: 'Aprobada (simulado)',
    rawResponse: {
      mode: 'mock',
      orderId: req.orderId,
      amount: req.amountCents,
      itbis: req.itbisCents,
      timestamp: new Date().toISOString(),
    },
  }
}

// ─── Modo producción — Azul Webservices API real ──────────────
// NOTA: esta función está estructurada según la documentación
// pública de Azul, pero no se ha probado contra el endpoint real
// todavía (requiere certificado + credenciales del comercio).
// Verificar el payload exacto contra la doc oficial antes del
// primer uso en producción.
async function processLivePayment(req: PaymentRequest): Promise<PaymentResult> {
  const storeId = process.env.AZUL_STORE_ID
  const auth1 = process.env.AZUL_AUTH1
  const auth2 = process.env.AZUL_AUTH2

  if (!storeId || !auth1 || !auth2) {
    console.error('[Azul] Faltan credenciales: AZUL_STORE_ID, AZUL_AUTH1, AZUL_AUTH2')
    return {
      success: false,
      azulOrderId: null,
      authCode: null,
      responseCode: 'CONFIG_ERROR',
      responseMessage: 'Credenciales de Azul no configuradas',
      rawResponse: {},
    }
  }

  try {
    // Endpoint de Azul Webservices (confirmar URL exacta con el
    // certificado que entreguen — normalmente requiere mTLS)
    const AZUL_API_URL = process.env.AZUL_API_URL ?? 'https://pagos.azul.com.do/webservices/JSON/Default.aspx'

    const res = await fetch(AZUL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Auth1: auth1,
        Auth2: auth2,
      },
      body: JSON.stringify({
        Channel: 'EC',
        Store: storeId,
        CardNumber: req.cardNumber,
        Expiration: req.expiration,
        CVC: req.cvc,
        PosInputMode: 'E-Commerce',
        TrxType: 'Sale',
        Amount: String(req.amountCents),
        Itbis: String(req.itbisCents),
        CurrencyPosCode: '$',
        OrderNumber: req.orderId,
        CustomerServicePhone: '',
        ECommerceUrl: '',
        CustomOrderId: req.orderId,
      }),
    })

    const data = await res.json()
    const approved = data.ResponseCode === '00' || data.IsoCode === '00'

    return {
      success: approved,
      azulOrderId: data.AzulOrderId ?? null,
      authCode: data.AuthorizationCode ?? null,
      responseCode: data.ResponseCode ?? data.IsoCode ?? 'UNKNOWN',
      responseMessage: data.ResponseMessage ?? data.IsoMessage ?? 'Sin mensaje',
      rawResponse: data,
    }
  } catch (err) {
    console.error('[Azul] Error de red:', err)
    return {
      success: false,
      azulOrderId: null,
      authCode: null,
      responseCode: 'NETWORK_ERROR',
      responseMessage: 'Error de conexión con Azul',
      rawResponse: { error: String(err) },
    }
  }
}

// ─── Punto de entrada único ────────────────────────────────────
export async function processPayment(req: PaymentRequest): Promise<PaymentResult> {
  const mode = getMode()

  if (mode === 'live') {
    return processLivePayment(req)
  }

  console.log(`[Azul] Procesando pago en modo SIMULADO (orden ${req.orderId})`)
  return processMockPayment(req)
}

export function isLiveMode(): boolean {
  return getMode() === 'live'
}
