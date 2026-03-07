import { trpc } from "@/lib/trpc";
import { formatCambodianPhone } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select2 } from "@/components/ui/select2";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, UserSquare2, Clock, TrendingUp, PlayCircle, StopCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DataTable } from "@/components/DataTable";

type EmpForm = { name: string; email: string; phone: string; role: "admin" | "cashier" | "manager"; pin: string; isActive: boolean };
const emptyForm: EmpForm = { name: "", email: "", phone: "", role: "cashier", pin: "", isActive: true };

export default function Employees() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [shiftEmployeeId, setShiftEmployeeId] = useState<number | null>(null);
  const [openingCash, setOpeningCash] = useState("0");

  const { data: employees, isLoading } = trpc.employees.list.useQuery();
  const { data: shifts } = trpc.employees.shifts.useQuery({});
  const utils = trpc.useUtils();

  const createEmployee = trpc.employees.create.useMutation({
    onSuccess: () => { toast.success("Employee added"); setDialogOpen(false); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateEmployee = trpc.employees.update.useMutation({
    onSuccess: () => { toast.success("Employee updated"); setDialogOpen(false); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEmployee = trpc.employees.delete.useMutation({
    onSuccess: () => { toast.success("Employee deleted"); setDeleteId(null); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const startShift = trpc.employees.startShift.useMutation({
    onSuccess: () => { toast.success("Shift started"); setShiftEmployeeId(null); utils.employees.shifts.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const endShift = trpc.employees.endShift.useMutation({
    onSuccess: () => { toast.success("Shift ended"); utils.employees.shifts.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (e: any) => {
    setForm({ name: e.name, email: e.email ?? "", phone: e.phone ?? "", role: e.role, pin: e.pin ?? "", isActive: e.isActive });
    setEditId(e.id); setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const payload = { name: form.name, email: form.email || undefined, phone: form.phone || undefined, role: form.role, pin: form.pin || undefined, isActive: form.isActive };
    if (editId) updateEmployee.mutate({ id: editId, ...payload });
    else createEmployee.mutate(payload);
  };

  const getActiveShift = (empId: number) => shifts?.find((s) => s.employeeId === empId && !s.endTime);
  const roleColors: Record<string, string> = { admin: "badge-error", manager: "badge-warning", cashier: "badge-neutral" };
  const f = (k: keyof EmpForm, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Employees</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{employees?.length ?? 0} team members</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        )}
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="shifts">Shift History</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <DataTable
            data={employees ?? []}
            isLoading={isLoading}
            columns={[
              {
                key: "name" as const,
                label: "Employee",
                width: "25%",
              },
                {
                  key: "email" as const,
                  label: "Contact",
                  width: "25%",
                  render: (_: any, e: any) => (
                    <div className="text-sm">
                      {e.email && <p className="text-foreground">{e.email}</p>}
                      {e.phone && <p className="text-muted-foreground text-xs">{formatCambodianPhone(e.phone)}</p>}
                    </div>
                  ),
                },
                {
                  key: "role" as const,
                  label: "Role",
                  width: "15%",
                  render: (v: any) => <span className={roleColors[v] ?? "badge-neutral"}>{v}</span>,
                },
                {
                  key: "id" as const,
                  label: "Shift Status",
                  width: "20%",
                  render: (_: any, e: any) => {
                    const shift = getActiveShift(e.id);
                    return shift ? (
                      <div className="text-sm">
                        <p className="font-medium text-emerald-600">On Shift</p>
                        <p className="text-xs text-muted-foreground">{new Date(shift.startTime).toLocaleTimeString()}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Off Duty</p>
                    );
                  },
                },
                {
                  key: "isActive" as const,
                  label: "Status",
                  width: "10%",
                  render: (v: any) => (
                    <span className={v ? "badge-success" : "badge-neutral"}>
                      {v ? "Active" : "Inactive"}
                    </span>
                  ),
                },
                {
                  key: "id" as const,
                  label: "Actions",
                  width: "5%",
                  render: (_: any, e: any) => (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(e)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(e.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <DataTable
            data={shifts ?? []}
            columns={[
              {
                key: "employeeId" as const,
                label: "Employee",
                width: "20%",
                render: (v: any) => <span>{employees?.find((e) => e.id === v)?.name ?? `Employee #${v}`}</span>,
              },
              {
                key: "startTime" as const,
                label: "Start Time",
                width: "20%",
                render: (v: any) => <span className="text-muted-foreground">{new Date(v).toLocaleString()}</span>,
              },
              {
                key: "endTime" as const,
                label: "End Time",
                width: "20%",
                render: (v: any) => <span className="text-muted-foreground">{v ? new Date(v).toLocaleString() : "—"}</span>,
              },
              {
                key: "openingCash" as const,
                label: "Opening Cash",
                width: "15%",
                render: (v: any) => <div className="text-right">${parseFloat(v ?? "0").toFixed(2)}</div>,
              },
              {
                key: "closingCash" as const,
                label: "Closing Cash",
                width: "15%",
                render: (v: any) => <div className="text-right">{v ? `$${parseFloat(v).toFixed(2)}` : "—"}</div>,
              },
              {
                key: "endTime" as const,
                label: "Status",
                width: "10%",
                render: (v: any) => (
                  <span className={v ? "badge-neutral" : "badge-success"}>{v ? "Closed" : "Active"}</span>
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name *</Label><Input className="mt-1" value={form.name} onChange={(e) => f("name", e.target.value)} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => f("email", e.target.value)} /></div>
            <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={(e) => f("phone", formatCambodianPhone(e.target.value))} placeholder="012 345 6789" /></div>
            <div>
              <Label>Role</Label>
              <Select2
                options={[
                  { value: "cashier", label: "Cashier" },
                  { value: "manager", label: "Manager" },
                  { value: "admin", label: "Admin" },
                ]}
                value={form.role}
                onChange={(v) => f("role", v as any)}
              />
            </div>
            <div><Label>PIN (4-6 digits)</Label><Input className="mt-1" type="password" maxLength={6} value={form.pin} onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value }))} placeholder="Optional PIN" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createEmployee.isPending || updateEmployee.isPending}>
              {editId ? "Update" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Shift Dialog */}
      <Dialog open={!!shiftEmployeeId} onOpenChange={(o) => !o && setShiftEmployeeId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Start Shift</DialogTitle></DialogHeader>
          <div>
            <Label>Opening Cash Amount</Label>
            <Input className="mt-1" type="number" step="0.01" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftEmployeeId(null)}>Cancel</Button>
            <Button onClick={() => shiftEmployeeId && startShift.mutate({ employeeId: shiftEmployeeId, openingCash })} disabled={startShift.isPending}>
              Start Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Employee</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Are you sure? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteEmployee.mutate({ id: deleteId })} disabled={deleteEmployee.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
