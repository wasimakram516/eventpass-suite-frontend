import { useEffect } from "react";

// CMS business-scoped pages use the business slug as their shared selection
// value. Keep the role-based default in one place so individual modules do
// not drift between the business id and slug.
export default function useBusinessAutoSelection(user, selectedBusiness, setSelectedBusiness) {
  useEffect(() => {
    if (user?.role === "business" && user.business?.slug && !selectedBusiness) {
      setSelectedBusiness(user.business.slug);
    }
  }, [user?.role, user?.business?.slug, selectedBusiness, setSelectedBusiness]);
}
