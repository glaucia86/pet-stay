import Link from 'next/link'
import { Search, Shield, Star, Heart, Clock, MapPin, DollarSign, Users } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 text-white section-padding overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              O Lar Perfeito para seu
              <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                Melhor Amigo
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-2xl mx-auto">
              Conecte-se com anfitriões verificados e encontre hospedagem de confiança para seu pet enquanto você viaja
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cidade ou Estado"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    placeholder="Data de Check-in"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <Link href="/search" className="btn-primary w-full py-3 text-lg flex items-center justify-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Buscar</span>
                </Link>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-300" />
                <span>Anfitriões Verificados</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span>Avaliações Reais</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-300" />
                <span>Cuidado com Amor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por que escolher o PetStay?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Oferecemos a melhor experiência para tutores e anfitriões de pets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Segurança Garantida',
                description: 'Todos os anfitriões são verificados e avaliados pela comunidade',
                color: 'from-green-400 to-green-600',
              },
              {
                icon: Star,
                title: 'Avaliações Reais',
                description: 'Sistema bilateral de reviews para total transparência',
                color: 'from-yellow-400 to-orange-600',
              },
              {
                icon: Heart,
                title: 'Cuidado Personalizado',
                description: 'Anfitriões dedicados que amam pets como você',
                color: 'from-pink-400 to-red-600',
              },
              {
                icon: MapPin,
                title: 'Localizações Diversas',
                description: 'Encontre hospedagem em todo o Brasil',
                color: 'from-blue-400 to-blue-600',
              },
              {
                icon: DollarSign,
                title: 'Preços Justos',
                description: 'Compare valores e escolha o melhor custo-benefício',
                color: 'from-purple-400 to-purple-600',
              },
              {
                icon: Users,
                title: 'Comunidade Ativa',
                description: 'Milhares de tutores e anfitriões conectados',
                color: 'from-indigo-400 to-indigo-600',
              },
            ].map((feature, index) => (
              <div key={index} className="card p-8 hover:scale-105 transition-transform">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Processo simples e seguro em apenas alguns passos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Cadastre-se', description: 'Crie sua conta gratuitamente' },
              { step: '2', title: 'Busque', description: 'Encontre o anfitrião ideal' },
              { step: '3', title: 'Reserve', description: 'Faça sua reserva segura' },
              { step: '4', title: 'Aproveite', description: 'Deixe seu pet em boas mãos' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary-600 to-purple-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de tutores e anfitriões que confiam no PetStay
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl">
              Cadastrar Gratuitamente
            </Link>
            <Link href="/become-host" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4">
              Seja um Anfitrião
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

