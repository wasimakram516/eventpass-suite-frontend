import InlineBusinessPicker from "@/components/business/InlineBusinessPicker";
import EmptyBusinessState from "@/components/EmptyBusinessState";

// Keeps the CMS business-selection fallback identical across module pages.
// Page content is rendered only after a business has been selected.
export default function BusinessScope({
  user,
  selectedBusiness,
  businesses,
  onSelect,
  children,
}) {
  if (selectedBusiness) return children;

  if (user?.role === "admin" || user?.role === "superadmin") {
    return <InlineBusinessPicker businesses={businesses} onSelect={onSelect} />;
  }

  return <EmptyBusinessState />;
}
