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
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useToggleEmployeeActive,
  Employee,
} from '@/hooks/useEmployees';

type RoleType = 'admin' | 'manager' | 'cashier' | 'kitchen' | 'delivery';

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
          <Shield className="h-4 w-4" /> Administrador
        </span>
      );
    case 'manager':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-accent/20 text-accent-foreground">
          <UserCheck className="h-4 w-4" /> Gerente
        </span>
      );
    case 'cashier':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-success/10 text-success">
          <UserCheck className="h-4 w-4" /> Vendedor
        </span>
      );
    case 'kitchen':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-warning/10 text-warning">
          <User className="h-4 w-4" /> Cocina
        </span>
      );
    case 'delivery':
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground">
          <Truck className="h-4 w-4" /> Repartidor
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-muted text-muted-foreground">
          <User className="h-4 w-4" /> Usuario
        </span>
      );
  }
}

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form state
  const [formNombre, setFormNombre] = useState('');
  const [formApellido, setFormApellido] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRol, setFormRol] = useState<RoleType>('cashier');

  // Hooks
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const toggleActive = useToggleEmployeeActive();

  // Filter employees
  const systemUsers = employees.filter(e => e.role !== 'delivery');
  const drivers = employees.filter(e => e.role === 'delivery');

  const filteredUsers = systemUsers.filter(
    (e) =>
      e.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenUserModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormNombre(employee.first_name);
      setFormApellido(employee.last_name);
      setFormEmail(employee.email || '');
      setFormTelefono(employee.phone || '');
      setFormRol((employee.role as RoleType) || 'cashier');
    } else {
      setEditingEmployee(null);
      setFormNombre('');
      setFormApellido('');
      setFormEmail('');
      setFormTelefono('');
      setFormRol('cashier');
    }
    setIsUserModalOpen(true);
  };

  const handleOpenDriverModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormNombre(employee.first_name);
      setFormApellido(employee.last_name);
      setFormTelefono(employee.phone || '');
    } else {
      setEditingEmployee(null);
      setFormNombre('');
      setFormApellido('');
      setFormTelefono('');
    }
    setIsDriverModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formNombre || !formApellido) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee.mutateAsync({
          id: editingEmployee.id,
          first_name: formNombre,
          last_name: formApellido,
          email: formEmail,
          phone: formTelefono,
        });
        toast.success('Usuario actualizado');
      } else {
        await createEmployee.mutateAsync({
          first_name: formNombre,
          last_name: formApellido,
          email: formEmail,
          phone: formTelefono,
          role: formRol,
        });
        toast.success('Usuario creado');
      }
      setIsUserModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar', { description: error.message });
    }
  };

  const handleSaveDriver = async () => {
    if (!formNombre || !formApellido) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee.mutateAsync({
          id: editingEmployee.id,
          first_name: formNombre,
          last_name: formApellido,
          phone: formTelefono,
        });
        toast.success('Repartidor actualizado');
      } else {
        await createEmployee.mutateAsync({
          first_name: formNombre,
          last_name: formApellido,
          phone: formTelefono,
          role: 'delivery',
        });
        toast.success('Repartidor creado');
      }
      setIsDriverModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar', { description: error.message });
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      await toggleActive.mutateAsync({ id: employee.id, active: !employee.active });
      toast.success(employee.active ? 'Usuario desactivado' : 'Usuario activado');
    } catch (error: any) {
      toast.error('Error al actualizar estado', { description: error.message });
    }
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
              <p className="text-2xl font-bold text-primary">{employees.length}</p>
              <p className="text-sm text-muted-foreground">Total usuarios</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{employees.filter(e => e.active).length}</p>
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
              <p className="text-2xl font-bold text-success">{drivers.filter(d => d.active).length}</p>
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
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-pos-base font-bold">Nombre</TableHead>
                        <TableHead className="text-pos-base font-bold">Email</TableHead>
                        <TableHead className="text-pos-base font-bold">Rol</TableHead>
                        <TableHead className="text-pos-base font-bold">Teléfono</TableHead>
                        <TableHead className="text-pos-base font-bold">Estado</TableHead>
                        <TableHead className="text-pos-base font-bold text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((employee) => (
                        <TableRow key={employee.id} className="hover:bg-muted/50">
                          <TableCell className="font-semibold text-pos-base">
                            {employee.first_name} {employee.last_name}
                          </TableCell>
                          <TableCell>{employee.email || '—'}</TableCell>
                          <TableCell>{getRoleBadge(employee.role || 'cashier')}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {employee.phone || '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              employee.active 
                                ? 'bg-success/10 text-success' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {employee.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10"
                                onClick={() => handleOpenUserModal(employee)}
                              >
                                <Edit className="h-5 w-5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-10 w-10 ${employee.active ? 'text-destructive' : 'text-success'}`}
                                onClick={() => handleToggleActive(employee)}
                                disabled={toggleActive.isPending}
                              >
                                {employee.active ? <Trash2 className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No se encontraron usuarios
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
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
            {isLoading ? (
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {drivers.map((driver) => (
                  <Card key={driver.id} className={`border-2 ${!driver.active && 'opacity-60'}`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                        driver.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Truck className="h-8 w-8" />
                      </div>
                      <h3 className="font-bold text-pos-lg">{driver.first_name} {driver.last_name}</h3>
                      <p className="text-muted-foreground">{driver.phone || 'Sin teléfono'}</p>
                      <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          driver.active 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {driver.active ? 'Activo' : 'Inactivo'}
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
                          className={`flex-1 ${driver.active ? 'text-destructive' : 'text-success'}`}
                          onClick={() => handleToggleActive(driver)}
                          disabled={toggleActive.isPending}
                        >
                          {driver.active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {drivers.length === 0 && (
                  <div className="col-span-4 text-center py-12 text-muted-foreground">
                    <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-pos-lg font-medium">No hay repartidores</p>
                    <p className="text-sm mt-2">Crea un nuevo repartidor para empezar</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* User Modal */}
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <User className="h-6 w-6" />
                {editingEmployee ? 'Editar Usuario' : 'Nuevo Usuario'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Nombre</label>
                  <Input
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Nombre"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Apellido</label>
                  <Input
                    value={formApellido}
                    onChange={(e) => setFormApellido(e.target.value)}
                    placeholder="Apellido"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
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
                <label className="text-pos-base font-semibold">Teléfono</label>
                <Input
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                  placeholder="987654321"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Rol</label>
                <Select value={formRol} onValueChange={(v) => setFormRol(v as RoleType)}>
                  <SelectTrigger className="h-12 text-pos-base rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="cashier">Vendedor</SelectItem>
                    <SelectItem value="kitchen">Cocina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setIsUserModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl bg-primary"
                  onClick={handleSaveUser}
                  disabled={createEmployee.isPending || updateEmployee.isPending}
                >
                  {createEmployee.isPending || updateEmployee.isPending ? 'Guardando...' : 'Guardar'}
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
                {editingEmployee ? 'Editar Repartidor' : 'Nuevo Repartidor'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Nombre</label>
                  <Input
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Nombre"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Apellido</label>
                  <Input
                    value={formApellido}
                    onChange={(e) => setFormApellido(e.target.value)}
                    placeholder="Apellido"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Teléfono</label>
                <Input
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                  placeholder="987654321"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setIsDriverModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl bg-primary"
                  onClick={handleSaveDriver}
                  disabled={createEmployee.isPending || updateEmployee.isPending}
                >
                  {createEmployee.isPending || updateEmployee.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
