"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from "@mui/material";
import {
  getAllParticipants,
  addParticipant,
  deleteParticipant,
} from "@/services/eventwheel/spinWheelParticipantService";
import { getPublicSpinWheelById } from "@/services/eventwheel/spinWheelParticipantService";
import Image from "next/image";
import imgDivider from "@/assets/icons and assets/divider.png";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import LoadingState from "@/components/LoadingState";

const translations = {
  en: {
    welcomeTo: "Welcome to",
    readyToTry: "Ready to try your",
    luck: "luck",
    name: "Name",
    phone: "Phone",
    company: "Company",
    addParticipant: "Add Participant",
    showParticipants: "Show Participants",
    hideParticipants: "Hide Participants",
    noParticipants: "No participants added yet.",
    deleteParticipant: "Delete Participant",
    deleteTitle: "Delete Participant?",
    deleteMessage:
      "Are you sure you want to delete this participant? This action cannot be undone.",
    delete: "Delete",
  },
  ar: {
    welcomeTo: "مرحباً بك في",
    readyToTry: "هل أنت مستعد لتجربة",
    luck: "حظك",
    name: "الاسم",
    phone: "الهاتف",
    company: "الشركة",
    addParticipant: "إضافة مشارك",
    showParticipants: "عرض المشاركين",
    hideParticipants: "إخفاء المشاركين",
    noParticipants: "لم يتم إضافة مشاركين بعد.",
    deleteParticipant: "حذف المشارك",
    deleteTitle: "حذف المشارك؟",
    deleteMessage:
      "هل أنت متأكد من حذف هذا المشارك؟ لا يمكن التراجع عن هذا الإجراء.",
    delete: "حذف",
  },
};
const ParticipantsAdminPage = () => {
  const router = useRouter();
  const params = useParams();
  const [participants, setParticipants] = useState([]);
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", company: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const { t, dir, align } = useI18nLayout(translations);

  const eventId = params?.eventId;
  // 🔹 Fetch Event and Participants Data
  const fetchData = useCallback(async () => {
    if (!eventId) return;
    const eventData = await getPublicSpinWheelById(eventId);
    setEvent(eventData);
  }, [eventId]);
  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;
    const participantsData = await getAllParticipants(eventId);
    setParticipants(participantsData);
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId, fetchData]);

  // 🔹 Add Participant
  const handleAddParticipant = async () => {
    const payload = {
      ...form,
      spinWheelId: eventId,
    };
    await addParticipant(payload);
    setForm({ name: "", phone: "", company: "" });
    fetchParticipants();
  };

  // 🔹 Delete Participant
  const handleDeleteParticipant = async () => {
    await deleteParticipant(selectedParticipant);
    setParticipants((prev) =>
      prev.filter((p) => p._id !== selectedParticipant)
    );
    setConfirmDelete(false);
    setSelectedParticipant(null);
  };

  if (!eventId || !event) return <LoadingState />;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: event?.backgroundUrl
          ? `url(${event.backgroundUrl})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        p: 4,
      }}
      dir={dir}
    >
      {/* Home Icon */}
      <Box
        sx={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          cursor: "pointer",
        }}
        onClick={() => router.push("/cms/modules/eventwheel/events")}
      >
        <IconButton>
          <ICONS.home fontSize="large" sx={{ color: "primary.main" }} />
        </IconButton>
      </Box>
      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign={align}
        mt={showParticipants ? { xs: 4, sm: 0 } : { xs: 0 }}
      >
        {t.welcomeTo} {event.title}
      </Typography>

      <Image
        src={imgDivider}
        alt="Divider"
        height={30}
        width={300}
        style={{ width: "auto", maxWidth: "300px", margin: "16px 0" }}
      />

      <Typography variant="body1" sx={{ mb: 2 }}>
        {t.readyToTry} <strong>{t.luck}</strong>?
      </Typography>

      {/* 🔹 Participant Entry Fields */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <TextField
          fullWidth
          name="name"
          label={t.name}
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <TextField
          fullWidth
          name="phone"
          label={t.phone}
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
        />
        <TextField
          fullWidth
          name="company"
          label={t.company}
          value={form.company}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, company: e.target.value }))
          }
        />

        {/* 🔹 Optimized "Add Participant" Button */}
        <Button
          onClick={handleAddParticipant}
          startIcon={<ICONS.add />} // ✅ Material UI Icon
          variant="contained"
          sx={{ ...getStartIconSpacing(dir) }}
        >
          {t.addParticipant}
        </Button>
      </Box>

      {/* 🔹 Show Participants Button */}
      <Button
        onClick={() => {
          setShowParticipants(!showParticipants);
          if (!showParticipants) fetchParticipants(); // Only fetch when showing participants
        }}
        startIcon={<ICONS.people />}
        variant="contained"
        sx={{
          ...getStartIconSpacing(dir),
          mt: 2,
          width: { xs: "100%", sm: "auto" },
        }}
      >
        {showParticipants ? t.hideParticipants : t.showParticipants}
      </Button>

      {/* 🔹 Participants List (Only visible if "Show Participants" is clicked) */}
      {showParticipants && (
        <List sx={{ width: "100%", maxWidth: 400, mt: 3 }}>
          {participants.length === 0 ? (
            <Typography color="textSecondary" textAlign={align}>
              {t.noParticipants}
            </Typography>
          ) : (
            participants.map((participant) => (
              <ListItem key={participant._id}>
                <ListItemText
                  primary={participant.name}
                  secondary={participant.phone}
                />
                <ListItemSecondaryAction>
                  <Tooltip title={t.deleteParticipant}>
                    <IconButton
                      onClick={() => {
                        setSelectedParticipant(participant._id);
                        setConfirmDelete(true);
                      }}
                      color="error"
                    >
                      <ICONS.delete />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      )}

      {/* 🔹 Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteParticipant}
        title={t.deleteTitle}
        message={t.deleteMessage}
        confirmButtonText={t.delete}
      />
      <LanguageSelector top={20} right={20} />
    </Box>
  );
};

export default ParticipantsAdminPage;
