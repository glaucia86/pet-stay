'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Heart, MessageSquare, User, LogOut, PawPrint } from 'lucide-react'
import { authService } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      
      if (authenticated) {
        const storedUser = authService.getStoredUser()
        setUser(storedUser)
      }
    }

    checkAuth()
    window.addEventListener('storage', checkAuth)
    
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    setIsAuthenticated(false)
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              PetStay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/search" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Buscar Hospedagem
            </Link>
            <Link href="/become-host" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Seja um Anfitrião
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/favorites" className="text-gray-700 hover:text-primary-600 transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link href="/messages" className="text-gray-700 hover:text-primary-600 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <span className="font-medium">{user?.name}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Meu Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                  Entrar
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Cadastrar
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link href="/search" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              Buscar Hospedagem
            </Link>
            <Link href="/become-host" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              Seja um Anfitrião
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/favorites" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Favoritos
                </Link>
                <Link href="/messages" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Mensagens
                </Link>
                <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Dashboard
                </Link>
                <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Meu Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 rounded-lg"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Entrar
                </Link>
                <Link href="/auth/register" className="block px-4 py-2">
                  <span className="btn-primary w-full text-center">Cadastrar</span>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
