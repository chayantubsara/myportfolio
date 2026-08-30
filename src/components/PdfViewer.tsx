import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export function PdfViewer({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<any>();
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    setDocument(undefined);
    setPage(1);

    fetch(url)
      .then(async (response) => {
        const body = (await response.text()).trim();
        if (!response.ok || body.startsWith('Document not found')) {
          throw new Error(
            'The linked file is private, missing, or has an incorrect document ID.',
          );
        }

        try {
          const binary = atob(body);
          return Uint8Array.from(binary, (character) =>
            character.charCodeAt(0),
          );
        } catch {
          throw new Error(
            'The server did not return a valid PDF. Re-upload this document from Admin.',
          );
        }
      })
      .then((bytes) => pdfjs.getDocument({ data: bytes }).promise)
      .then((loadedDocument) => {
        if (active) setDocument(loadedDocument);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to open this document.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [url]);

  useEffect(() => {
    if (!document || !canvas.current) return;

    let active = true;
    document.getPage(page).then((pdfPage: any) => {
      if (!active || !canvas.current) return;
      const viewport = pdfPage.getViewport({ scale });
      const context = canvas.current.getContext('2d');
      if (!context) return;
      canvas.current.width = viewport.width;
      canvas.current.height = viewport.height;
      pdfPage.render({
        canvas: canvas.current,
        canvasContext: context,
        viewport,
      });
    });

    return () => {
      active = false;
    };
  }, [document, page, scale]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="viewer">
        <header>
          <strong>{title}</strong>
          <div className="viewer-actions">
            <button
              onClick={() => setScale((value) => Math.max(0.6, value - 0.15))}
              aria-label="Zoom out"
            >
              <Minus />
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((value) => Math.min(2.5, value + 0.15))}
              aria-label="Zoom in"
            >
              <Plus />
            </button>
            <button
              onClick={() =>
                documentQuery('.viewer')?.requestFullscreen()
              }
              aria-label="Fullscreen"
            >
              <Maximize />
            </button>
            <button onClick={onClose} aria-label="Close">
              <X />
            </button>
          </div>
        </header>

        {error ? (
          <div className="empty-state">
            <strong>Document could not be opened</strong>
            <p>{error}</p>
          </div>
        ) : (
          <div className="canvas-wrap">
            <canvas ref={canvas} />
          </div>
        )}

        <footer>
          <button
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft /> Previous
          </button>
          <span>
            Page {page} of {document?.numPages || '–'}
          </span>
          <button
            disabled={!document || page >= document.numPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next <ChevronRight />
          </button>
        </footer>
      </div>
    </div>
  );
}

function documentQuery(selector: string) {
  return window.document.querySelector<HTMLElement>(selector);
}
