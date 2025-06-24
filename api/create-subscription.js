import mercadopago from 'mercadopago';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

console.log(mercadopago); // <-- Mira qué métodos tiene

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { plan_id, email } = req.body;

  if (!plan_id || !email) {
    res.status(400).json({ error: 'Faltan datos' });
    return;
  }

  try {
    // Crea la suscripción (preapproval)
    const response = await mercadopago.preapproval.create({
      preapproval_plan_id: plan_id,
      payer_email: email,
      back_url: 'https://www.arcoplay.net/plans',
      reason: 'Suscripción ArcoPlay',
      status: 'pending'
    });

    // Redirige al usuario al checkout de suscripción de MercadoPago
    res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error('MercadoPago error:', error);
    res.status(500).json({ 
      error: error.message || 'Error al crear suscripción',
      details: error
    });
  }
}
