'use client'

export default function ThemeProvider({ theme, children }) {
  const themeClass = theme === 'brutal' ? 'theme-brutal' : 'theme-future'

  const bgColor = theme === 'brutal'
    ? 'bg-[#f5f5f5] text-[#1a1a1a]'
    : 'bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-[#e0e0ff]'

  return (
    <div className={`${themeClass} ${bgColor}`}>
      {children}
    </div>
  )
}
