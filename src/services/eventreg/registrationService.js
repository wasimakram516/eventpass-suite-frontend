import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";
import createRegistrationService from "@/services/registrationServiceFactory";

export const {
  getRegistrationsByEvent, getInitialRegistrations, getAllPublicRegistrationsByEvent,
  exportRegistrations, getUnsentCount, sendBulkEmails, sendBulkWhatsApp,
  downloadSampleExcel, downloadCountryReference, uploadRegistrations,
  deleteRegistration, updateRegistrationApproval, bulkUpdateRegistrationApproval,
  createWalkIn, getRegistrationMeta, trackBadgePrint, updateRegistration,
} = createRegistrationService("/eventreg/registrations");

// Create a new public registration (public use)
export const createRegistration = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventreg/registrations", payload);
  return data;
}, { showSuccess: true });

// Verify registration by QR token (Staff use)
export const verifyRegistrationByToken = withApiHandler(async (token) => {
  const { data } = await api.get(
    `/eventreg/registrations/verify?token=${token}`,
  );
  return data;
});
