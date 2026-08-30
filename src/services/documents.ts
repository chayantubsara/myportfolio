const memoryCache = new Map<string, Promise<Uint8Array>>();

function decodeBase64(base64: string) {
  const binary = atob(base64.trim());
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function loadFromPersistentCache(url: string) {
  if (!('caches' in window)) return null;
  const cache = await caches.open('portfolio-documents-v2');
  const cached = await cache.match(url);
  if (!cached) return null;
  return new Uint8Array(await cached.arrayBuffer());
}

async function fetchAndCache(url: string) {
  const persistent = await loadFromPersistentCache(url);
  if (persistent) return persistent;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('The document could not be downloaded.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  let bytes: Uint8Array;

  if (contentType.includes('application/pdf')) {
    bytes = new Uint8Array(await response.clone().arrayBuffer());
  } else {
    const body = (await response.clone().text()).trim();
    if (body.startsWith('Document not found')) {
      throw new Error(
        'The linked file is private, missing, or has an incorrect document ID.',
      );
    }
    try {
      bytes = decodeBase64(body);
    } catch {
      throw new Error(
        'The server did not return a valid PDF. Check the public file path.',
      );
    }
  }

  if ('caches' in window) {
    const cache = await caches.open('portfolio-documents-v2');
    await cache.put(
      url,
      new Response(bytes, {
        headers: { 'Content-Type': 'application/pdf' },
      }),
    );
  }

  return bytes;
}

export function loadDocumentBytes(url: string) {
  const existing = memoryCache.get(url);
  if (existing) return existing;

  const request = fetchAndCache(url).catch((error) => {
    memoryCache.delete(url);
    throw error;
  });
  memoryCache.set(url, request);
  return request;
}

export function prefetchDocuments(urls: string[]) {
  urls.forEach((url) => {
    void loadDocumentBytes(url).catch(() => undefined);
  });
}

export async function downloadDocument(url: string, fileName: string) {
  const bytes = await loadDocumentBytes(url);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const href = URL.createObjectURL(
    new Blob([buffer], { type: 'application/pdf' }),
  );
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}
