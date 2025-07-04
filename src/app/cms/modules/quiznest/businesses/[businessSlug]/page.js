
import { redirect } from "next/navigation";

export default function BusinessSlugRedirect({ params }) {
  const { businessSlug } = params;

  redirect(`/cms/modules/quiznest/businesses/${businessSlug}/games`);
}
