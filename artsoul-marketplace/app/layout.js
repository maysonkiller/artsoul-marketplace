import '../styles/globals.css'

export const metadata = {
  title: 'ArtSoul - Decentralized Art Marketplace',
  description: 'The Soul of Decentralized Art - Multi-chain auction platform for NFTs, real art, and digital creations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
