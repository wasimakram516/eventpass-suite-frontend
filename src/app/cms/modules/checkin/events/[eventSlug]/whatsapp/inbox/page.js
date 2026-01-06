"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Stack,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";

import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

import {
  getWhatsAppInbox,
  getWhatsAppConversation,
  sendWhatsAppReply,
} from "@/services/notifications/whatsAppInboxService";

import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import useWhatsAppSocket from "@/hooks/modules/notifications/useWhatsAppSocket";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

const translations = {
  en: {
    title: "WhatsApp Inbox",
    description: "View and reply to WhatsApp messages from attendees.",
    placeholder: "Type your reply…",
    noConversation: "Select a conversation to view messages",
  },
  ar: {
    title: "صندوق رسائل واتساب",
    description: "عرض والرد على رسائل واتساب من الحضور",
    placeholder: "اكتب ردك…",
    noConversation: "اختر محادثة لعرض الرسائل",
  },
};

export default function WhatsAppInboxPage() {
  const { eventSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [inbox, setInbox] = useState([]);
  const [activeTo, setActiveTo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const ev = await getCheckInEventBySlug(eventSlug);
      if (!ev?.error) {
        setEvent(ev);

        const inboxRes = await getWhatsAppInbox({
          eventId: ev._id,
        });

        setInbox(inboxRes || []);
      }

      setLoading(false);
    };

    if (eventSlug) load();
  }, [eventSlug]);

  /* =========================
     LOAD CONVERSATION
  ========================= */

  const loadConversation = async (to) => {
    setActiveTo(to);
    const res = await getWhatsAppConversation({
      eventId: event._id,
      to,
      limit: 100,
    });
    setMessages(res || []);
  };

  /* =========================
     SEND REPLY
  ========================= */

  const handleSend = async () => {
    if (!reply.trim() || !activeTo) return;

    setSending(true);
    await sendWhatsAppReply({
      eventId: event._id,
      businessId: event.businessId,
      to: activeTo,
      body: reply.trim(),
    });

    setReply("");
    setSending(false);
  };

  /* =========================
     SOCKETS (REAL-TIME)
  ========================= */

  const handleInbound = useCallback(
    (payload) => {
      if (!payload?.from) return;

      // Update inbox preview
      setInbox((prev) => {
        const exists = prev.find((i) => i.to === payload.from);
        if (exists) {
          return [
            { ...exists, lastMessage: payload.body, updatedAt: payload.receivedAt },
            ...prev.filter((i) => i.to !== payload.from),
          ];
        }
        return [
          {
            to: payload.from,
            lastMessage: payload.body,
            updatedAt: payload.receivedAt,
          },
          ...prev,
        ];
      });

      // If active chat, append message
      if (payload.from === activeTo) {
        setMessages((prev) => [
          ...prev,
          {
            direction: "inbound",
            body: payload.body,
            createdAt: payload.receivedAt,
          },
        ]);
      }
    },
    [activeTo]
  );

  const handleStatus = useCallback(() => {}, []);

  useWhatsAppSocket({
    eventId: event?._id,
    onInboundMessage: handleInbound,
    onStatusUpdate: handleStatus,
  });

  /* =========================
     UI
  ========================= */

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack spacing={1} mb={3}>
        <Typography variant="h5" fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.description}
        </Typography>
        <Divider />
      </Stack>

      <Box sx={{ display: "flex", height: "70vh", gap: 2 }}>
        {/* LEFT: INBOX */}
        <Paper sx={{ width: 320, overflow: "auto" }}>
          <List disablePadding>
            {inbox.map((item) => (
              <ListItemButton
                key={item.to}
                selected={item.to === activeTo}
                onClick={() => loadConversation(item.to)}
              >
                <ListItemText
                  primary={item.to.replace("whatsapp:", "")}
                  secondary={item.lastMessage}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* RIGHT: CONVERSATION */}
        <Paper sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!activeTo ? (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography color="text.secondary">
                {t.noConversation}
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
                {messages.map((m, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      mb: 1.5,
                      alignSelf: m.direction === "outbound" ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                      bgcolor: m.direction === "outbound" ? "primary.main" : "grey.200",
                      color: m.direction === "outbound" ? "white" : "text.primary",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2">{m.body}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {formatDateTimeWithLocale(m.createdAt)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider />

              <Box sx={{ p: 1.5, display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t.placeholder}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <IconButton color="primary" onClick={handleSend} disabled={sending}>
                  <ICONS.send />
                </IconButton>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
