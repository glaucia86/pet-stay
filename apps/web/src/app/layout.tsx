import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'PetStay — Hospedagem Confiável para seu Pet',
  description: 'Conecte-se com anfitriões verificados para hospedagem de cães e gatos. Encontre o lar perfeito para seu pet enquanto você viaja.',
  keywords: 'hospedagem de pets, hotel para cachorro, hotel para gato, pet sitter, cuidador de pets',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

