import Link from 'next/link'
import { PawPrint, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-2 rounded-lg">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">PetStay</span>
            </div>
            <p className="text-sm text-gray-400">
              Conectando tutores e anfitriões de confiança para hospedagem de pets com segurança e carinho.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-primary-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Para Tutores */}
          <div>
            <h3 className="text-white font-semibold mb-4">Para Tutores</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="hover:text-primary-500 transition-colors">
                  Buscar Hospedagem
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-primary-500 transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-primary-500 transition-colors">
                  Meus Favoritos
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-primary-500 transition-colors">
                  Minhas Reservas
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Anfitriões */}
          <div>
            <h3 className="text-white font-semibold mb-4">Para Anfitriões</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/become-host" className="hover:text-primary-500 transition-colors">
                  Seja um Anfitrião
                </Link>
              </li>
              <li>
                <Link href="/host-guide" className="hover:text-primary-500 transition-colors">
                  Guia do Anfitrião
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary-500 transition-colors">
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link href="/dashboard/listings" className="hover:text-primary-500 transition-colors">
                  Meus Anúncios
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary-500" />
                <span>contato@petstay.com.br</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary-500" />
                <span>(11) 98765-4321</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span>São Paulo, SP - Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-gray-400">
            © {new Date().getFullYear()} PetStay. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-gray-400 hover:text-primary-500 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-primary-500 transition-colors">
              Privacidade
            </Link>
            <Link href="/help" className="text-gray-400 hover:text-primary-500 transition-colors">
              Ajuda
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
