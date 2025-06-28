import mercadopago from 'mercadopago';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // URL de tu webhook
    const webhookUrl = 'https://www.arcoplay.net/api/mercadopago-webhook';
    
    console.log('Setting up webhook URL:', webhookUrl);

    // MercadoPago no tiene una API directa para configurar webhooks
    // Los webhooks se configuran a través del panel de desarrolladores
    // Pero podemos verificar que la URL es accesible
    
    console.log('Testing webhook URL accessibility...');
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (testResponse.ok) {
        console.log('Webhook URL is accessible');
      } else {
        console.log('Webhook URL returned status:', testResponse.status);
      }
    } catch (error) {
      console.log('Error testing webhook URL:', error.message);
    }

    // Verificar planes disponibles
    console.log('Checking available subscription plans...');
    try {
      const plans = await mercadopago.preapproval_plan.search();
      console.log('Available plans:', plans.body);
    } catch (error) {
      console.log('Error getting plans:', error.message);
    }

    const webhookConfig = {
      url: webhookUrl,
      events: [
        "preapproval",
        "preapproval.authorized",
        "preapproval.cancelled",
        "preapproval.pending"
      ],
      manualSetupRequired: true,
      instructions: [
        "1. Ve a https://www.mercadopago.com.ar/developers/panel",
        "2. En la sección 'Notificaciones' o 'Webhooks'",
        "3. Agrega la URL: " + webhookUrl,
        "4. Selecciona los eventos: preapproval, preapproval.authorized, preapproval.cancelled"
      ]
    };

    console.log('Webhook configuration:', webhookConfig);

    res.status(200).json({ 
      message: 'Webhook setup completed',
      webhookUrl,
      config: webhookConfig,
      note: 'Webhook must be configured manually in MercadoPago developer panel'
    });
  } catch (error) {
    console.error('Error setting up webhook:', error);
    res.status(500).json({ 
      error: error.message || 'Error al configurar webhook',
      details: error
    });
  }
} 