import openpay from './openpay.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customer_id, plan_id, card_id } = req.body;

  try {
    const subscription = await new Promise((resolve, reject) => {
      openpay.customers.subscriptions.create(customer_id, {
        plan_id,
        card_id
      }, (err, subscription) => {
        if (err) return reject(err);
        resolve(subscription);
      });
    });

    res.status(200).json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error });
  }
}
