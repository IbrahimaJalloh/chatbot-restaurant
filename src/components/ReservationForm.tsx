// src/components/ReservationForm.tsx
import { useState } from 'react'
import { sendReservationEmail } from '../services/email'
import { useChatStore } from '../stores/chatStore'

interface FormState {
  nom: string
  email: string
  telephone: string
  message: string
}

interface ReservationFormProps {
  onSuccess?: () => void
}

export default function ReservationForm({ onSuccess }: ReservationFormProps) {
  const [form, setForm] = useState<FormState>({
    nom: '',
    email: '',
    telephone: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // On récupère la dernière réservation du chatbot
  const reservation = useChatStore((s) => s.reservation)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError(null)

    try {
      await sendReservationEmail({
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        message: form.message.trim(),
        reservation: {
          date: reservation.date,
          time: reservation.time,
          people: reservation.people,
        },
      })

      setSuccess('Votre demande a bien été envoyée. Nous vous contacterons rapidement.')
      setForm({ nom: '', email: '', telephone: '', message: '' })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Coordonnées pour la réservation</h2>

      <div>
        <label className="block text-sm font-medium mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          name="nom"
          required
          value={form.nom}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          placeholder="Votre nom complet"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Mail <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          placeholder="votre.email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="telephone"
          required
          value={form.telephone}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          placeholder="06 00 00 00 00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          name="message"
          rows={3}
          value={form.message}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          placeholder="Précisions, allergies, occasion spéciale..."
        />
      </div>

      <div className="text-xs text-gray-500">
        Récapitulatif actuel : {reservation.date || 'Jour ?'}{' '}
        {reservation.time ? `à ${reservation.time}` : ''} –{' '}
        {reservation.people ? `${reservation.people} pers.` : 'nombre ?'}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
      </button>

      {success && <p className="text-sm text-green-600">{success}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
