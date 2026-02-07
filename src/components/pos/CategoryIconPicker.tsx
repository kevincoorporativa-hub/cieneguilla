import { 
  Pizza, Beef, UtensilsCrossed, Cake, Beer, Wine, GlassWater, Martini, 
  IceCream2, Package, Coffee, CupSoda, Sandwich, Salad, Soup, Cookie,
  Drumstick, Fish, Egg, Cherry, Apple, Citrus, Milk, Candy, Popcorn,
  Croissant, Wheat, Flame, Sparkles, ShoppingBag, Star, Heart,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface CategoryIconOption {
  name: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_ICONS: CategoryIconOption[] = [
  { name: 'pizza', label: 'Pizza', icon: Pizza },
  { name: 'beef', label: 'Carne', icon: Beef },
  { name: 'utensils', label: 'Menú', icon: UtensilsCrossed },
  { name: 'cake', label: 'Torta', icon: Cake },
  { name: 'beer', label: 'Cerveza', icon: Beer },
  { name: 'wine', label: 'Vino', icon: Wine },
  { name: 'glass-water', label: 'Vaso', icon: GlassWater },
  { name: 'martini', label: 'Cóctel', icon: Martini },
  { name: 'ice-cream', label: 'Helado', icon: IceCream2 },
  { name: 'coffee', label: 'Café', icon: Coffee },
  { name: 'cup-soda', label: 'Gaseosa', icon: CupSoda },
  { name: 'sandwich', label: 'Sándwich', icon: Sandwich },
  { name: 'salad', label: 'Ensalada', icon: Salad },
  { name: 'soup', label: 'Sopa', icon: Soup },
  { name: 'cookie', label: 'Galleta', icon: Cookie },
  { name: 'drumstick', label: 'Pollo', icon: Drumstick },
  { name: 'fish', label: 'Pescado', icon: Fish },
  { name: 'egg', label: 'Huevo', icon: Egg },
  { name: 'cherry', label: 'Cereza', icon: Cherry },
  { name: 'apple', label: 'Manzana', icon: Apple },
  { name: 'citrus', label: 'Cítrico', icon: Citrus },
  { name: 'milk', label: 'Leche', icon: Milk },
  { name: 'candy', label: 'Dulce', icon: Candy },
  { name: 'popcorn', label: 'Snack', icon: Popcorn },
  { name: 'croissant', label: 'Pan', icon: Croissant },
  { name: 'wheat', label: 'Trigo', icon: Wheat },
  { name: 'flame', label: 'Parrilla', icon: Flame },
  { name: 'sparkles', label: 'Especial', icon: Sparkles },
  { name: 'package', label: 'Paquete', icon: Package },
  { name: 'shopping-bag', label: 'Bolsa', icon: ShoppingBag },
  { name: 'star', label: 'Estrella', icon: Star },
  { name: 'heart', label: 'Favorito', icon: Heart },
];

/** Lookup a LucideIcon by its stored name. Falls back to Package. */
export function getIconByName(name: string | null | undefined): LucideIcon {
  if (!name) return Package;
  const found = CATEGORY_ICONS.find(i => i.name === name);
  return found?.icon ?? Package;
}

interface CategoryIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  color?: string;
}

export function CategoryIconPicker({ value, onChange, color = '#3b82f6' }: CategoryIconPickerProps) {
  return (
    <div className="space-y-2">
      <Label>Icono</Label>
      <ScrollArea className="h-[160px] rounded-lg border p-2">
        <div className="grid grid-cols-6 gap-2">
          {CATEGORY_ICONS.map((item) => {
            const Icon = item.icon;
            const isSelected = value === item.name;
            return (
              <button
                key={item.name}
                type="button"
                title={item.label}
                onClick={() => onChange(item.name)}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-lg transition-all',
                  'hover:bg-accent/50 active:scale-95',
                  isSelected && 'ring-2 ring-offset-1 ring-primary scale-105'
                )}
                style={isSelected ? { backgroundColor: `${color}20`, color } : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
