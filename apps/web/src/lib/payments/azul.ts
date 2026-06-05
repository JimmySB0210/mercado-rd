import { createHmac } from 'crypto';
import type { Payment } from '@/types';

// ─── Tipos Azul ───────────────────────────────────────────────────────────────

interface AzulRequest {
  orderId:     string;
  amount:      number;   // Pesos dominicanos (ej: 5661)
  cardNumber:  string;
  expiration:  string;   // MMAA
  cvv:         string;
  cardHolder:  string;
  customerIP?: string;
}

interface AzulResponse {
  ResponseMessage:  string;  // "APROBADA" | "DECLINADA"
  IsoCode:          string;  // "00" = aprobado
  AuthorizationCode:string;
  AzulOrderId:      string;
  DateTime:         string;
  ErrorDescription?:string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const AZUL_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://pagos.azul.com.do/PaymentPage/api/Default'
    : 'https://pruebas.azul.com.do/PaymentPage/api/Default';

// ─── Procesar pago con Azul ───────────────────────────────────────────────────

export async function processAzulPayment(req: AzulRequest): Promise<{
  success:  boolean;
  authCode: string | null;
  azulId:   string | null;
  error:    string | null;
}> {
  const itbis   = Math.round(req.amount * 0.18);
  const amountCents = req.amount * 100; // Azul usa centavos

  try {
    const response = await fetch(AZUL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth1': process.env.AZUL_AUTH1!,
        'Auth2': process.env.AZUL_AUTH2!,
      },
      body: JSON.stringify({
        Channel:         'EC',
        Store:           process.env.AZUL_STORE_ID,
        CardNumber:      req.cardNumber.replace(/\s/g, ''),
        Expiration:      req.expiration,
        CVC:             req.cvv,
        PosInputMode:    'E-Commerce',
        TrxType:         'Sale',
        Amount:          String(amountCents),
        Itbis:           String(itbis * 100),
        OrderNumber:     req.orderId,
        ECommerceUrl:    'https://mercadord.com.do',
        CustomerServicePhone: '8095550000',
        AltMerchantName: 'MercadoRD',
        SaveToDataVault: '2', // No guardar tarjeta
      }),
    });

    const data: AzulResponse = await response.json();
    const approved = data.IsoCode === '00';

    return {
      success:  approved,
      authCode: approved ? data.AuthorizationCode : null,
      azulId:   approved ? data.AzulOrderId : null,
      error:    approved ? null : (data.ErrorDescription ?? data.ResponseMessage),
    };
  } catch (err) {
    console.error('Azul payment error:', err);
    return { success: false, authCode: null, azulId: null, error: 'Error de conexión con Azul' };
  }
}

// ─── Webhook de Azul (verificar firma) ───────────────────────────────────────

export function verifyAzulWebhook(payload: string, signature: string): boolean {
  const expected = createHmac('sha512', process.env.AZUL_AUTH_KEY!)
    .update(payload)
    .digest('hex');
  return expected === signature;
}
