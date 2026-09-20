import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";
import createRegistrationService from "@/services/registrationServiceFactory";

const basePath = "/checkout/registrations";
const sharedRegistrations = createRegistrationService(basePath, { defaultLimit: 20 });

export const {
  getRegistrationsByEvent, getInitialRegistrations, getAllPublicRegistrationsByEvent,
  exportRegistrations, getUnsentCount, sendBulkEmails, sendBulkWhatsApp,
  downloadSampleExcel, downloadCountryReference, uploadRegistrations,
  deleteRegistration, updateRegistrationApproval, bulkUpdateRegistrationApproval,
  createWalkIn, getRegistrationMeta, trackBadgePrint,
} = sharedRegistrations;

// Checkout events are paid; gateway registrations are created by the Checkout
// payment flow. This fallback keeps the shared registration-management modal
// from accidentally posting a paid registration through EventReg.
export const createRegistration = async () => ({
  error: true,
  message: "Use the Checkout payment flow or record an external payment.",
});

export const createExternalRegistration = withApiHandler(async (slug, payload) => {
  const { data } = await api.post(`${basePath}/event/${slug}/external`, payload);
  return data;
}, { showSuccess: true });

export const checkExternalRegistrationDuplicate = withApiHandler(async (slug, payload) => {
  const { data } = await api.post(
    `${basePath}/event/${slug}/external/duplicate-check`,
    payload,
  );
  return data;
});

const updateExternalPayment = withApiHandler(async (id, fields) => {
  const { data } = await api.put(`${basePath}/${id}/external-payment`, { fields });
  return data;
}, { showSuccess: true });

export const updateRegistration = (id, fields) => {
  const isExternalPaymentUpdate = Object.prototype.hasOwnProperty.call(
    fields || {},
    "markAsExternalPayment",
  );
  return isExternalPaymentUpdate
    ? updateExternalPayment(id, fields)
    : sharedRegistrations.updateRegistration(id, fields);
};

export const getRegistrationInvoice = async (id) => {
  try {
    const { data } = await api.get(`${basePath}/${id}/invoice`, { responseType: "blob" });
    return data;
  } catch (err) {
    let message = "Failed to load invoice";
    if (err?.response?.data instanceof Blob) {
      try {
        message = JSON.parse(await err.response.data.text())?.message || message;
      } catch { /* keep the generic message */ }
    }
    return { error: true, message };
  }
};
