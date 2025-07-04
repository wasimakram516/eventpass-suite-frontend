// src/app/cms/businesses/[businessSlug]/games/[gameSlug]/page.js
import { redirect } from "next/navigation";

export default function Page({ params }) {
  return redirect(`/cms/businesses/${params.businessSlug}/games`);
}
