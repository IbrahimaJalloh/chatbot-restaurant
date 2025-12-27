// src/components/ChatWindow.tsx
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import Message from './Message'
import { useChatStore } from '../stores/chatStore'
import MessageInput from './MessageInput'

export default function ChatWindow() {
  const { messages } = useChatStore()
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  // Quand on clique sur une suggestion, on délègue à MessageInput via un event custom.
  // Ici on se contente de déclencher un CustomEvent, que MessageInput écoutera si tu veux.
  // Le plus simple : on passe une fonction via props → mais ton MessageInput est séparé.
  // Solution directe : on remonte le clic au store via un event custom sur window.

  const handleSuggestionClick = (suggestion: string) => {
    const event = new CustomEvent('chatbot:suggestion', { detail: suggestion })
    window.dispatchEvent(event)
  }

  return (
    <div className="h-[500px] flex flex-col">
      <div
        ref={chatRef}
        className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-transparent to-gray-50/50"
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium">Démarrez la conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Message message={message} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Input en bas */}
      <MessageInput />
    </div>
  )
}
