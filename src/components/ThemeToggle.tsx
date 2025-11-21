import { Moon, Sun, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="relative"
        aria-label="Alternar tema"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Alternar tema</span>
      </Button>
      
      {user && (
        <Cloud 
          className="absolute -bottom-1 -right-1 h-3 w-3 text-primary" 
          aria-label="Sincronizado na nuvem"
        />
      )}
    </div>
  )
}
