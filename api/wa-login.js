import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizePhone(phone) {
  return phone.replace(/^\+/, '');
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, error: "Método no permitido" });
    }

    const { phone, code } = req.body;
    const normalizedPhone = normalizePhone(phone);

    // 1. Buscar usuario por teléfono
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("phone", normalizedPhone)
      .single();

    if (userError || !user) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Usuario no encontrado",
          details: userError,
        });
    }

    // 2. Buscar código válido (no expirado)
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("access_code", code)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Código inválido o expirado",
          details: sessionError,
        });
    }

    // 3. (Opcional) Marcar el código como usado o eliminarlo

    // 4. Responder con los datos del usuario y sesión
    return res.status(200).json({
      success: true,
      user,
      session,
    });
  } catch (err) {
    // Loguea el error para verlo en los logs de Vercel
    console.error("WA-LOGIN ERROR:", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error", details: err.message });
  }
}
