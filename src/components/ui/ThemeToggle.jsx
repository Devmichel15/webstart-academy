import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { Button } from './Button'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <Button variant="secondary" size="sm" onClick={toggleTheme} aria-label="Alternar tema">
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}
