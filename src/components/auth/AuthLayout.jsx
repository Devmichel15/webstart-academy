import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 p-4 dark:bg-brand-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className='flex w-full items-center justify-center'>

          <img src="/logo.svg" className='h-20' alt="" />
          </div>
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-brand-700 dark:text-brand-300">{subtitle}</p>
        </div>

        <div className="rounded-2xl border-3 border-brand-800 bg-white p-6 shadow-[6px_6px_0_0_#064e3b] dark:border-brand-400 dark:bg-brand-900 dark:shadow-[6px_6px_0_0_#34d399]">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-brand-600">
          <Link to="/" className="font-bold hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  )
}
