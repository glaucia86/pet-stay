'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, Calendar, PawPrint, Home, TrendingUp, DollarSign } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import ProtectedRoute from '@/components/ProtectedRoute'
import { authService } from '@/lib/auth'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }

    loadUser()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1 bg-gray-50">
          <div className="container-custom section-padding">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Olá, {user?.name?.split(' ')[0] || 'Tutor'}! 👋
              </h1>
              <p className="text-gray-600">Gerencie suas reservas, pets e favoritos em um só lugar.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
                <p className="text-gray-600">Reservas Ativas</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
                <p className="text-gray-600">Favoritos</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <PawPrint className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
                <p className="text-gray-600">Meus Pets</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
                <p className="text-gray-600">Mensagens</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tutor Actions */}
              <div className="card p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações Rápidas - Tutor</h2>
                <div className="space-y-4">
                  <Link href="/search" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-100 p-3 rounded-lg group-hover:bg-primary-200 transition-colors">
                        <Home className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Buscar Hospedagem</h3>
                        <p className="text-sm text-gray-600">Encontre o lar perfeito para seu pet</p>
                      </div>
                    </div>
                    <span className="text-gray-400 group-hover:text-primary-600">→</span>
                  </Link>

                  <Link href="/dashboard/pets" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <PawPrint className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Gerenciar Pets</h3>
                        <p className="text-sm text-gray-600">Adicione ou edite seus pets</p>
                      </div>
                    </div>
                    <span className="text-gray-400 group-hover:text-primary-600">→</span>
                  </Link>

                  <Link href="/dashboard/bookings" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Minhas Reservas</h3>
                        <p className="text-sm text-gray-600">Veja e gerencie suas reservas</p>
                      </div>
                    </div>
                    <span className="text-gray-400 group-hover:text-primary-600">→</span>
                  </Link>

                  <Link href="/favorites" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="bg-pink-100 p-3 rounded-lg group-hover:bg-pink-200 transition-colors">
                        <Heart className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Meus Favoritos</h3>
                        <p className="text-sm text-gray-600">Acesse suas hospedagens favoritas</p>
                      </div>
                    </div>
                    <span className="text-gray-400 group-hover:text-primary-600">→</span>
                  </Link>
                </div>
              </div>

              {/* Host Actions */}
              <div className="card p-6 bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Seja um Anfitrião! 🏠</h2>
                <p className="text-gray-700 mb-6">
                  Compartilhe seu espaço e cuide de pets incríveis. Ganhe uma renda extra fazendo o que você ama!
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ganhe dinheiro extra</p>
                      <p className="text-sm text-gray-600">Defina seu próprio preço</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Flexibilidade total</p>
                      <p className="text-sm text-gray-600">Você controla sua agenda</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Suporte completo</p>
                      <p className="text-sm text-gray-600">Estamos aqui para ajudar</p>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard/host" className="btn-primary w-full mt-6 py-3 text-center">
                  Começar como Anfitrião
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
