import openpay from './openpay.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, amount, repeat_every, repeat_unit } = req.body;
  // repeat_unit: 'month', 'week', etc.

  try {
    const plan = await new Promise((resolve, reject) => {
      openpay.plans.create({
        name,
        amount,
        repeat_every,
        repeat_unit,
        trial_days: 0,
        status_after_retry: 'cancelled'
      }, (err, plan) => {
        if (err) return reject(err);
        resolve(plan);
      });
    });

    res.status(200).json({ plan });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error });
  }
}
