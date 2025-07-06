// src/app/cms/modules/quiznest/businesses/[businessSlug]/games/[gameSlug]/page.js
import { redirect } from "next/navigation";

export default function Page({ params }) {
  return redirect(`/cms/modules/quiznest/businesses/${params.businessSlug}/games`);
}
