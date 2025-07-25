'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Message {
  sender: 'user' | 'bot'
  text: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Load chat history from localStorage
  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    const stored = localStorage.getItem(`chat_${token}`)
    if (stored) {
      setMessages(JSON.parse(stored))
    }
  }, [router, token])

  const saveChat = (updatedMessages: Message[]) => {
    setMessages(updatedMessages)
    localStorage.setItem(`chat_${token}`, JSON.stringify(updatedMessages))
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { sender: 'user', text: input }
    const updated = [...messages, userMessage]
    saveChat(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(
        'http://localhost:8000/ask',
        { query: input },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const botMessage: Message = {
        sender: 'bot',
        text: (res.data as { summary: string }).summary,
      }
      saveChat([...updated, botMessage])
    } catch (err) {
      console.error(err)
      const errorMessage: Message = {
        sender: 'bot',
        text: '❌ Something went wrong. Please try again.',
      }
      saveChat([...updated, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-blue-600 text-white shadow">
        <h1 className="text-xl font-semibold">🧑‍⚖️ Legal Assistant</h1>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            router.push('/login')
          }}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-lg px-4 py-2 rounded-xl shadow text-white ${
              msg.sender === 'user'
                ? 'bg-blue-600 self-end'
                : 'bg-gray-700 self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-sm text-gray-500 italic">Typing...</div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t flex items-center space-x-2">
        <input
          type="text"
          className="flex-1 border rounded-lg px-4 py-2 outline-none"
          placeholder="Ask a legal question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  )
}
