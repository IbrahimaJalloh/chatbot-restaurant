// src/components/MessageInput.tsx
import { useEffect, useState } from 'react'
import type React from 'react'
import { Send } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'

// Utils date & texte
const pad2 = (n: number) => n.toString().padStart(2, '0')

const formatDateDDMMYYYY = (date: Date) =>
  `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`

const getNextWeekday = (targetDay: number): Date => {
  const today = new Date()
  const current = today.getDay()
  const diff = (targetDay + 7 - current) % 7
  const result = new Date(today)
  result.setDate(today.getDate() + diff)
  return result
}

const getNextSaturday = () => getNextWeekday(6)
const getNextSunday = () => getNextWeekday(0)

const isWeekendText = (text: string) => /week[\s-]?end/.test(text.toLowerCase())

export default function MessageInput() {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isWeekendChoice, setIsWeekendChoice] = useState(false)

  const {
    addUserMessage,
    addBotResponse,
    step,
    setStep,
    reservation,
    setReservation,
    resetReservation,
  } = useChatStore()

  const delay = 1000

  const getInlineSuggestions = (): string[] => {
    if (step === 'idle') return ['Réserver une table', 'Voir le menu', 'Infos pratiques']

    if (step === 'askDate') {
      if (isWeekendChoice) return ['Samedi', 'Dimanche', 'Modifier']
      return ["Aujourd'hui", 'Demain', 'Ce week-end', 'Modifier']
    }

    if (step === 'askTime') return ['12:00', '12:30', '19:00', '20:00', 'Modifier']

    if (step === 'askPeople') return ['1 personne', '2 personnes', '4 personnes', 'Modifier']

    if (step === 'askContact') {
      const s: string[] = []
      if (!reservation.name) s.push('Nom * : ')
      if (!reservation.email) s.push('Mail * : ')
      if (!reservation.phone) s.push('Téléphone * : ')
      if (!reservation.message) s.push('Message : ')
      return s
    }

    if (step === 'confirm') return ['Confirmer', 'Annuler', 'Modifier']

    return []
  }

  const inlineSuggestions = getInlineSuggestions()

  const sendBot = (lines: string[], suggestions?: string[]) => {
    addBotResponse(lines.join('\n'), suggestions)
  }

  const handleReservationFlow = (userMessage: string): boolean => {
    const lower = userMessage.toLowerCase().trim()

    // message technique quand le formulaire a été validé
    if (userMessage === '__contact_ok__') {
      const { reservation: res } = useChatStore.getState()
      const date = res.date
      const time = res.time
      const people = res.people

      sendBot(
        [
          "C'est noté ! 🎉",
          '',
          'Nous avons bien reçu votre demande de réservation :',
          `✓ ${date ?? 'Jour à préciser'}${time ? ` à ${time}` : ''}`,
          `✓ Pour ${people ?? 'X'} personne${(people ?? 1) > 1 ? 's' : ''}`,
          '',
          "Un membre de l'équipe vous contactera rapidement pour confirmer votre table.",
          'Merci et à très bientôt ! 😊',
        ],
        ['Voir le menu', 'Infos pratiques', 'Réserver une autre table']
      )

      resetReservation()
      setStep('idle')
      setIsWeekendChoice(false)
      return true
    }

    // GLOBALE : Recommencer / Annuler tout
    if (lower.includes('annuler tout') || lower.includes('recommencer')) {
      resetReservation()
      setStep('idle')
      setIsWeekendChoice(false)
      sendBot(
        [
          'D’accord, on recommence depuis le début 🔁',
          '',
          'Je peux vous aider à :',
          '• Réserver une table',
          '• Voir le menu',
          '• Obtenir les infos pratiques',
        ],
        ['Réserver une table', 'Voir le menu', 'Infos pratiques']
      )
      return true
    }

    // Bouton Modifier
    if (lower === 'modifier') {
      if (step === 'askTime') {
        setStep('askDate')
        setIsWeekendChoice(false)
        sendBot(
          [
            'Très bien, revenons sur le jour 📅',
            'Pour quel jour souhaitez-vous venir maintenant ?',
          ],
          ["Aujourd'hui", 'Demain', 'Ce week-end', 'Modifier']
        )
        return true
      }

      if (step === 'askPeople') {
        setStep('askTime')
        sendBot(
          [
            'Pas de souci, changeons l’heure 🕒',
            'À quelle heure souhaitez-vous venir ?',
          ],
          ['12:00', '12:30', '19:00', '20:00', 'Modifier']
        )
        return true
      }

      if (step === 'confirm') {
        setStep('askPeople')
        sendBot(
          [
            'D’accord, ajustons le nombre de personnes 👥',
            'Pour combien de personnes souhaitez-vous réserver ?',
          ],
          ['1 personne', '2 personnes', '4 personnes', 'Modifier']
        )
        return true
      }
    }

    // Lancement
    if (step === 'idle' && lower.includes('réserv')) {
      setStep('askDate')
      sendBot(
        [
          'Avec plaisir, préparons votre réservation 🕯️',
          '',
          'Pour quel jour souhaitez-vous venir ?',
          "Vous pouvez répondre « Aujourd'hui », « Demain », « Ce week-end » ou donner une date (ex : 25 janvier).",
        ],
        ["Aujourd'hui", 'Demain', 'Ce week-end', 'Modifier']
      )
      return true
    }

    // DATE
    if (step === 'askDate') {
      if (lower === 'modifier') {
        setIsWeekendChoice(false)
        sendBot(
          [
            'Pas de souci, choisissez simplement un jour 📅',
            "Par exemple : « Aujourd'hui », « Demain », « Ce week-end » ou une date précise.",
          ],
          ["Aujourd'hui", 'Demain', 'Ce week-end', 'Modifier']
        )
        return true
      }

      if (isWeekendText(lower)) {
        setIsWeekendChoice(true)
        sendBot(
          [
            'Parfait, ce week-end 😊',
            '',
            'Préférez-vous venir :',
            '• Samedi',
            '• Dimanche',
          ],
          ['Samedi', 'Dimanche', 'Modifier']
        )
        return true
      }

      let dateLabel = userMessage
      let dateValue: string

      const now = new Date()

      if (lower === "aujourd'hui" || lower === 'aujourdhui') {
        dateValue = formatDateDDMMYYYY(now)
        dateLabel = "Aujourd'hui"
      } else if (lower === 'demain') {
        const tomorrow = new Date(now)
        tomorrow.setDate(now.getDate() + 1)
        dateValue = formatDateDDMMYYYY(tomorrow)
        dateLabel = 'Demain'
      } else if (lower === 'samedi') {
        const saturday = getNextSaturday()
        dateValue = formatDateDDMMYYYY(saturday)
        dateLabel = 'Samedi'
      } else if (lower === 'dimanche') {
        const sunday = getNextSunday()
        dateValue = formatDateDDMMYYYY(sunday)
        dateLabel = 'Dimanche'
      } else {
        dateValue = userMessage
      }

      setIsWeekendChoice(false)
      setReservation({ date: dateValue })
      setStep('askTime')

      sendBot(
        [
          `Parfait, noté pour ${dateLabel} (${dateValue}) 📅`,
          '',
          'À quelle heure souhaitez-vous venir ?',
          'Par exemple : 12:00, 12:30, 19:00, 20:00',
        ],
        ['12:00', '12:30', '19:00', '20:00', 'Modifier']
      )
      return true
    }

    // HEURE
    if (step === 'askTime') {
      let time = userMessage.trim()
      const lowerTime = time.toLowerCase()

      const matchHour = lowerTime.match(/^(\d{1,2})(h|:?(\d{2}))?$/)
      if (matchHour) {
        const hour = matchHour[1].padStart(2, '0')
        const minutes = matchHour[3] ?? '00'
        time = `${hour}:${minutes}`
      }

      setReservation({ time })
      setStep('askPeople')
      sendBot(
        [
          `Très bien, ${time} 🕒`,
          '',
          'Pour combien de personnes ?',
          'Par exemple : 2, 4 ou tout autre nombre.',
        ],
        ['1 personne', '2 personnes', '4 personnes', 'Modifier']
      )
      return true
    }

    // PERSONNES
    if (step === 'askPeople') {
      const matchNumber = userMessage.match(/\d+/)

      if (!matchNumber) {
        sendBot(
          [
            "Je n'ai pas bien compris le nombre de personnes.",
            'Pouvez-vous indiquer un nombre ? (ex : 2, 4, 6...)',
          ],
          ['2', '4', '6', 'Modifier']
        )
        return true
      }

      const people = Number(matchNumber[0])
      setReservation({ people })
      setStep('askContact')

      sendBot(
        [
          `Génial, une table pour ${people} personne${people > 1 ? 's' : ''} ✨`,
          '',
          'Avant de finaliser, pouvez-vous me donner vos coordonnées :',
          '• Nom *',
          '• Adresse e-mail *',
          '• Téléphone *',
          '• Et un message si besoin (allergies, occasion spéciale...).',
          '',
          "Indiquez-les dans la conversation ci-dessous,",
          'ou cliquez sur un champ et complétez-le dans la zone de saisie.',
        ],
        ['Nom * : ', 'Mail * : ', 'Téléphone * : ', 'Message : ']
      )
      return true
    }

    // CONTACT
    if (step === 'askContact') {
      const text = userMessage.trim()
      const lowerMsg = text.toLowerCase()

      // On enlève l'éventuel * et on normalise
      const normalized = lowerMsg.replace('*', '').trim()

      // Contenu après les deux-points
      const afterColon = text.split(':')[1]?.trim() ?? ''

      // Champs obligatoires : nom / mail / téléphone
      const isRequiredField =
        normalized.startsWith('nom') ||
        normalized.startsWith('mail') ||
        normalized.startsWith('email') ||
        normalized.startsWith('téléphone') ||
        normalized.startsWith('telephone') ||
        normalized.startsWith('tel')

      // Si obligatoire et rien après les deux-points → on refuse
      if (isRequiredField && !afterColon) {
        sendBot(
          [
            'Ce champ est obligatoire ⚠️',
            'Merci de compléter les informations après les deux-points, par exemple :',
            'Nom * : Jean Dupont',
            'Mail * : jean.dupont@mail.com',
            'Téléphone * : 0612345678',
          ],
          getInlineSuggestions()
        )
        return true
      }

      // Enregistrement des champs dans la réservation
      if (normalized.startsWith('nom')) {
        setReservation({ name: text })
      } else if (normalized.startsWith('mail') || normalized.startsWith('email')) {
        setReservation({ email: text })
      } else if (
        normalized.startsWith('téléphone') ||
        normalized.startsWith('telephone') ||
        normalized.startsWith('tel')
      ) {
        setReservation({ phone: text })
      } else if (normalized.startsWith('message')) {
        // Message peut être vide, on le stocke quand même
        setReservation({ message: text })
      }

      const { reservation: res } = useChatStore.getState()

      const hasName = !!res.name
      const hasEmail = !!res.email
      const hasPhone = !!res.phone
      const hasMessage = !!res.message // facultatif

      // Tous les champs (y compris message) remplis -> confirmation
      if (hasName && hasEmail && hasPhone && hasMessage) {
        setStep('confirm')
        sendBot(
          [
            'Merci beaucoup, vos coordonnées ont bien été enregistrées ✅',
            "Voici le récapitulatif de votre demande, dites « confirmer » ou « annuler ».",
          ],
          ['Confirmer', 'Annuler', 'Modifier']
        )
        return true
      }

      // Sinon, on ne redemande que ce qui manque
      const missing: string[] = []
      if (!hasName) missing.push('Nom *')
      if (!hasEmail) missing.push('Email *')
      if (!hasPhone) missing.push('Téléphone *')
      if (!hasMessage) missing.push('Message')

      sendBot(
        [
          "Merci, j'ai bien noté.",
          `Il me manque encore : ${missing.join(', ')}.`,
          'Cliquez sur un champ ci-dessous puis complétez-le dans la zone de saisie.',
        ],
        getInlineSuggestions()
      )

      return true
    }


    // CONFIRM
    if (step === 'confirm') {
      const { reservation: res } = useChatStore.getState()
      const date = res.date
      const time = res.time
      const people = res.people

      if (lower.includes('confirm')) {
        sendBot(
          [
            "C'est noté ! 🎉",
            '',
            'Nous avons bien reçu votre demande de réservation :',
            `✓ ${date ?? 'Jour à préciser'}${time ? ` à ${time}` : ''}`,
            `✓ Pour ${people ?? 'X'} personne${(people ?? 1) > 1 ? 's' : ''}`,
            '',
            "Un membre de l'équipe vous contactera rapidement pour confirmer votre table.",
            'Merci et à très bientôt ! 😊',
          ],
          ['Voir le menu', 'Infos pratiques', 'Réserver une autre table']
        )
        resetReservation()
        setStep('idle')
        setIsWeekendChoice(false)
        return true
      }

      if (lower.includes('annul')) {
        sendBot(
          [
            'La réservation a été annulée ❌',
            'Souhaitez-vous recommencer une nouvelle demande ou voir le menu ?',
          ],
          ['Réserver une table', 'Voir le menu', 'Infos pratiques']
        )
        resetReservation()
        setStep('idle')
        setIsWeekendChoice(false)
        return true
      }
    }

    return false
  }

  const sendMessage = (userMessage: string) => {
    if (!userMessage.trim() || isTyping) return

    const clean = userMessage.trim()
    setInput('')
    setIsTyping(true)
    addUserMessage(clean)

    setTimeout(() => {
      const handled = handleReservationFlow(clean)
      if (handled) {
        setIsTyping(false)
        return
      }

      const lower = clean.toLowerCase()
      let response: string[]
      let suggestions: string[] = []

      // 1) En fonction de l'étape
      if (step === 'askDate') {
        response = [
          "Je n'ai pas bien compris le jour souhaité 📅",
          "Vous pouvez choisir « Aujourd'hui », « Demain », « Ce week-end » ou saisir une date (ex : 25 janvier).",
        ]
        suggestions = ["Aujourd'hui", 'Demain', 'Ce week-end', 'Modifier']
      } else if (step === 'askTime') {
        response = [
          "Je n'ai pas bien compris l'heure souhaitée 🕒",
          'Par exemple : 12:00, 12:30, 19:00, 20:00.',
        ]
        suggestions = ['12:00', '12:30', '19:00', '20:00', 'Modifier']
      } else if (step === 'askPeople') {
        response = [
          "Je n'ai pas bien compris le nombre de personnes 👥",
          'Indiquez un nombre, par exemple 2, 4 ou 6.',
        ]
        suggestions = ['2', '4', '6', 'Modifier']
      } else if (step === 'askContact') {
        response = [
          "Merci, je n'ai pas bien compris vos coordonnées.",
          'Pouvez-vous les envoyer sous cette forme :',
          'Nom : Dupont',
          'Email : jean.dupont@mail.com',
          'Téléphone : 0612345678',
          'Message : anniversaire, allergies, etc.',
          'Vous pouvez aussi cliquer sur un champ ci-dessous, puis compléter dans la zone de saisie.',
        ]
        suggestions = ['Nom : ', 'Mail : ', 'Téléphone : ', 'Message : ']
      } else if (step === 'confirm') {
        response = [
          'Pour finaliser, vous pouvez :',
          '• « Confirmer »',
          '• « Annuler »',
          '• « Modifier » pour revenir à l’étape précédente',
        ]
        suggestions = ['Confirmer', 'Annuler', 'Modifier']
      } else if (lower.includes('réserv')) {
        // 2) Intentions globales
        setStep('askDate')
        response = [
          'Parfait, on s’occupe de votre réservation 🕯️',
          '',
          'Pour quel jour souhaitez-vous venir ?',
        ]
        suggestions = ["Aujourd'hui", 'Demain', 'Ce week-end', 'Modifier']
      } else if (lower.includes('menu') || lower.includes('carte')) {
        response = [
          'Voici un aperçu de notre menu du moment 🍽️',
          '',
          '• Entrées : Velouté de potimarron, Tartare de saumon',
          '• Plats : Filet de boeuf, Risotto de saison',
          '• Desserts : Tiramisu maison, Fondant au chocolat',
          '',
          'Préférez-vous viande, poisson ou végétarien ?',
        ]
        suggestions = ['Réserver une table', 'Infos pratiques']
      } else if (
        lower.includes('horaire') ||
        lower.includes('heure') ||
        lower.includes('ouvert')
      ) {
        response = [
          'Nos horaires 🕒',
          '',
          '• Midi : 12:00 – 14:30',
          '• Soir : 19:00 – 22:30',
          'Fermé le lundi.',
        ]
        suggestions = ['Réserver une table', 'Voir le menu']
      } else if (
        lower.includes('allerg') ||
        lower.includes('sans gluten') ||
        lower.includes('végétar')
      ) {
        response = [
          'Merci de nous parler de vos allergies / préférences 🩺',
          '',
          'Nous pouvons adapter de nombreux plats pour :',
          '• Allergies (gluten, lactose, fruits à coque...)',
          '• Régimes végétariens / sans porc',
          '',
          'Dites-moi ce que vous souhaitez éviter, et je vous proposerai des idées.',
        ]
        suggestions = ['Voir le menu', 'Réserver une table']
      } else {
        // Fallback idle
        response = [
          'Très bien 😄',
          '',
          'Je peux vous aider à :',
          '• Réserver une table',
          '• Voir le menu',
          '• Obtenir les infos pratiques',
          '',
          'Par exemple, écrivez « Réserver pour 2 demain soir »',
          'ou cliquez sur une suggestion ci-dessus.',
        ]
        suggestions = ['Réserver une table', 'Voir le menu', 'Infos pratiques']
      }

      sendBot(response, suggestions)
      setIsTyping(false)
    }, delay)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage(input)
  }

  // ICI : on ne fait plus sendMessage, on pré-remplit juste l'input
  const handleSuggestionClickInline = (suggestion: string) => {
    if (isTyping) return

    // Étape contact → comportement "champ" : juste pré-remplir
    if (step === 'askContact') {
      setInput(suggestion)
      return
    }

    // Autres étapes → on envoie directement
    sendMessage(suggestion)
  }


  // Event venant de ChatWindow (tu peux le garder si tu l'utilises ailleurs)
  useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<string>
      if (custom.detail && !isTyping) {
        // au lieu d'envoyer directement, on peut aussi pré-remplir :
        setInput(custom.detail)
      }
    }

    window.addEventListener('chatbot:suggestion', listener)
    return () => window.removeEventListener('chatbot:suggestion', listener)
  }, [isTyping])

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white/50">
      {inlineSuggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {inlineSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClickInline(suggestion)}
              className="
                inline-flex items-center gap-2
                px-3 py-1.5 rounded-full
                text-xs font-medium
                bg-white
                text-gray-800
                border border-gray-200
                shadow-sm
                hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700
                focus:outline-none focus:ring-2 focus:ring-indigo-400
                transition-colors duration-150
              "
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tapez votre message..."
          className="
            flex-1 px-4 py-3
            bg-white border border-gray-200 rounded-2xl
            text-gray-900
            placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={isTyping}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 
                    hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl 
                    flex items-center justify-center shadow-lg hover:shadow-xl 
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-95"
        >
          <Send className={`w-5 h-5 text-white ${isTyping ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isTyping && <p className="text-xs text-gray-500 mt-1 px-1">IA réfléchit...</p>}
    </form>
  )
}
