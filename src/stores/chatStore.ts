// src/stores/chatStore.ts
import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type Role = 'user' | 'bot'

export interface Message {
  id: string
  text: string
  role: Role
  timestamp: number
  suggestions?: string[]
}

export type ReservationStep =
  | 'idle'
  | 'askDate'
  | 'askTime'
  | 'askPeople'
  | 'askContact'
  | 'confirm'

export interface ReservationData {
  date?: string
  time?: string
  people?: number
  name?: string
  email?: string
  phone?: string
  message?: string
}

interface ChatStore {
  // messages
  messages: Message[]
  addUserMessage: (text: string) => void
  addBotResponse: (text: string, suggestions?: string[]) => void

  // réservation
  step: ReservationStep
  setStep: (step: ReservationStep) => void

  reservation: ReservationData
  setReservation: (data: Partial<ReservationData>) => void
  resetReservation: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  step: 'idle',
  reservation: {},

  setStep: (step) => set({ step }),

  setReservation: (data) =>
    set((state) => ({
      reservation: { ...state.reservation, ...data },
    })),

  resetReservation: () =>
    set({
      step: 'idle',
      reservation: {},
    }),

  addUserMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: nanoid(), text, role: 'user', timestamp: Date.now() },
      ],
    })),

  addBotResponse: (text, suggestions) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: nanoid(),
          text,
          role: 'bot',
          timestamp: Date.now(),
          suggestions,
        },
      ],
    })),
}))
