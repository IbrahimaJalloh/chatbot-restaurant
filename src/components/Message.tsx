// src/components/Message.tsx
import { Clock, User, Bot } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Message as ChatMessage } from '../stores/chatStore'

interface MessageProps {
  message: ChatMessage
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'
  const MessageIcon = isUser ? User : Bot

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {/* Contenu du message */}
        <p className={`text-sm leading-relaxed ${isUser ? 'font-medium' : ''}`}>
          {message.text.split('\n').map((line, i) => (
            <span key={i}>
              {line || <br />}
            </span>
          ))}
        </p>

        {/* Ligne d'info (auteur + temps) */}
        <div
          className={`flex items-center gap-1 mt-2 opacity-75 ${
            isUser ? 'text-indigo-100' : 'text-gray-500'
          }`}
        >
          <Clock className="w-3 h-3" />
          <MessageIcon className="w-3 h-3" />
          <span className="text-xs">
            {formatDistanceToNow(new Date(message.timestamp), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
