import mercadopago from 'mercadopago';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('=== TESTING MERCADOPAGO CONNECTION ===');
    console.log('Access Token:', process.env.MP_ACCESS_TOKEN ? 'Present' : 'Missing');
    console.log('Access Token length:', process.env.MP_ACCESS_TOKEN?.length || 0);
    
    // Test 1: Verificar que el token es válido
    console.log('Test 1: Verificando token...');
    try {
      const accountInfo = await mercadopago.users.get();
      console.log('Account info:', accountInfo.body);
    } catch (error) {
      console.error('Error getting account info:', error.message);
    }

    // Test 2: Verificar planes de suscripción
    console.log('Test 2: Verificando planes de suscripción...');
    try {
      const plans = await mercadopago.preapproval_plan.search();
      console.log('Available plans:', plans.body);
    } catch (error) {
      console.error('Error getting plans:', error.message);
    }

    // Test 3: Verificar webhooks existentes
    console.log('Test 3: Verificando webhooks...');
    try {
      // MercadoPago no tiene una API directa para listar webhooks
      // Pero podemos verificar si podemos crear uno de prueba
      console.log('No hay API directa para listar webhooks');
    } catch (error) {
      console.error('Error checking webhooks:', error.message);
    }

    // Test 4: Verificar preapprovals existentes
    console.log('Test 4: Verificando preapprovals existentes...');
    try {
      const preapprovals = await mercadopago.preapproval.search();
      console.log('Existing preapprovals:', preapprovals.body);
    } catch (error) {
      console.error('Error getting preapprovals:', error.message);
    }

    // Test 5: Probar crear un preapproval de prueba
    console.log('Test 5: Probando crear preapproval de prueba...');
    try {
      const testPreapproval = await mercadopago.preapproval.create({
        preapproval_plan_id: "2c9380849783ce770197a0396e770acf", // Plan player
        payer_email: "test@example.com",
        reason: "Test preapproval",
        status: "pending",
        notification_url: "https://www.arcoplay.net/api/mercadopago-webhook"
      });
      console.log('Test preapproval created:', testPreapproval.body);
      
      // Limpiar el preapproval de prueba
      await mercadopago.preapproval.cancel(testPreapproval.body.id);
      console.log('Test preapproval cancelled');
    } catch (error) {
      console.error('Error creating test preapproval:', error.message);
      console.error('Error details:', error);
    }

    res.status(200).json({ 
      message: 'MercadoPago tests completed',
      checkConsole: 'Revisa la consola para detalles'
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ 
      error: error.message || 'Error en las pruebas',
      details: error
    });
  }
} 