import mercadopago from 'mercadopago';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

console.log('MercadoPago SDK loaded');

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
    console.log('Creating subscription for:', { plan_id, email });
    
    // URL del webhook (ajusta según tu dominio)
    const webhookUrl = 'https://www.arcoplay.net/api/mercadopago-webhook';
    
    // Crea la suscripción (preapproval)
    const response = await mercadopago.preapproval.create({
      preapproval_plan_id: plan_id,
      payer_email: email,
      back_url: 'https://www.arcoplay.net/plans',
      reason: 'Suscripción ArcoPlay',
      status: 'pending',
      notification_url: webhookUrl // Agregar URL del webhook
    });

    console.log('Subscription created:', response.body);

    // Redirige al usuario al checkout de suscripción de MercadoPago
    res.status(200).json({ 
      init_point: response.body.init_point,
      preapproval_id: response.body.id,
      webhook_url: webhookUrl
    });
  } catch (error) {
    console.error('MercadoPago error:', error);
    res.status(500).json({ 
      error: error.message || 'Error al crear suscripción',
      details: error
    });
  }
}
