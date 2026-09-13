"use client";

import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PdfPage({ pdfDocument, pageNumber }) {
  const pageRef = useRef(null);
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(pageNumber === 1);

  useEffect(() => {
    if (visible || !pageRef.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !canvasRef.current || !pageRef.current) return undefined;

    let renderTask;
    let cancelled = false;

    const renderPage = async () => {
      const page = await pdfDocument.getPage(pageNumber);
      if (cancelled || !canvasRef.current || !pageRef.current) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(
        1,
        pageRef.current.clientWidth
      );
      const scale = availableWidth / baseViewport.width;
      const outputScale = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * outputScale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / outputScale)}px`;
      canvas.style.height = `${Math.floor(viewport.height / outputScale)}px`;

      renderTask = page.render({ canvas, canvasContext: context, viewport });
      await renderTask.promise;
    };

    renderPage().catch((error) => {
      if (error?.name !== "RenderingCancelledException") {
        console.error("Unable to render PDF page:", error);
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDocument, pageNumber, visible]);

  return (
    <Box
      ref={pageRef}
      sx={{
        width: { xs: "100%", md: "50%" },
        maxWidth: "100%",
        minHeight: 320,
        display: "flex",
        justifyContent: "center",
        bgcolor: "grey.200",
        boxShadow: 2,
      }}
    >
      {visible ? <canvas ref={canvasRef} /> : null}
    </Box>
  );
}

export default function PdfPreview({ fileUrl, title, errorMessage }) {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadingTask;
    let documentToDestroy;

    const loadPdf = async () => {
      try {
        setPdfDocument(null);
        setError("");

        const library = await import("pdfjs-dist/legacy/build/pdf.mjs");
        library.GlobalWorkerOptions.workerSrc = workerSrc;
        loadingTask = library.getDocument({ url: fileUrl });
        const loadedPdf = await loadingTask.promise;

        if (cancelled) {
          await loadedPdf.destroy();
          return;
        }

        documentToDestroy = loadedPdf;
        setPdfDocument(loadedPdf);
      } catch (loadError) {
        if (!cancelled) {
          console.error("Unable to load PDF:", loadError);
          setError(errorMessage || "Unable to preview this PDF.");
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
      documentToDestroy?.destroy();
    };
  }, [errorMessage, fileUrl]);

  if (error) {
    return (
      <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
        {error}
      </Typography>
    );
  }

  if (!pdfDocument) {
    return <CircularProgress aria-label={`Loading ${title || "PDF"}`} />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        p: { xs: 1, sm: 2 },
        bgcolor: "grey.300",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
        {Array.from({ length: pdfDocument.numPages }, (_, index) => (
          <PdfPage
            key={index + 1}
            pdfDocument={pdfDocument}
            pageNumber={index + 1}
          />
        ))}
      </Box>
    </Box>
  );
}
