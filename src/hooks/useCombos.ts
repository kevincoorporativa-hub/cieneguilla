import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComboCompleto, ComboComponente } from '@/types/pos';

// Demo combos data - in a real app, this would come from Supabase
const demoCombos: ComboCompleto[] = [
  {
    id: 'c1',
    nombre: 'Combo Pizza + Gaseosa',
    descripcion: 'Pizza personal + Coca Cola 1L',
    componentes: [
      { productoId: '1', cantidad: 1, nombre: 'Pizza Margarita' },
      { productoId: '13', cantidad: 1, nombre: 'Coca Cola 1L' },
    ],
    precio: 32.00,
    activo: true,
    temporal: false,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'c2',
    nombre: 'Combo Pizza Familiar',
    descripcion: 'Pizza grande + 2 Gaseosas',
    componentes: [
      { productoId: '2', cantidad: 1, nombre: 'Pizza Pepperoni' },
      { productoId: '14', cantidad: 2, nombre: 'Inca Kola 1L' },
    ],
    precio: 42.00,
    activo: true,
    temporal: false,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'c3',
    nombre: 'Combo Cervezero',
    descripcion: 'Pizza + 3 Cervezas',
    componentes: [
      { productoId: '3', cantidad: 1, nombre: 'Pizza Hawaiana' },
      { productoId: '10', cantidad: 3, nombre: 'Cerveza Pilsen' },
    ],
    precio: 55.00,
    activo: true,
    temporal: true,
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-12-31'),
    createdAt: new Date('2024-01-20'),
  },
];

// In-memory store for combos (simulating a database)
let combosStore = [...demoCombos];

export function useCombos() {
  return useQuery({
    queryKey: ['combos'],
    queryFn: async () => {
      // Return only active combos
      return combosStore.filter(c => c.activo);
    },
  });
}

export function useAllCombos() {
  return useQuery({
    queryKey: ['combos', 'all'],
    queryFn: async () => {
      return combosStore;
    },
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (combo: Omit<ComboCompleto, 'id' | 'createdAt'>) => {
      const newCombo: ComboCompleto = {
        ...combo,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      combosStore = [...combosStore, newCombo];
      return newCombo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useUpdateCombo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (combo: ComboCompleto) => {
      combosStore = combosStore.map(c => 
        c.id === combo.id ? combo : c
      );
      return combo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useDeleteCombo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comboId: string) => {
      combosStore = combosStore.filter(c => c.id !== comboId);
      return comboId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}
