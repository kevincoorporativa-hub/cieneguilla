import { useState } from 'react';
import { Percent, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Discount, DiscountType } from '@/types/pos';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (discount: Discount) => void;
  currentTotal: number;
}

const discountTypes: { id: DiscountType; label: string; emoji: string }[] = [
  { id: 'empleado', label: 'Empleado', emoji: '👤' },
  { id: 'cumpleanos', label: 'Cumpleaños', emoji: '🎂' },
  { id: 'promocion', label: 'Promoción', emoji: '🏷️' },
];

export function DiscountModal({ isOpen, onClose, onApply, currentTotal }: DiscountModalProps) {
  const [selectedType, setSelectedType] = useState<DiscountType>('promocion');
  const [amount, setAmount] = useState('');

  const discountAmount = parseFloat(amount) || 0;
  const newTotal = Math.max(0, currentTotal - discountAmount);

  const handleApply = () => {
    if (discountAmount > 0) {
      onApply({
        tipo: selectedType,
        monto: discountAmount,
        descripcion: `Descuento ${selectedType}`,
      });
      onClose();
    }
  };

  const quickAmounts = [5, 10, 15, 20];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-pos-xl flex items-center gap-2">
            <Percent className="h-6 w-6" />
            Aplicar Descuento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Discount Type */}
          <div className="space-y-3">
            <label className="text-pos-base font-semibold">Tipo de descuento</label>
            <div className="grid grid-cols-3 gap-3">
              {discountTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedType === type.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">{type.emoji}</span>
                  <p className="font-semibold mt-2 text-sm">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <label className="text-pos-base font-semibold">Monto del descuento</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pos-lg font-bold text-muted-foreground">
                S/
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-12 h-16 text-pos-xl font-bold rounded-xl"
                max={currentTotal}
              />
            </div>
            <div className="flex gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  className="flex-1 h-12 font-bold"
                  onClick={() => setAmount(String(amt))}
                >
                  S/ {amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 p-4 bg-muted rounded-xl">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">S/ {currentTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Descuento:</span>
              <span className="font-semibold">- S/ {discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-pos-lg font-bold pt-2 border-t border-border">
              <span>Nuevo Total:</span>
              <span className="text-primary">S/ {newTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 btn-pos"
              onClick={onClose}
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
            <Button
              className="flex-1 btn-pos bg-success hover:bg-success/90"
              onClick={handleApply}
              disabled={discountAmount <= 0 || discountAmount > currentTotal}
            >
              <Check className="h-5 w-5 mr-2" />
              Aplicar Descuento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}