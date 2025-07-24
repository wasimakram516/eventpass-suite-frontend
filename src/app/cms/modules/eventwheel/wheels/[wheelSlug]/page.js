import { redirect } from "next/navigation";

export default function Page() {
  return redirect(
    `/cms/modules/eventwheel/wheels`
  );
}
