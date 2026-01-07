"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Avatar,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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
  const isMobile = useMediaQuery("(max-width:900px)");

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [inbox, setInbox] = useState([]);
  const [activeTo, setActiveTo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const messagesEndRef = useRef(null);

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const ev = await getCheckInEventBySlug(eventSlug);

      if (!ev?.error) {
        setEvent(ev);
        const inboxRes = await getWhatsAppInbox({ eventId: ev._id });
        setInbox(inboxRes || []);
      }

      setLoading(false);
    };

    if (eventSlug) load();
  }, [eventSlug]);

  /* =========================
     LOAD CONVERSATION
  ========================= */

  const loadConversation = async (phone) => {
    setActiveTo(phone);
    setShowChat(true);

    const res = await getWhatsAppConversation({
      eventId: event._id,
      to: phone,
      limit: 100,
    });

    setMessages(res || []);
  };

  const closeConversation = () => {
    setActiveTo(null);
    setMessages([]);
    setShowChat(false);
  };

  /* =========================
     SEND MESSAGE
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
     AUTO SCROLL
  ========================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     SOCKET HANDLERS
  ========================= */

  const handleInbound = useCallback(
    (payload) => {
      if (!payload?.from) return;
      const phone = payload.from;

      setInbox((prev) => {
        const exists = prev.find((i) => i.phone === phone);
        const updated = {
          phone,
          lastMessage: payload.body,
          lastMessageAt: payload.receivedAt,
        };
        return exists
          ? [updated, ...prev.filter((i) => i.phone !== phone)]
          : [updated, ...prev];
      });

      if (phone === activeTo) {
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

  const handleOutbound = useCallback(
    (payload) => {
      const phone = payload.to;

      setInbox((prev) => {
        const exists = prev.find((i) => i.phone === phone);
        const updated = {
          phone,
          lastMessage: payload.body,
          lastMessageAt: payload.createdAt,
        };
        return exists
          ? [updated, ...prev.filter((i) => i.phone !== phone)]
          : [updated, ...prev];
      });

      if (phone === activeTo) {
        setMessages((prev) => [
          ...prev,
          {
            direction: "outbound",
            body: payload.body,
            createdAt: payload.createdAt,
          },
        ]);
      }
    },
    [activeTo]
  );

  useWhatsAppSocket({
    eventId: event?._id,
    onInboundMessage: handleInbound,
    onOutboundMessage: handleOutbound,
    onStatusUpdate: () => {},
  });

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <Box
        sx={{ minHeight: "60vh", display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack spacing={1} mb={2}>
        <Typography variant="h5" fontWeight={600}>
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.description}
        </Typography>
        <Divider />
      </Stack>

      <Box sx={{ display: "flex", height: "72vh", gap: 2 }}>
        {/* INBOX */}
        {(!isMobile || !showChat) && (
          <Paper
            sx={{
              width: isMobile ? "100%" : 320,
              overflow: "auto",
              borderRadius: 2,
            }}
          >
            <List disablePadding>
              {inbox.map((item) => (
                <ListItemButton
                  key={item.phone}
                  selected={item.phone === activeTo}
                  onClick={() => loadConversation(item.phone)}
                  sx={{
                    py: 1.5,
                    "&.Mui-selected": {
                      bgcolor: "action.selected",
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography fontWeight={500}>
                        {item.phone.replace("whatsapp:", "")}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.lastMessage}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        {/* CHAT */}
        {(!isMobile || showChat) && (
          <Paper
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
            }}
          >
            {!activeTo ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  {t.noConversation}
                </Typography>
              </Box>
            ) : (
              <>
                {/* HEADER */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <IconButton size="small" onClick={closeConversation}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 36, height: 36 }}
                  >
                    {activeTo.slice(-2)}
                  </Avatar>
                  <Typography fontWeight={600}>
                    {activeTo.replace("whatsapp:", "")}
                  </Typography>
                </Box>

                {/* MESSAGES */}
                <Box
                  sx={{ flex: 1, p: 2, overflowY: "auto", bgcolor: "grey.50" }}
                >
                  {messages.map((m, idx) => {
                    const inbound = m.direction === "inbound";
                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          justifyContent: inbound ? "flex-end" : "flex-start",
                          mb: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: "75%",
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: inbound
                              ? "primary.main"
                              : "background.paper",
                            color: inbound ? "white" : "text.primary",
                            boxShadow: 1,
                          }}
                        >
                          <Typography variant="body2">{m.body}</Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              opacity: 0.7,
                              textAlign: "right",
                            }}
                          >
                            {formatDateTimeWithLocale(m.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                {/* INPUT */}
                <Divider />
                {/* INPUT */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 0.75,
                      borderRadius: 3,
                      bgcolor: "grey.100",
                    }}
                  >
                    <TextField
                      fullWidth
                      variant="standard"
                      placeholder={t.placeholder}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      disabled={sending}
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontSize: 14,
                        },
                      }}
                    />

                    <IconButton
                      color="primary"
                      onClick={handleSend}
                      disabled={sending}
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": {
                          bgcolor: "primary.dark",
                        },
                        width: 40,
                        height: 40,
                      }}
                    >
                      <ICONS.send />
                    </IconButton>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
}
