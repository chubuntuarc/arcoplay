import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  TBD: { label: "Por definir", color: "text-gray-400" },
  NS: { label: "Próximo", color: "text-green-600" },
  "1H": { label: "1er Tiempo", color: "text-blue-600" },
  HT: { label: "Medio Tiempo", color: "text-yellow-600" },
  "2H": { label: "2do Tiempo", color: "text-blue-700" },
  ET: { label: "Tiempo Extra", color: "text-purple-600" },
  BT: { label: "Descanso Extra", color: "text-purple-400" },
  P: { label: "Penales", color: "text-pink-600" },
  SUSP: { label: "Suspendido", color: "text-orange-600" },
  INT: { label: "Interrumpido", color: "text-orange-400" },
  FT: { label: "Finalizado", color: "text-gray-500" },
  AET: { label: "Finalizado (TE)", color: "text-gray-500" },
  PEN: { label: "Finalizado (Penales)", color: "text-gray-500" },
  PST: { label: "Pospuesto", color: "text-yellow-500" },
  CANC: { label: "Cancelado", color: "text-red-600" },
  ABD: { label: "Abandonado", color: "text-red-500" },
  AWD: { label: "Pérdida Técnica", color: "text-red-400" },
  WO: { label: "WalkOver", color: "text-red-400" },
  LIVE: { label: "En Vivo", color: "text-green-700" },
};
