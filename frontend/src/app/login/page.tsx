'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/login', { email, password })
      const token = (res.data as { token: string }).token
      if (!token) {
        setError('Login failed. No token received.')
        return
      }
      localStorage.setItem('token', token)
      router.push('/chat')
    } catch {
      setError('Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>
      <input
        className="border p-2 w-64"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className="border p-2 w-64"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleLogin}
      >
        Login
      </button>
      <p>
        No account?{' '}
        <span
          className="text-blue-600 cursor-pointer"
          onClick={() => router.push('/register')}
        >
          Register
        </span>
      </p>
    </div>
  )
}
