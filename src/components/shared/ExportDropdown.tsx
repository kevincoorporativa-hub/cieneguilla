import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportDropdownProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportDesignPDF?: () => void;
  disabled?: boolean;
}

export function ExportDropdown({
  onExportExcel,
  onExportPDF,
  onExportDesignPDF,
  disabled = false,
}: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="btn-pos" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onExportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-500" />
          Exportar a PDF
        </DropdownMenuItem>
        {onExportDesignPDF && (
          <DropdownMenuItem onClick={onExportDesignPDF} className="gap-2 cursor-pointer">
            <Image className="h-4 w-4 text-orange-500" />
            Descargar Gráficos (PDF)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
