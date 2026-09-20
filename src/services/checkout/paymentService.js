import createPaymentService from "@/services/paymentServiceFactory";

const paymentService = createPaymentService("/checkout/payments");

export const {
  initiatePayment,
  verifyPayment,
  cancelPayment,
  getPaymentsByEvent,
  getPaymentStats,
  getPaymentLink,
  getAllPayments,
  exportPayments,
  exportInvoices,
} = paymentService;
