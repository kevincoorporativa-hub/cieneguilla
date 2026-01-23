import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users, Shield, UserCheck, Truck, User } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User as UserType, UserRole, DeliveryDriver } from '@/types/pos';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserData {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  ultimoAcceso?: Date;
  createdAt: Date;
}

const demoUsers: UserData[] = [
  { id: '1', nombre: 'Carlos García', email: 'carlos@pizzapos.com', rol: 'admin', activo: true, ultimoAcceso: new Date(), createdAt: new Date() },
  { id: '2', nombre: 'Ana Torres', email: 'ana@pizzapos.com', rol: 'vendedor', activo: true, ultimoAcceso: new Date(Date.now() - 3600000), createdAt: new Date() },
  { id: '3', nombre: 'Luis Mendoza', email: 'luis@pizzapos.com', rol: 'vendedor', activo: true, ultimoAcceso: new Date(Date.now() - 86400000), createdAt: new Date() },
  { id: '4', nombre: 'María López', email: 'maria@pizzapos.com', rol: 'vendedor', activo: false, createdAt: new Date() },
];

const demoDrivers: DeliveryDriver[] = [
  { id: '1', nombre: 'Pedro Ruiz', telefono: '987654321', activo: true },
  { id: '2', nombre: 'Luis Gómez', telefono: '912345678', activo: true },
  { id: '3', nombre: 'Miguel Torres', telefono: '965432187', activo: false },
  { id: '4', nombre: 'Juan Pérez', telefono: '954321876', activo: true },
];

