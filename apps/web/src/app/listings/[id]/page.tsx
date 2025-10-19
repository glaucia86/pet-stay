'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  DollarSign,
  Star,
  Heart,
  Dog,
  Cat,
  Home,
  Check,
  X,
  MessageCircle,
  Calendar,
  User,
  Shield,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import api from '@/lib/api'

interface Listing {
  id: string
  title: string
  description: string
  pricePerDay: number
  currency: string
  maxPets: number
  acceptsDogs: boolean
  acceptsCats: boolean
  acceptsSmallPets: boolean
  acceptsMediumPets: boolean
  acceptsLargePets: boolean
  hasYard: boolean
  allowsWalks: boolean
  providesMedication: boolean
  photos: string[]
  policies?: string
  cancellationPolicy?: string
  isActive: boolean
  host: {
    id: string
    city?: string
    state?: string
    user: {
      id: string
      name: string
      avatarUrl?: string
      createdAt: string
    }
    subscription: {
      planName: string
    }
  }
  reviews: Array<{
    id: string
    rating: number
    comment?: string
    createdAt: string
    author: {
      name: string
      avatarUrl?: string
    }
  }>
  averageRating?: number
  reviewCount?: number
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [listingId])

  const fetchListing = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/v1/listings/${listingId}`)
      setListing(response.data)
    } catch (error) {
      console.error('Error fetching listing:', error)
      router.push('/search')
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    try {
      if (isFavorite) {
        await api.delete(`/v1/favorites/${listingId}`)
      } else {
        await api.post('/v1/favorites', { listingId })
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!listing) {
    return null
  }

  const memberSince = formatDate(listing.host.user.createdAt)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container-custom section-padding">
        {/* Back Button */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          ← Voltar para busca
        </Link>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
            {listing.photos.length > 0 ? (
              <img
                src={listing.photos[selectedImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Home className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {listing.photos.slice(0, 4).map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-video bg-gray-200 rounded-lg overflow-hidden ${
                  selectedImage === index ? 'ring-2 ring-primary-600' : ''
                }`}
              >
                <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Actions */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-5 h-5" />
                    {listing.host.city}, {listing.host.state}
                  </div>
                  {listing.averageRating && listing.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{listing.averageRating.toFixed(1)}</span>
                      <span>({listing.reviewCount} avaliações)</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleFavorite}
                className={`p-3 rounded-full ${
                  isFavorite ? 'text-pink-500 bg-pink-50' : 'text-gray-400 hover:text-pink-500 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Host Info */}
            <div className="card p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                  {listing.host.user.avatarUrl ? (
                    <img
                      src={listing.host.user.avatarUrl}
                      alt={listing.host.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{listing.host.user.name}</h3>
                  <p className="text-gray-600">Anfitrião desde {memberSince}</p>
                  {listing.host.subscription.planName === 'pro' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold mt-1">
                      <Shield className="w-4 h-4" />
                      Anfitrião PRO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre esta hospedagem</h2>
              <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
            </div>

            {/* What's Included */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">O que está incluído</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  {listing.acceptsDogs ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <div className="flex items-center gap-2">
                    <Dog className="w-5 h-5" />
                    <span>Aceita Cães</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {listing.acceptsCats ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <div className="flex items-center gap-2">
                    <Cat className="w-5 h-5" />
                    <span>Aceita Gatos</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {listing.hasYard ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    <span>Tem Quintal</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {listing.allowsWalks ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <span>Permite Passeios</span>
                </div>
                <div className="flex items-center gap-3">
                  {listing.providesMedication ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <span>Administra Medicação</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Máximo de {listing.maxPets} pets</span>
                </div>
              </div>

              {listing.acceptsSmallPets || listing.acceptsMediumPets || listing.acceptsLargePets ? (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Porte dos Pets Aceitos:</h3>
                  <div className="flex gap-2">
                    {listing.acceptsSmallPets && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        Pequeno
                      </span>
                    )}
                    {listing.acceptsMediumPets && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        Médio
                      </span>
                    )}
                    {listing.acceptsLargePets && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        Grande
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Policies */}
            {listing.policies && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Políticas e Regras</h2>
                <p className="text-gray-700 whitespace-pre-line">{listing.policies}</p>
              </div>
            )}

            {/* Cancellation Policy */}
            {listing.cancellationPolicy && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Política de Cancelamento</h2>
                <p className="text-gray-700 whitespace-pre-line">{listing.cancellationPolicy}</p>
              </div>
            )}

            {/* Reviews */}
            {listing.reviews && listing.reviews.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Avaliações</h2>
                <div className="space-y-6">
                  {listing.reviews.map((review) => (
                    <div key={review.id} className="card p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                          {review.author.avatarUrl ? (
                            <img
                              src={review.author.avatarUrl}
                              alt={review.author.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{review.author.name}</h4>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          {review.comment && <p className="text-gray-700">{review.comment}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(listing.pricePerDay)}
                  </span>
                  <span className="text-gray-600">/ dia</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <button className="btn-primary w-full mb-4 py-3 text-lg">Solicitar Reserva</button>
              
              <button className="btn border border-gray-300 text-gray-700 hover:bg-gray-50 w-full py-3 flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Enviar Mensagem
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Você não será cobrado ainda
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
