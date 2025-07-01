// api/send-wa-code.js

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizePhone(phone) {
  return phone.replace(/^\+/, '');
}

export default async function handler(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: "Missing phone" });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Buscar si existe el usuario por número de WhatsApp
    const normalizedPhone = normalizePhone(phone);
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("phone", normalizedPhone)
      .single();
    if (userError || !user) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Usuario no encontrado para este número de WhatsApp",
        });
    }

    // Calcula la fecha de expiración (10 minutos en el futuro)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Guarda el código en la tabla sessions
    const { error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          user_id: user.id,
          access_code: code,
          expires_at: expiresAt,
        },
      ]);

    if (sessionError) {
      return res.status(500).json({ success: false, error: "No se pudo guardar el código de acceso", details: sessionError });
    }

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
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      res.status(200).json({ success: true, data });
    } else {
      res.status(500).json({ success: false, error: data });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
