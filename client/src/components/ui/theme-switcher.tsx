import React, { useState, useEffect } from 'react';
import { Check, Palette } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Theme = 'default' | 'dark-comic' | 'vintage-press' | 'superhero' | 'manga-studio' | 'golden-age' | 'midnight' | 'deep-space';

const themes: { name: string; id: Theme; description: string }[] = [
  { 
    name: 'Default', 
    id: 'default',
    description: 'The original Comic Editor Pro theme'
  },
  { 
    name: 'Dark Comic', 
    id: 'dark-comic',
    description: 'Dark theme with vibrant accent colors'
  },
  { 
    name: 'Vintage Press', 
    id: 'vintage-press',
    description: 'Classic, warm tones inspired by vintage comics'
  },
  { 
    name: 'Modern Superhero', 
    id: 'superhero',
    description: 'Bold, high-contrast colors for modern projects'
  },
  { 
    name: 'Manga Studio', 
    id: 'manga-studio',
    description: 'Clean, focused black and blue theme'
  },
  { 
    name: 'Golden Age', 
    id: 'golden-age',
    description: 'Rich, nostalgic colors from the golden age of comics'
  },
  { 
    name: 'Midnight Editor', 
    id: 'midnight',
    description: 'Dark blue UI with cyan and magenta accents'
  },
  { 
    name: 'Deep Space', 
    id: 'deep-space',
    description: 'Dark purple space theme with cool color highlights'
  }
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('default');
  const { toast } = useToast();

  // Load saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('comic-editor-theme') as Theme | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Apply the theme to the document
  const applyTheme = (themeId: Theme) => {
    // First, remove any existing theme classes
    document.body.classList.remove(...themes.map(t => `theme-${t.id}`));
    
    // Add the new theme class to the body element
    if (themeId !== 'default') {
      document.body.classList.add(`theme-${themeId}`);
    }
    
    // Save the theme preference
    localStorage.setItem('comic-editor-theme', themeId);
  };

  const handleThemeChange = (themeId: Theme) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    
    const themeName = themes.find(t => t.id === themeId)?.name || 'Default';
    toast({
      title: `Theme Changed: ${themeName}`,
      description: "Your theme preference has been saved",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden md:inline-block">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span>{theme.name}</span>
              <span className="text-xs text-muted-foreground">{theme.description}</span>
            </div>
            {currentTheme === theme.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}