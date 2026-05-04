import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, Search, Shield, ShieldCheck, Mail, 
  Trash2, Edit2, Loader2, MoreVertical, X, Check
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function UserManagement({ portalId }: { portalId: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "employee"
  });

  useEffect(() => {
    fetchUsers();
  }, [portalId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await Api.listPortalUsers(portalId);
      setUsers(data);
    } catch (e) {
      toast.error("Failed to load portal users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await Api.createPortalUser(portalId, formData);
      toast.success("User created and invited");
      setIsDialogOpen(false);
      setFormData({ email: "", password: "", first_name: "", last_name: "", role: "employee" });
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to create user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await Api.updatePortalUser(userId, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (e) {
      toast.error("Failed to update role");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Portal Users</h2>
          <p className="text-slate-500 font-medium">Manage access and roles for your institution</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg font-bold">
              <UserPlus className="h-4 w-4 mr-2" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">New Employee</DialogTitle>
              <DialogDescription>Create a new account for your portal staff.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label>
                  <Input 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="John"
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
                  <Input 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Doe"
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                <Input 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john.doe@institution.gov.zm"
                  className="h-12 rounded-xl bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                <Input 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="h-12 rounded-xl bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Level</label>
                <select 
                  className="w-full h-12 rounded-xl bg-slate-50 border-none px-4"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="employee">Employee (Self-Service Only)</option>
                  <option value="staff">Portal Staff (Can manage applications)</option>
                  <option value="institutional_admin">Institutional Admin (Full access)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Search by name or email..."
          className="h-14 pl-12 rounded-2xl border-none shadow-sm bg-white font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching User Directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-medium">No users found matching your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">User Details</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Access Role</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{user.first_name} {user.last_name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Mail className="h-2 w-2" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {user.role === 'institutional_admin' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] py-1 px-3">Admin</Badge>
                          ) : user.role === 'staff' ? (
                            <Badge className="bg-blue-500/10 text-blue-600 border-none font-bold text-[10px] py-1 px-3">Portal Staff</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[10px] py-1 px-3">Employee</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", user.is_active ? "bg-emerald-500" : "bg-slate-300")} />
                          <span className="text-xs font-bold text-slate-500">{user.is_active ? "Active" : "Disabled"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-bold text-xs rounded-xl"
                            onClick={() => handleRoleChange(user.id, user.role === 'employee' ? 'staff' : 'employee')}
                          >
                            {user.role === 'employee' ? 'Promote' : 'Demote'}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
