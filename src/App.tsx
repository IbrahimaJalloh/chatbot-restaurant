// src/App.tsx
import ChatWindow from './components/ChatWindow'

function App() {
  // Bouton "Recommencer" dans l'en-tête
  const handleResetClick = () => {
    const event = new CustomEvent<string>('chatbot:suggestion', {
      detail: 'Recommencer',
    })
    window.dispatchEvent(event)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center px-4">
      {/* CONTENEUR PRINCIPAL, largeur contrôlée ici */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* En-tête du chatbot */}
        <header className="px-6 py-5 border-b border-white/60 bg-gradient-to-r from-purple-600 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetClick}
              className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              aria-label="Recommencer la conversation"
            >
              <span className="text-xl">💬</span>
            </button>

            <div>
              <h1 className="text-xl font-semibold leading-tight">Le Gourmet</h1>
              <p className="text-xs text-purple-100">
                Assistant IA 24h/24 et 7j/7
              </p>
            </div>
          </div>
        </header>

        {/* Zone de chat seule */}
        <main className="p-4">
          <ChatWindow />
        </main>
      </div>
    </div>
  )
}

export default App
