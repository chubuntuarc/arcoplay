// api/send-wa-code.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Guarda el código en tu base de datos asociado al teléfono

  // Envía el código por WhatsApp usando la Cloud API
  const response = await fetch(
    "https://graph.facebook.com/v17.0/681140808420512/messages",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: "auth_code", // Debes crear una plantilla aprobada en WhatsApp Business
          language: { code: "es_MX" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }),
    }
  );

  if (response.ok) {
    res.status(200).json({ success: true });
  } else {
    res
      .status(500)
      .json({ success: false, error: "No se pudo enviar el código" });
  }
}
