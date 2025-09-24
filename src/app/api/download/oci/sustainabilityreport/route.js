export async function GET() {
  const fileUrl =
    "https://djq1fi5m4qrqa.cloudfront.net/pdfs/1758715318270-SustainabilityReport.pdf";

  const res = await fetch(fileUrl);

  if (!res.ok) {
    return new Response("File not found", { status: 404 });
  }

  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=SustainabilityReport.pdf",
    },
  });
}
