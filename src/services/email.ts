// src/services/email.ts
export interface ReservationData {
  date?: string
  time?: string
  people?: number
}

export interface ReservationEmailPayload {
  nom: string
  email: string
  telephone: string
  message?: string
  reservation: ReservationData
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function sendReservationEmail(payload: ReservationEmailPayload) {
  const res = await fetch(`${API_URL}/send-reservation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error || 'Erreur lors de lenvoi du mail')
  }

  return res.json()
}
