 import { useState } from 'react';
 import { 
   Settings, 
   Palette,
   FileText,
   Bell,
   Save,
   Upload,
   ImageIcon,
   X,
   Eye,
   Check
 } from 'lucide-react';
 import { MainLayout } from '@/components/layout/MainLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Switch } from '@/components/ui/switch';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { toast } from 'sonner';
 import { TicketPrint, TicketConfig } from '@/components/pos/TicketPrint';
 import { useTheme, themeColors, sidebarColors } from '@/hooks/useTheme';
 import { ThemeColor } from '@/types/pos';
 
 export default function AjustesPage() {
   const { 
     currentTheme, 
     setTheme, 
     currentSidebarColor, 
     setSidebarColor,
     customPrimaryColor,
     setCustomPrimary,
     customSidebarColor,
     setCustomSidebar
   } = useTheme();
 
   // Business info (would be loaded from settings/context)
   const [businessName] = useState('PizzaPOS');
   const [businessAddress] = useState('Av. Principal 123, Lima');
   const [businessPhone] = useState('01-234-5678');
   const [businessRuc] = useState('20123456789');
 
   // Notifications
   const [notifyLowStock, setNotifyLowStock] = useState(true);
   const [notifyLicenseExpiry, setNotifyLicenseExpiry] = useState(true);
   const [notifySales, setNotifySales] = useState(false);
 
   // Ticket configuration
   const [ticketLogoUrl, setTicketLogoUrl] = useState('');
   const [ticketPromoText, setTicketPromoText] = useState('¡Pide 2 pizzas y llévate una gaseosa gratis!');
   const [ticketFooterText, setTicketFooterText] = useState('¡Gracias por su preferencia!');
   const [showTicketPreview, setShowTicketPreview] = useState(false);
 
   const handleSave = () => {
     toast.success('Ajustes guardados');
   };
 
   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         setTicketLogoUrl(reader.result as string);
         toast.success('Logo cargado');
       };
       reader.readAsDataURL(file);
     }
   };
 
   const ticketConfig: TicketConfig = {
     logoUrl: ticketLogoUrl,
     businessName,
     businessAddress,
     businessPhone,
     businessRuc,
     promoText: ticketPromoText,
     footerText: ticketFooterText,
   };
 
   // Demo data for preview
   const demoItems = [
     { id: '1', type: 'product' as const, nombre: 'Pizza Pepperoni', cantidad: 2, precioUnitario: 32, subtotal: 64 },
     { id: '2', type: 'product' as const, nombre: 'Coca Cola 1L', cantidad: 1, precioUnitario: 7, subtotal: 7 },
   ];
 
   return (
     <MainLayout>
       <div className="space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-pos-2xl font-bold">Ajustes</h1>
             <p className="text-muted-foreground">Personaliza tu experiencia</p>
           </div>
           <Button className="btn-pos" onClick={handleSave}>
             <Save className="h-5 w-5 mr-2" />
             Guardar Cambios
           </Button>
         </div>
 
         <Tabs defaultValue="apariencia" className="space-y-6">
           <TabsList className="h-14 p-1 bg-muted rounded-xl">
             <TabsTrigger value="apariencia" className="h-12 px-4 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
               <Palette className="h-5 w-5 mr-2" />
               Apariencia
             </TabsTrigger>
             <TabsTrigger value="ticket" className="h-12 px-4 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
               <FileText className="h-5 w-5 mr-2" />
               Ticket
             </TabsTrigger>
             <TabsTrigger value="notificaciones" className="h-12 px-4 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
               <Bell className="h-5 w-5 mr-2" />
               Notificaciones
             </TabsTrigger>
           </TabsList>
 
           {/* Tab: Apariencia / Tema */}
           <TabsContent value="apariencia">
             <div className="space-y-6 max-w-4xl">
               {/* Tema de colores principales */}
               <Card className="border-2">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Palette className="h-5 w-5" />
                     Tema de Colores Principal
                   </CardTitle>
                   <CardDescription>
                     Personaliza el color principal de botones y acentos
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="grid grid-cols-3 gap-4">
                     {(Object.keys(themeColors) as ThemeColor[]).map((themeId) => {
                       const theme = themeColors[themeId];
                       const isSelected = currentTheme === themeId;
                       return (
                         <button
                           key={themeId}
                           onClick={() => {
                             setTheme(themeId);
                             toast.success(`Tema "${theme.name}" aplicado`);
                           }}
                           className={`relative p-4 rounded-xl border-2 transition-all ${
                             isSelected 
                               ? 'border-primary ring-2 ring-primary/30' 
                               : 'border-border hover:border-primary/50'
                           }`}
                         >
                           {isSelected && (
                             <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                               <Check className="h-4 w-4 text-primary-foreground" />
                             </div>
                           )}
                           <div className="flex gap-2 mb-3">
                             <div 
                               className="w-8 h-8 rounded-full" 
                               style={{ backgroundColor: `hsl(${theme.primary})` }}
                             />
                             <div 
                               className="w-8 h-8 rounded-full" 
                               style={{ backgroundColor: `hsl(${theme.secondary})` }}
                             />
                             <div 
                               className="w-8 h-8 rounded-full" 
                               style={{ backgroundColor: `hsl(${theme.accent})` }}
                             />
                           </div>
                           <p className="font-semibold text-sm text-left">{theme.name}</p>
                         </button>
                       );
                     })}
                     
                     {/* Custom color option */}
                     <button
                       onClick={() => {
                         setTheme('custom');
                         toast.success('Color personalizado activado');
                       }}
                       className={`relative p-4 rounded-xl border-2 transition-all ${
                         currentTheme === 'custom' 
                           ? 'border-primary ring-2 ring-primary/30' 
                           : 'border-border hover:border-primary/50'
                       }`}
                     >
                       {currentTheme === 'custom' && (
                         <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                           <Check className="h-4 w-4 text-primary-foreground" />
                         </div>
                       )}
                       <div className="flex gap-2 mb-3 items-center">
                         <div 
                           className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground"
                           style={{ backgroundColor: customPrimaryColor }}
                         />
                         <span className="text-xl">🎨</span>
                       </div>
                       <p className="font-semibold text-sm text-left">Personalizado</p>
                     </button>
                   </div>
 
                   {/* Custom color picker */}
                   {currentTheme === 'custom' && (
                     <div className="p-4 bg-muted rounded-xl space-y-3">
                       <label className="text-sm font-semibold">Elige tu color principal:</label>
                       <div className="flex items-center gap-4">
                         <input
                           type="color"
                           value={customPrimaryColor}
                           onChange={(e) => setCustomPrimary(e.target.value)}
                           className="w-16 h-12 rounded-lg cursor-pointer border-2 border-border"
                         />
                         <Input
                           value={customPrimaryColor}
                           onChange={(e) => {
                             if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                               setCustomPrimary(e.target.value);
                             }
                           }}
                           placeholder="#f97316"
                           className="w-32 h-12 font-mono uppercase"
                         />
                         <div 
                           className="flex-1 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
                           style={{ backgroundColor: customPrimaryColor }}
                         >
                           Vista previa
                         </div>
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
 
               {/* Color del Sidebar */}
               <Card className="border-2">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Palette className="h-5 w-5" />
                     Color del Menú Lateral (Sidebar)
                   </CardTitle>
                   <CardDescription>
                     Cambia el color de fondo del menú lateral izquierdo
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-4 gap-3">
                     {Object.keys(sidebarColors).map((colorId) => {
                       const color = sidebarColors[colorId];
                       const isSelected = currentSidebarColor === colorId;
                       return (
                         <button
                           key={colorId}
                           onClick={() => {
                             setSidebarColor(colorId);
                             toast.success(`Color de sidebar "${color.name}" aplicado`);
                           }}
                           className={`relative p-3 rounded-xl border-2 transition-all ${
                             isSelected 
                               ? 'border-primary ring-2 ring-primary/30' 
                               : 'border-border hover:border-primary/50'
                           }`}
                         >
                           {isSelected && (
                             <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                               <Check className="h-3 w-3 text-primary-foreground" />
                             </div>
                           )}
                           <div 
                             className="w-full h-12 rounded-lg mb-2 border"
                             style={{ backgroundColor: `hsl(${color.background})` }}
                           >
                             <div className="p-2 flex flex-col gap-1">
                               <div 
                                 className="h-1.5 w-8 rounded"
                                 style={{ backgroundColor: `hsl(${color.foreground})` }}
                               />
                               <div 
                                 className="h-1.5 w-6 rounded opacity-60"
                                 style={{ backgroundColor: `hsl(${color.foreground})` }}
                               />
                             </div>
                           </div>
                           <p className="font-medium text-xs text-center truncate">{color.name}</p>
                         </button>
                       );
                     })}
 
                     {/* Custom sidebar color option */}
                     <button
                       onClick={() => {
                         setSidebarColor('custom');
                         toast.success('Color de sidebar personalizado activado');
                       }}
                       className={`relative p-3 rounded-xl border-2 transition-all ${
                         currentSidebarColor === 'custom' 
                           ? 'border-primary ring-2 ring-primary/30' 
                           : 'border-border hover:border-primary/50'
                       }`}
                     >
                       {currentSidebarColor === 'custom' && (
                         <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                           <Check className="h-3 w-3 text-primary-foreground" />
                         </div>
                       )}
                       <div 
                         className="w-full h-12 rounded-lg mb-2 border-2 border-dashed border-muted-foreground flex items-center justify-center"
                         style={{ backgroundColor: customSidebarColor }}
                       >
                         <span className="text-lg">🎨</span>
                       </div>
                       <p className="font-medium text-xs text-center truncate">Personalizado</p>
                     </button>
                   </div>
 
                   {/* Custom sidebar color picker */}
                   {currentSidebarColor === 'custom' && (
                     <div className="p-4 bg-muted rounded-xl space-y-3">
                       <label className="text-sm font-semibold">Elige tu color de sidebar:</label>
                       <div className="flex items-center gap-4">
                         <input
                           type="color"
                           value={customSidebarColor}
                           onChange={(e) => setCustomSidebar(e.target.value)}
                           className="w-16 h-12 rounded-lg cursor-pointer border-2 border-border"
                         />
                         <Input
                           value={customSidebarColor}
                           onChange={(e) => {
                             if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                               setCustomSidebar(e.target.value);
                             }
                           }}
                           placeholder="#1a1a2e"
                           className="w-32 h-12 font-mono uppercase"
                         />
                         <div 
                           className="flex-1 h-12 rounded-xl flex items-center justify-center font-semibold border"
                           style={{ 
                             backgroundColor: customSidebarColor,
                             color: parseInt(customSidebarColor.slice(1), 16) > 0x7FFFFF ? '#1a1a2e' : '#ffffff'
                           }}
                         >
                           Vista previa
                         </div>
                       </div>
                     </div>
                   )}
 
                   <div className="p-4 bg-muted rounded-xl">
                     <p className="text-sm text-muted-foreground">
                       💡 Los cambios de apariencia se aplican inmediatamente y se guardan para futuras sesiones.
                     </p>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </TabsContent>
 
           <TabsContent value="ticket">
             <div className="grid grid-cols-2 gap-6">
               <Card className="border-2">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <FileText className="h-5 w-5" />
                     Diseño del Ticket
                   </CardTitle>
                   <CardDescription>
                     Personaliza la apariencia de tus tickets de venta
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   {/* Logo upload */}
                   <div className="space-y-2">
                     <label className="text-pos-base font-semibold">Logo de la empresa</label>
                     <div className="flex items-start gap-4">
                       {ticketLogoUrl ? (
                         <div className="relative">
                           <img 
                             src={ticketLogoUrl} 
                             alt="Logo" 
                             className="w-20 h-20 object-contain border-2 rounded-xl bg-white"
                           />
                           <Button
                             variant="ghost"
                             size="icon"
                             className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
                             onClick={() => setTicketLogoUrl('')}
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ) : (
                         <div className="w-20 h-20 border-2 border-dashed rounded-xl flex items-center justify-center bg-muted">
                           <ImageIcon className="h-8 w-8 text-muted-foreground" />
                         </div>
                       )}
                       <div className="flex-1">
                         <label className="cursor-pointer">
                           <Input
                             type="file"
                             accept="image/*"
                             className="hidden"
                             onChange={handleLogoUpload}
                           />
                           <div className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
                             <Upload className="h-4 w-4" />
                             <span className="text-sm font-medium">Subir logo</span>
                           </div>
                         </label>
                         <p className="text-xs text-muted-foreground mt-2">
                           Recomendado: 200x200px, PNG o JPG
                         </p>
                       </div>
                     </div>
                   </div>
 
                   {/* Promotion text */}
                   <div className="space-y-2">
                     <label className="text-pos-base font-semibold">Texto de promoción</label>
                     <Textarea
                       value={ticketPromoText}
                       onChange={(e) => setTicketPromoText(e.target.value)}
                       placeholder="Ej: ¡Pide 2 pizzas y lleva la 3ra gratis!"
                       className="min-h-[80px] rounded-xl"
                     />
                     <p className="text-xs text-muted-foreground">
                       Deja vacío para no mostrar promoción
                     </p>
                   </div>
 
                   {/* Footer text */}
                   <div className="space-y-2">
                     <label className="text-pos-base font-semibold">Texto de pie de ticket</label>
                     <Input
                       value={ticketFooterText}
                       onChange={(e) => setTicketFooterText(e.target.value)}
                       placeholder="¡Gracias por su preferencia!"
                       className="h-12 text-pos-base rounded-xl"
                     />
                   </div>
 
                   <Button 
                     variant="outline" 
                     className="w-full btn-pos"
                     onClick={() => setShowTicketPreview(true)}
                   >
                     <Eye className="h-5 w-5 mr-2" />
                     Ver Vista Previa
                   </Button>
                 </CardContent>
               </Card>
 
               {/* Info Card */}
               <Card className="border-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                     <FileText className="h-5 w-5" />
                     Información del Ticket
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4 text-blue-700 dark:text-blue-300">
                   <div>
                     <h4 className="font-semibold mb-2">El ticket incluirá:</h4>
                     <ul className="list-disc list-inside space-y-1 text-sm">
                       <li>Logo de tu empresa (opcional)</li>
                       <li>Nombre del negocio</li>
                       <li>Dirección y teléfono</li>
                       <li>RUC (si está configurado)</li>
                       <li>Número de ticket y fecha/hora</li>
                       <li>Tipo de pedido (Local/Llevar/Delivery)</li>
                       <li>Detalle de productos</li>
                       <li>Subtotal, descuentos y total</li>
                       <li>Método de pago y vuelto</li>
                       <li>Mensaje promocional</li>
                       <li>Mensaje de agradecimiento</li>
                     </ul>
                   </div>
 
                   <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                     <p className="text-sm font-medium">
                       💡 Tip: Un buen diseño de ticket puede aumentar la fidelización de clientes
                     </p>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </TabsContent>
 
           <TabsContent value="notificaciones">
             <Card className="border-2 max-w-2xl">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Bell className="h-5 w-5" />
                   Notificaciones
                 </CardTitle>
                 <CardDescription>
                   Configura las alertas del sistema
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                   <div>
                     <p className="font-semibold">Alerta de stock bajo</p>
                     <p className="text-sm text-muted-foreground">Notificar cuando un producto tenga stock bajo</p>
                   </div>
                   <Switch checked={notifyLowStock} onCheckedChange={setNotifyLowStock} />
                 </div>
 
                 <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                   <div>
                     <p className="font-semibold">Vencimiento de licencia</p>
                     <p className="text-sm text-muted-foreground">Alertar 7, 3 y 1 día antes del vencimiento</p>
                   </div>
                   <Switch checked={notifyLicenseExpiry} onCheckedChange={setNotifyLicenseExpiry} />
                 </div>
 
                 <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                   <div>
                     <p className="font-semibold">Resumen de ventas</p>
                     <p className="text-sm text-muted-foreground">Notificación al cerrar caja</p>
                   </div>
                   <Switch checked={notifySales} onCheckedChange={setNotifySales} />
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
 
         {/* Ticket Preview Modal */}
         <Dialog open={showTicketPreview} onOpenChange={setShowTicketPreview}>
           <DialogContent className="max-w-md">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <Eye className="h-5 w-5" />
                 Vista Previa del Ticket
               </DialogTitle>
             </DialogHeader>
             <div className="bg-gray-100 p-4 rounded-xl max-h-[60vh] overflow-auto">
               <TicketPrint
                 ticketNumber="T001234"
                 items={demoItems}
                 subtotal={71}
                 total={71}
                 paymentMethod="efectivo"
                 cashReceived={100}
                 change={29}
                 orderType="local"
                 config={ticketConfig}
                 date={new Date()}
               />
             </div>
           </DialogContent>
         </Dialog>
       </div>
     </MainLayout>
   );
 }