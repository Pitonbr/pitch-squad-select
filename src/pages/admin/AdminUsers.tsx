import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Ban, UserCheck, Users, ChevronLeft, ChevronRight, Loader2,
  Mail, Phone, Shield, Calendar, AlertCircle,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 20;

interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  phone: string | null;
  blocked_at: string | null;
  admin_notes: string | null;
  teams_count: number;
}

function UserDetailDialog({
  user, open, onClose,
}: { user: AdminUser | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notes, setNotes] = useState(user?.admin_notes ?? "");

  const blockMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ blocked_at: block ? new Date().toISOString() : null })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { block }) => {
      toast({ title: block ? "Usuário bloqueado" : "Usuário desbloqueado" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast({ title: "Erro ao atualizar usuário", variant: "destructive" }),
  });

  const saveNotesMutation = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ admin_notes: note || null })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Notas salvas" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast({ title: "Erro ao salvar notas", variant: "destructive" }),
  });

  if (!user) return null;

  const initials = user.display_name
    ? user.display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{user.display_name ?? "Sem nome"}</span>
              {user.blocked_at && (
                <Badge className="ml-2 text-xs bg-red-500/10 text-red-400 border-red-500/20">Bloqueado</Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-400">{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Mail,     label: "E-mail",          value: user.email },
              { icon: Phone,    label: "Telefone",         value: user.phone ?? "—" },
              { icon: Shield,   label: "Times",            value: `${user.teams_count} time(s)` },
              { icon: Calendar, label: "Cadastro",         value: new Date(user.created_at).toLocaleDateString("pt-BR") },
              { icon: Calendar, label: "Último acesso",    value: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca" },
              { icon: AlertCircle, label: "Bloqueado em", value: user.blocked_at ? new Date(user.blocked_at).toLocaleDateString("pt-BR") : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-500 text-xs">{label}</span>
                </div>
                <p className="text-slate-200 text-sm truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Admin notes */}
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs">Notas internas (visível só para admins)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-200 text-sm resize-none"
              rows={3}
              placeholder="Observações sobre este usuário..."
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveNotesMutation.mutate({ userId: user.user_id, note: notes })}
              disabled={saveNotesMutation.isPending}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {saveNotesMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar notas"}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Fechar
          </Button>
          {user.blocked_at ? (
            <Button
              onClick={() => blockMutation.mutate({ userId: user.user_id, block: false })}
              disabled={blockMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {blockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><UserCheck className="h-4 w-4 mr-2" />Desbloquear</>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => blockMutation.mutate({ userId: user.user_id, block: true })}
              disabled={blockMutation.isPending}
              variant="destructive"
            >
              {blockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Ban className="h-4 w-4 mr-2" />Bloquear</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users", debouncedSearch, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_user_list", {
        p_search: debouncedSearch || null,
        p_limit:  PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      });
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  const { data: totalCount } = useQuery<number>({
    queryKey: ["admin-users-count", debouncedSearch],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_user_count", {
        p_search: debouncedSearch || null,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
  });

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(0);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-400" />
            Usuários
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalCount !== undefined ? `${totalCount} usuário(s) cadastrado(s)` : "Carregando..."}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Usuário</TableHead>
              <TableHead className="text-slate-400 hidden md:table-cell">Times</TableHead>
              <TableHead className="text-slate-400 hidden lg:table-cell">Cadastro</TableHead>
              <TableHead className="text-slate-400 hidden lg:table-cell">Último acesso</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-800">
                    <TableCell><Skeleton className="h-5 w-48 bg-slate-800" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-8 bg-slate-800" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24 bg-slate-800" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24 bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 bg-slate-800" /></TableCell>
                  </TableRow>
                ))
              : users?.map(user => {
                  const initials = user.display_name
                    ? user.display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    : user.email.slice(0, 2).toUpperCase();

                  return (
                    <TableRow
                      key={user.user_id}
                      className="border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-slate-200 text-sm font-medium">{user.display_name ?? "—"}</p>
                            <p className="text-slate-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-slate-300 text-sm">{user.teams_count}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-slate-400 text-sm">
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-slate-400 text-sm">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR")
                            : "Nunca"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.blocked_at ? (
                          <Badge className="text-xs bg-red-500/10 text-red-400 border-red-500/20">Bloqueado</Badge>
                        ) : (
                          <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Ativo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <UserDetailDialog
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
