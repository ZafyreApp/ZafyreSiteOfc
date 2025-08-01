// src/config/mercadopago.ts
import mercadopago from 'mercadopago';

// Configuração do Mercado Pago para uso no backend (API Routes)
export const configureMercadoPago = () => {
  mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  });
};

// A public key é usada no frontend para o SDK do Mercado Pago
export const MERCADO_PAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

// Chame a configuração para garantir que o access_token esteja sempre setado ao importar
configureMercadoPago();
