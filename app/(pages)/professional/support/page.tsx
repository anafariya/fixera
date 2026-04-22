"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LifeBuoy, CalendarClock, MessageCircle, Send, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  proCreateMeetingRequest,
  proCreateTicket,
  proListMyMeetingRequests,
  proListMyTickets,
  proReplyTicket,
  SupportTicket,
  MeetingRequest,
} from "@/lib/support";

type Tab = "ticket" | "meeting" | "chat";

export default function ProfessionalSupportPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("ticket");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== "professional") {
      router.replace("/login?redirect=/professional/support");
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading || !isAuthenticated || user?.role !== "professional") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-white">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white pb-16">
      <div className="mx-auto max-w-4xl px-6 pt-24">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-200 via-blue-200 to-cyan-200 p-[1.5px] shadow-md">
          <div className="rounded-[calc(1.5rem-1.5px)] bg-white px-8 py-8">
            <h1 className="text-3xl font-bold text-indigo-900">Professional Support</h1>
            <p className="mt-1 text-sm text-indigo-600/80">Open a ticket, request a meeting, or chat with us.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton active={tab === "ticket"} onClick={() => setTab("ticket")} icon={<LifeBuoy size={14} />}>
            Create ticket
          </TabButton>
          <TabButton active={tab === "meeting"} onClick={() => setTab("meeting")} icon={<CalendarClock size={14} />}>
            Plan a meeting
          </TabButton>
          <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageCircle size={14} />}>
            Chat
          </TabButton>
        </div>

        <div className="mt-6">
          {tab === "ticket" && <TicketsTab />}
          {tab === "meeting" && <MeetingsTab />}
          {tab === "chat" && <ChatPlaceholder />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick, icon }: { children: React.ReactNode; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-transparent bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-200"
          : "border-indigo-200 bg-white/60 text-indigo-700 hover:bg-indigo-50"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 p-[1.5px] shadow-sm">
      <div className="rounded-[calc(1rem-1.5px)] bg-white">{children}</div>
    </div>
  );
}

function TicketsTab() {
  const [items, setItems] = useState<SupportTicket[] | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replySending, setReplySending] = useState<Record<string, boolean>>({});

  const load = useCallback(
    () =>
      proListMyTickets()
        .then(setItems)
        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load tickets")),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Subject and description are required");
      return;
    }
    setSaving(true);
    try {
      await proCreateTicket({ subject: subject.trim(), description: description.trim() });
      setSubject("");
      setDescription("");
      toast.success("Ticket created");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (id: string) => {
    if (replySending[id]) return;
    const body = replyDraft[id]?.trim();
    if (!body) return;
    setReplySending((s) => ({ ...s, [id]: true }));
    try {
      await proReplyTicket(id, body);
      setReplyDraft((d) => ({ ...d, [id]: "" }));
      toast.success("Reply sent");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reply");
    } finally {
      setReplySending((s) => ({ ...s, [id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">New ticket</h2>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            maxLength={200}
            className="w-full rounded-xl border border-indigo-200 bg-white/60 px-4 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the issue in detail"
            maxLength={5000}
            className="w-full resize-none rounded-xl border border-indigo-200 bg-white/60 px-4 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:shadow-lg hover:shadow-indigo-300 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Create ticket
            </button>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-700">Your tickets</h2>
        {items === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-10 text-center text-sm text-indigo-500">
            No tickets yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <Card key={t._id}>
                <div className="space-y-2 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-indigo-900">{t.subject}</h3>
                    <StatusPill label={t.status} />
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-indigo-800/80">{t.description}</p>
                  {t.replies.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-l-2 border-indigo-200 pl-3">
                      {t.replies.map((r, idx) => (
                        <div key={idx} className="text-xs">
                          <span className={cn("font-semibold", r.authorRole === "admin" ? "text-blue-700" : "text-indigo-700")}>
                            {r.authorRole === "admin" ? "Admin" : "You"}
                          </span>
                          <span className="text-indigo-400"> · {new Date(r.createdAt).toLocaleString()}</span>
                          <div className="whitespace-pre-wrap text-indigo-800/90">{r.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {t.status !== "closed" && (
                    <div className="flex items-center gap-2">
                      <input
                        value={replyDraft[t._id] || ""}
                        onChange={(e) => setReplyDraft((d) => ({ ...d, [t._id]: e.target.value }))}
                        disabled={Boolean(replySending[t._id])}
                        placeholder="Reply…"
                        className="flex-1 rounded-xl border border-indigo-200 bg-white/60 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
                      />
                      <button
                        onClick={() => sendReply(t._id)}
                        disabled={Boolean(replySending[t._id]) || !replyDraft[t._id]?.trim()}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {replySending[t._id] ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />} Send
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingsTab() {
  const [items, setItems] = useState<MeetingRequest[] | null>(null);
  const [topic, setTopic] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () =>
      proListMyMeetingRequests()
        .then(setItems)
        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load requests")),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!topic.trim() || !preferredTimes.trim()) {
      toast.error("Topic and preferred times are required");
      return;
    }
    setSaving(true);
    try {
      await proCreateMeetingRequest({ topic: topic.trim(), preferredTimes: preferredTimes.trim(), durationMinutes });
      setTopic("");
      setPreferredTimes("");
      setDurationMinutes(30);
      toast.success("Meeting request sent");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Request a meeting</h2>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic"
            maxLength={200}
            className="w-full rounded-xl border border-indigo-200 bg-white/60 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          />
          <textarea
            value={preferredTimes}
            onChange={(e) => setPreferredTimes(e.target.value)}
            rows={3}
            placeholder="Preferred dates/times (e.g. 'Mon–Wed morning, any time after 10:00')"
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-indigo-200 bg-white/60 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-indigo-700">Duration</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:shadow-lg hover:shadow-indigo-300 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <CalendarClock size={14} />} Submit request
            </button>
          </div>
          <p className="text-[11px] text-indigo-400">Admin will confirm with a scheduled time. Availability-based booking is coming soon.</p>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-700">Your requests</h2>
        {items === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-10 text-center text-sm text-indigo-500">
            No meeting requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((m) => (
              <Card key={m._id}>
                <div className="space-y-1 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-indigo-900">{m.topic}</h3>
                    <StatusPill label={m.status} />
                  </div>
                  <p className="text-sm text-indigo-700/80">Preferred: {m.preferredTimes}</p>
                  <p className="text-xs text-indigo-500">Duration: {m.durationMinutes} min</p>
                  {m.scheduledAt && (
                    <p className="text-sm font-medium text-emerald-700">Scheduled for: {new Date(m.scheduledAt).toLocaleString()}</p>
                  )}
                  {m.adminResponse && (
                    <div className="rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                      <span className="font-semibold">Admin: </span>
                      {m.adminResponse}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPlaceholder() {
  return (
    <Card>
      <div className="p-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 text-white shadow-md shadow-indigo-200">
          <MessageCircle size={24} />
        </div>
        <h2 className="text-lg font-semibold text-indigo-900">AI chat is coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-indigo-600/80">
          You&apos;ll be able to chat with our AI assistant here. If your question needs a human, we&apos;ll escalate to a live agent automatically.
        </p>
      </div>
    </Card>
  );
}

function StatusPill({ label }: { label: string }) {
  const cls: Record<string, string> = {
    open: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-gray-100 text-gray-600",
    pending: "bg-amber-100 text-amber-700",
    scheduled: "bg-emerald-100 text-emerald-700",
    declined: "bg-rose-100 text-rose-700",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cls[label] || "bg-gray-100 text-gray-600")}>
      {label.replace("_", " ")}
    </span>
  );
}
