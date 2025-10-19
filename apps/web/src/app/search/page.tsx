'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, MapPin, DollarSign, Star, Heart, Dog, Cat, Home } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import api from '@/lib/api'

interface Listing {
  id: string
  title: string
  description: string
  pricePerDay: number
  photos: string[]
  averageRating: number
  reviewCount: number
  distance?: number | null
  acceptsDogs: boolean
  acceptsCats: boolean
  hasYard: boolean
  host: {
    user: {
      name: string
      avatarUrl?: string
    }
    subscription: {
      planName: string
    }
  }
}

interface SearchFilters {
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  acceptsDogs?: boolean
  acceptsCats?: boolean
  petSize?: 'small' | 'medium' | 'large'
  hasYard?: boolean
  allowsWalks?: boolean
  providesMedication?: boolean
  startDate?: string
  endDate?: string
  minRating?: number
  sortBy?: 'price' | 'distance' | 'rating' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const [filters, setFilters] = useState<SearchFilters>({
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  useEffect(() => {
    searchListings()
  }, [])

  const searchListings = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.city) params.append('city', filters.city)
      if (filters.state) params.append('state', filters.state)
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.acceptsDogs !== undefined) params.append('acceptsDogs', filters.acceptsDogs.toString())
      if (filters.acceptsCats !== undefined) params.append('acceptsCats', filters.acceptsCats.toString())
      if (filters.petSize) params.append('petSize', filters.petSize)
      if (filters.hasYard !== undefined) params.append('hasYard', filters.hasYard.toString())
      if (filters.allowsWalks !== undefined) params.append('allowsWalks', filters.allowsWalks.toString())
      if (filters.providesMedication !== undefined) params.append('providesMedication', filters.providesMedication.toString())
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.minRating) params.append('minRating', filters.minRating.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await api.get(`/v1/search?${params.toString()}`)
      setListings(response.data.listings)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error searching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    searchListings(1)
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container-custom section-padding">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Buscar Hospedagem</h1>
          <p className="text-xl text-gray-600">
            Encontre o lar perfeito para seu pet
          </p>
        </div>

        {/* Search Bar */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                placeholder="Ex: SP"
                value={filters.state || ''}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
            <button
              onClick={handleSearch}
              className="btn-primary flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Buscar
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Filtros Avançados</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <h4 className="font-medium mb-2">Faixa de Preço (por dia)</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) * 100 : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) * 100 : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Pet Types */}
                <div>
                  <h4 className="font-medium mb-2">Tipo de Pet</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.acceptsDogs || false}
                        onChange={(e) => handleFilterChange('acceptsDogs', e.target.checked)}
                        className="rounded"
                      />
                      <Dog className="w-5 h-5" />
                      <span>Aceita Cães</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.acceptsCats || false}
                        onChange={(e) => handleFilterChange('acceptsCats', e.target.checked)}
                        className="rounded"
                      />
                      <Cat className="w-5 h-5" />
                      <span>Aceita Gatos</span>
                    </label>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="font-medium mb-2">Comodidades</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.hasYard || false}
                        onChange={(e) => handleFilterChange('hasYard', e.target.checked)}
                        className="rounded"
                      />
                      <Home className="w-5 h-5" />
                      <span>Tem Quintal</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.allowsWalks || false}
                        onChange={(e) => handleFilterChange('allowsWalks', e.target.checked)}
                        className="rounded"
                      />
                      <span>Permite Passeios</span>
                    </label>
                  </div>
                </div>

                {/* Pet Size */}
                <div>
                  <h4 className="font-medium mb-2">Porte do Pet</h4>
                  <select
                    value={filters.petSize || ''}
                    onChange={(e) => handleFilterChange('petSize', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Todos</option>
                    <option value="small">Pequeno</option>
                    <option value="medium">Médio</option>
                    <option value="large">Grande</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="font-medium mb-2">Avaliação Mínima</h4>
                  <select
                    value={filters.minRating || ''}
                    onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Todas</option>
                    <option value="3">3+ estrelas</option>
                    <option value="4">4+ estrelas</option>
                    <option value="5">5 estrelas</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <h4 className="font-medium mb-2">Ordenar Por</h4>
                  <select
                    value={filters.sortBy || 'createdAt'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="createdAt">Mais Recentes</option>
                    <option value="price">Preço</option>
                    <option value="rating">Avaliação</option>
                    <option value="distance">Distância</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Buscando hospedagens...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {pagination.total} {pagination.total === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </p>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12 card">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhuma hospedagem encontrada
                </h3>
                <p className="text-gray-600">
                  Tente ajustar seus filtros de busca
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="card overflow-hidden hover:scale-105 transition-transform"
                  >
                    {/* Image */}
                    <div className="aspect-video bg-gray-200 relative">
                      {listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Home className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {listing.host.subscription.planName === 'pro' && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          PRO
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 flex-1">
                          {listing.title}
                        </h3>
                        <button className="text-gray-400 hover:text-pink-500">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                        {listing.acceptsDogs && (
                          <span className="flex items-center gap-1">
                            <Dog className="w-4 h-4" />
                            Cães
                          </span>
                        )}
                        {listing.acceptsCats && (
                          <span className="flex items-center gap-1">
                            <Cat className="w-4 h-4" />
                            Gatos
                          </span>
                        )}
                        {listing.hasYard && (
                          <span className="flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Quintal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-semibold">
                              {listing.averageRating > 0 ? listing.averageRating.toFixed(1) : 'Novo'}
                            </span>
                            {listing.reviewCount > 0 && (
                              <span className="text-sm text-gray-600">
                                ({listing.reviewCount})
                              </span>
                            )}
                          </div>
                          {listing.distance !== null && listing.distance !== undefined && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <MapPin className="w-3 h-3" />
                              {listing.distance.toFixed(1)} km
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">
                            {formatPrice(listing.pricePerDay)}
                          </div>
                          <div className="text-sm text-gray-600">por dia</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => searchListings(page)}
                    className={`px-4 py-2 rounded-lg ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
