import { Check, Moon, Sun, Contrast, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"

const themes = [
  { value: 'light', label: 'Claro', icon: Sun, description: 'Tema claro padrão' },
  { value: 'dark', label: 'Escuro', icon: Moon, description: 'Tema escuro padrão' },
  { value: 'high-contrast', label: 'Alto Contraste', icon: Contrast, description: 'Preto e branco para máxima legibilidade' },
  { value: 'colorblind', label: 'Para Daltônicos', icon: Eye, description: 'Paleta azul e laranja acessível' },
]

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const currentTheme = themes.find(t => t.value === theme) || themes[0]
  const Icon = currentTheme.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Selecionar tema"
        >
          <Icon className="h-5 w-5" />
          {user && (
            <div 
              className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full" 
              aria-label="Sincronizado"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Tema de Acessibilidade</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon
          const isActive = theme === themeOption.value
          
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="flex items-start gap-3 cursor-pointer py-3"
            >
              <ThemeIcon className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{themeOption.label}</span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {themeOption.description}
                </p>
              </div>
            </DropdownMenuItem>
          )
        })}
        {user && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground">
              ✓ Sincronizado em todos os dispositivos
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
