"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Mail, Copy, Trash2, Edit, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

const CATEGORIES = ["cold_outreach","follow_up","thank_you","referral","networking","negotiation","reconnect","rejection_response"]
const CATEGORY_LABELS: Record<string,string> = {
  cold_outreach: "Cold Outreach", follow_up: "Follow-up", thank_you: "Thank You",
  referral: "Referral", networking: "Networking", negotiation: "Negotiation",
  reconnect: "Reconnect", rejection_response: "Rejection Response",
}

export default function EmailsPage() {
  const qc = useQueryClient()
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<any>(null)
  const [templateForm, setTemplateForm] = useState({ name: "", category: "cold_outreach", subject: "", body: "" })
  const [saving, setSaving] = useState(false)

  const { data: templatesData, isLoading: tLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => { const r = await fetch("/api/emails?type=templates"); return r.json() },
  })
  const { data: emailsData, isLoading: eLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: async () => { const r = await fetch("/api/emails"); return r.json() },
  })

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "template", ...templateForm }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Template saved", variant: "success" })
      qc.invalidateQueries({ queryKey: ["email-templates"] })
      setTemplateFormOpen(false)
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setSaving(false) }
  }

  function openEdit(t: any) {
    setEditTemplate(t)
    setTemplateForm({ name: t.name, category: t.category, subject: t.subject, body: t.body })
    setTemplateFormOpen(true)
  }

  function copyTemplate(t: any) {
    navigator.clipboard.writeText(t.body)
    toast({ title: "Copied to clipboard", variant: "success" })
  }

  const templates = templatesData?.templates ?? []
  const emails = emailsData?.emails ?? []

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Center</h1>
          <p className="text-gray-400 text-sm">Manage templates and track outreach</p>
        </div>
        <Button onClick={() => { setEditTemplate(null); setTemplateForm({ name: "", category: "cold_outreach", subject: "", body: "" }); setTemplateFormOpen(true) }}>
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="sent">Email History ({emails.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {tLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No templates yet. Create your first email template!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((t: any) => (
                <div key={t.id} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 space-y-3 hover:border-[#3a3a4a] transition-all group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-white">{t.name}</div>
                      <Badge variant="secondary" className="text-xs mt-1">{CATEGORY_LABELS[t.category] ?? t.category}</Badge>
                    </div>
                    {t.isDefault && <Badge variant="default" className="text-xs">Default</Badge>}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">{t.subject}</div>
                  <div className="text-xs text-gray-500 line-clamp-3 bg-[#1e1e2a] rounded-lg p-2">{t.body}</div>
                  {t.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.variables.map((v: string) => (
                        <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-mono">{`{{${v}}}`}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-xs text-gray-600 flex-1">Used {t.usageCount}x</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => copyTemplate(t)}><Copy className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)}><Edit className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {eLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : emails.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No emails tracked yet.</div>
          ) : (
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a3a]">
                    {["To","Subject","Job","Status","Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a3a]">
                  {emails.map((email: any) => (
                    <tr key={email.id} className="hover:bg-[#1e1e2a] transition-colors">
                      <td className="px-4 py-3 text-gray-300">{email.to}</td>
                      <td className="px-4 py-3 text-white">{email.subject}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{email.job?.title ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={email.status === "sent" ? "success" : email.status === "draft" ? "secondary" : "warning"}>
                          {email.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(email.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={templateFormOpen} onOpenChange={setTemplateFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTemplate ? "Edit Template" : "New Email Template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveTemplate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Template Name *</Label>
                <Input placeholder="Cold Outreach" value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={templateForm.category} onValueChange={v => setTemplateForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Subject *</Label>
                <Input placeholder="Exploring opportunities at {{Company}}" value={templateForm.subject} onChange={e => setTemplateForm(f => ({ ...f, subject: e.target.value }))} required />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Body * <span className="text-gray-500 font-normal text-xs ml-2">Use {"{{VariableName}}"} for dynamic fields</span></Label>
                <Textarea placeholder="Hi {{RecruiterName}},..." value={templateForm.body} onChange={e => setTemplateForm(f => ({ ...f, body: e.target.value }))} rows={8} required />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setTemplateFormOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save Template</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
