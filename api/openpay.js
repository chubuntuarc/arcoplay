import Openpay from 'openpay';

const openpay = new Openpay(
  process.env.OPENPAY_MERCHANT_ID, // tu merchant ID
  process.env.OPENPAY_PRIVATE_KEY, // tu private key
  false // true para sandbox, false para producción
);

export default openpay;
