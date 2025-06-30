import { supabase } from '@/lib/supabase' // o tu cliente de base de datos

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const { phone, code } = req.body;

  // 1. Buscar usuario por teléfono
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (userError || !user) {
    return res.status(400).json({ success: false, error: 'Usuario no encontrado' });
  }

  // 2. Buscar código válido (no expirado)
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('access_code', code)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (sessionError || !session) {
    return res.status(400).json({ success: false, error: 'Código inválido o expirado' });
  }

  // 3. (Opcional) Marcar el código como usado o eliminarlo

  // 4. Responder con los datos del usuario y sesión
  return res.status(200).json({
    success: true,
    user,
    session
  });
}
