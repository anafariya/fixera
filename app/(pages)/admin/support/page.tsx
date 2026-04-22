"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LifeBuoy, CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  adminListTickets,
  adminUpdateTicket,
  adminListMeetingRequests,
  adminUpdateMeetingRequest,
  SupportTicket,
  MeetingRequest,
  SupportTicketStatus,
  MeetingRequestStatus,
} from "@/lib/support";

const TICKET_STATUSES: SupportTicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const MEETING_STATUSES: MeetingRequestStatus[] = ["pending", "scheduled", "declined", "cancelled"];

type Tab = "tickets" | "meetings";

export default function AdminSupportPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tickets");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== "admin") router.replace("/login");
  }, [user, isAuthenticated, loading, router]);

  if (loading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-white">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="text-3xl font-bold text-indigo-900">Professional Support</h1>
        <p className="mt-1 text-sm text-indigo-600/80">Tickets and meeting requests from professionals.</p>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setTab("tickets")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
              tab === "tickets"
                ? "border-transparent bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-200"
                : "border-indigo-200 bg-white/60 text-indigo-700 hover:bg-indigo-50"
            )}
          >
            <LifeBuoy size={14} /> Tickets
          </button>
          <button
            onClick={() => setTab("meetings")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
              tab === "meetings"
                ? "border-transparent bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-200"
                : "border-indigo-200 bg-white/60 text-indigo-700 hover:bg-indigo-50"
            )}
          >
            <CalendarClock size={14} /> Meeting requests
          </button>
        </div>

        <div className="mt-6">{tab === "tickets" ? <TicketsAdmin /> : <MeetingsAdmin />}</div>
      </div>
    </div>
  );
}

function TicketsAdmin() {
  const [items, setItems] = useState<SupportTicket[] | null>(null);
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = () =>
    adminListTickets()
      .then(setItems)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load tickets"));

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, payload: { status?: SupportTicketStatus; reply?: string }) => {
    try {
      await adminUpdateTicket(id, payload);
      setReply((r) => ({ ...r, [id]: "" }));
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (items === null) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>;
  if (items.length === 0) return <div className="rounded-2xl border border-dashed border-indigo-300 bg-white py-10 text-center text-sm text-indigo-500">No tickets.</div>;

  return (
    <div className="space-y-3">
      {items.map((t) => {
        const u = typeof t.userId === "object" ? t.userId : null;
        return (
          <div key={t._id} className="rounded-2xl bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 p-[1.5px]">
            <div className="rounded-[calc(1rem-1.5px)] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-indigo-900">{t.subject}</h3>
                  <p className="text-xs text-indigo-500">
                    {u?.name || "Unknown"} {u?.email ? `· ${u.email}` : ""} · {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <select
                  value={t.status}
                  onChange={(e) => update(t._id, { status: e.target.value as SupportTicketStatus })}
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-indigo-800/80">{t.description}</p>
              {t.replies.length > 0 && (
                <div className="mt-3 space-y-1.5 border-l-2 border-indigo-200 pl-3">
                  {t.replies.map((r, idx) => (
                    <div key={idx} className="text-xs">
                      <span className={cn("font-semibold", r.authorRole === "admin" ? "text-blue-700" : "text-indigo-700")}>
                        {r.authorRole === "admin" ? "Admin" : "Professional"}
                      </span>
                      <span className="text-indigo-400"> · {new Date(r.createdAt).toLocaleString()}</span>
                      <div className="whitespace-pre-wrap text-indigo-800/90">{r.body}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={reply[t._id] || ""}
                  onChange={(e) => setReply((r) => ({ ...r, [t._id]: e.target.value }))}
                  placeholder="Reply to the professional…"
                  className="flex-1 rounded-xl border border-indigo-200 bg-white/60 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={() => reply[t._id]?.trim() && update(t._id, { reply: reply[t._id].trim() })}
                  className="rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MeetingsAdmin() {
  const [items, setItems] = useState<MeetingRequest[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { scheduledAt: string; adminResponse: string }>>({});

  const load = () =>
    adminListMeetingRequests()
      .then(setItems)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, payload: Parameters<typeof adminUpdateMeetingRequest>[1]) => {
    try {
      await adminUpdateMeetingRequest(id, payload);
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (items === null) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>;
  if (items.length === 0) return <div className="rounded-2xl border border-dashed border-indigo-300 bg-white py-10 text-center text-sm text-indigo-500">No meeting requests.</div>;

  return (
    <div className="space-y-3">
      {items.map((m) => {
        const u = typeof m.userId === "object" ? m.userId : null;
        const draft = drafts[m._id] || { scheduledAt: m.scheduledAt ? new Date(m.scheduledAt).toISOString().slice(0, 16) : "", adminResponse: m.adminResponse || "" };
        return (
          <div key={m._id} className="rounded-2xl bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 p-[1.5px]">
            <div className="rounded-[calc(1rem-1.5px)] bg-white p-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-indigo-900">{m.topic}</h3>
                  <p className="text-xs text-indigo-500">
                    {u?.name || "Unknown"} {u?.email ? `· ${u.email}` : ""} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                <select
                  value={m.status}
                  onChange={(e) => update(m._id, { status: e.target.value as MeetingRequestStatus })}
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                >
                  {MEETING_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-indigo-700/80"><span className="font-medium">Preferred:</span> {m.preferredTimes}</p>
              <p className="text-xs text-indigo-500">Duration: {m.durationMinutes} min</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="text-xs text-indigo-700">
                  Scheduled at
                  <input
                    type="datetime-local"
                    value={draft.scheduledAt}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m._id]: { ...draft, scheduledAt: e.target.value } }))}
                    className="mt-1 w-full rounded-xl border border-indigo-200 bg-white/60 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
                <label className="text-xs text-indigo-700">
                  Response
                  <input
                    value={draft.adminResponse}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m._id]: { ...draft, adminResponse: e.target.value } }))}
                    placeholder="Optional note"
                    className="mt-1 w-full rounded-xl border border-indigo-200 bg-white/60 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    update(m._id, {
                      scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : undefined,
                      adminResponse: draft.adminResponse,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