function getRoleBadge(rol: UserRole) {
  switch (rol) {
    case 'admin':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
          <Shield className="h-4 w-4" /> Administrador
        </span>
      );
    case 'vendedor':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-success/10 text-success">
          <UserCheck className="h-4 w-4" /> Vendedor
        </span>
      );
    case 'repartidor':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground">
          <Truck className="h-4 w-4" /> Repartidor
        </span>
      );
  }
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>(demoUsers);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>(demoDrivers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);

  // User form state
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRol, setFormRol] = useState<UserRole>('vendedor');
  const [formPassword, setFormPassword] = useState('');

  // Driver form state
  const [driverNombre, setDriverNombre] = useState('');
  const [driverTelefono, setDriverTelefono] = useState('');

  const filteredUsers = users.filter((u) =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenUserModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormNombre(user.nombre);
      setFormEmail(user.email);
      setFormRol(user.rol);
    } else {
      setEditingUser(null);
      setFormNombre('');
      setFormEmail('');
      setFormRol('vendedor');
      setFormPassword('');
    }
    setIsUserModalOpen(true);
  };

  const handleOpenDriverModal = (driver?: DeliveryDriver) => {
    if (driver) {
      setEditingDriver(driver);
      setDriverNombre(driver.nombre);
      setDriverTelefono(driver.telefono || '');
    } else {
      setEditingDriver(null);
      setDriverNombre('');
      setDriverTelefono('');
    }
    setIsDriverModalOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, nombre: formNombre, email: formEmail, rol: formRol }
          : u
      ));
      toast.success('Usuario actualizado');
    } else {
      const newUser: UserData = {
        id: crypto.randomUUID(),
        nombre: formNombre,
        email: formEmail,
        rol: formRol,
        activo: true,
        createdAt: new Date()
      };
      setUsers([...users, newUser]);
      toast.success('Usuario creado');
    }
    setIsUserModalOpen(false);
  };

  const handleSaveDriver = () => {
    if (editingDriver) {
      setDrivers(drivers.map(d => 
        d.id === editingDriver.id 
          ? { ...d, nombre: driverNombre, telefono: driverTelefono }
          : d
      ));
      toast.success('Repartidor actualizado');
    } else {
      const newDriver: DeliveryDriver = {
        id: crypto.randomUUID(),
        nombre: driverNombre,
        telefono: driverTelefono,
        activo: true
      };
      setDrivers([...drivers, newDriver]);
      toast.success('Repartidor creado');
    }
    setIsDriverModalOpen(false);
  };

  const handleToggleUserActive = (user: UserData) => {
    setUsers(users.map(u => u.id === user.id ? { ...u, activo: !u.activo } : u));
    toast.success(user.activo ? 'Usuario desactivado' : 'Usuario activado');
  };

  const handleToggleDriverActive = (driver: DeliveryDriver) => {
    setDrivers(drivers.map(d => d.id === driver.id ? { ...d, activo: !d.activo } : d));
    toast.success(driver.activo ? 'Repartidor desactivado' : 'Repartidor activado');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Usuarios y Empleados</h1>
            <p className="text-muted-foreground">Gestiona usuarios del sistema y repartidores</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-2 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total usuarios</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{users.filter(u => u.activo).length}</p>
              <p className="text-sm text-muted-foreground">Usuarios activos</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">{drivers.length}</p>
              <p className="text-sm text-muted-foreground">Repartidores</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{drivers.filter(d => d.activo).length}</p>
              <p className="text-sm text-muted-foreground">Repartidores activos</p>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted rounded-xl">
            <TabsTrigger value="usuarios" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-5 w-5 mr-2" />
              Usuarios del Sistema
            </TabsTrigger>
            <TabsTrigger value="repartidores" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Truck className="h-5 w-5 mr-2" />
              Repartidores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-6">
            {/* Search and Add */}
            <div className="flex gap-4">
              <Card className="flex-1 border-2">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 text-pos-base rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>
              <Button className="btn-pos h-auto" onClick={() => handleOpenUserModal()}>
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Usuario
              </Button>
            </div>

            {/* Users Table */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lista de Usuarios ({filteredUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-pos-base font-bold">Nombre</TableHead>
                      <TableHead className="text-pos-base font-bold">Email</TableHead>
                      <TableHead className="text-pos-base font-bold">Rol</TableHead>
                      <TableHead className="text-pos-base font-bold">Último acceso</TableHead>
                      <TableHead className="text-pos-base font-bold">Estado</TableHead>
                      <TableHead className="text-pos-base font-bold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell className="font-semibold text-pos-base">{user.nombre}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.rol)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.ultimoAcceso 
                            ? user.ultimoAcceso.toLocaleDateString('es-PE') 
                            : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            user.activo 
                              ? 'bg-success/10 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10"
                              onClick={() => handleOpenUserModal(user)}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-10 w-10 ${user.activo ? 'text-destructive' : 'text-success'}`}
                              onClick={() => handleToggleUserActive(user)}
                            >
                              {user.activo ? <Trash2 className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repartidores" className="space-y-6">
            <div className="flex justify-end">
              <Button className="btn-pos" onClick={() => handleOpenDriverModal()}>
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Repartidor
              </Button>
            </div>

            {/* Drivers Grid */}
            <div className="grid grid-cols-4 gap-4">
              {drivers.map((driver) => (
                <Card key={driver.id} className={`border-2 ${!driver.activo && 'opacity-60'}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      driver.activo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Truck className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-pos-lg">{driver.nombre}</h3>
                    <p className="text-muted-foreground">{driver.telefono}</p>
                    <div className="mt-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        driver.activo 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {driver.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOpenDriverModal(driver)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`flex-1 ${driver.activo ? 'text-destructive' : 'text-success'}`}
                        onClick={() => handleToggleDriverActive(driver)}
                      >
                        {driver.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* User Modal */}
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <User className="h-6 w-6" />
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Nombre completo</label>
                <Input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Nombre del usuario"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Email</label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Rol</label>
                <Select value={formRol} onValueChange={(v) => setFormRol(v as UserRole)}>
                  <SelectTrigger className="h-12 text-pos-base rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="repartidor">Repartidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Contraseña</label>
                  <Input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsUserModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 btn-pos bg-primary"
                  onClick={handleSaveUser}
                  disabled={!formNombre || !formEmail}
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Driver Modal */}
        <Dialog open={isDriverModalOpen} onOpenChange={setIsDriverModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <Truck className="h-6 w-6" />
                {editingDriver ? 'Editar Repartidor' : 'Nuevo Repartidor'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Nombre completo</label>
                <Input
                  value={driverNombre}
                  onChange={(e) => setDriverNombre(e.target.value)}
                  placeholder="Nombre del repartidor"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Teléfono</label>
                <Input
                  value={driverTelefono}
                  onChange={(e) => setDriverTelefono(e.target.value)}
                  placeholder="987654321"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsDriverModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 btn-pos bg-primary"
                  onClick={handleSaveDriver}
                  disabled={!driverNombre}
                >
                  {editingDriver ? 'Guardar Cambios' : 'Crear Repartidor'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}