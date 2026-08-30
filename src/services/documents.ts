const memoryCache = new Map<string, Promise<Uint8Array>>();

function decodeBase64(base64: string) {
  const binary = atob(base64.trim());
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function loadFromPersistentCache(url: string) {
  if (!('caches' in window)) return null;
  const cache = await caches.open('portfolio-documents-v1');
  const cached = await cache.match(url);
  if (!cached) return null;

  try {
    return decodeBase64(await cached.text());
  } catch {
    await cache.delete(url);
    return null;
  }
}

async function fetchAndCache(url: string) {
  const persistent = await loadFromPersistentCache(url);
  if (persistent) return persistent;

  const response = await fetch(url);
  const body = (await response.text()).trim();
  if (!response.ok || body.startsWith('Document not found')) {
    throw new Error(
      'The linked file is private, missing, or has an incorrect document ID.',
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(body);
  } catch {
    throw new Error(
      'The server did not return a valid PDF. Re-upload it from Admin.',
    );
  }

  if ('caches' in window) {
    const cache = await caches.open('portfolio-documents-v1');
    await cache.put(
      url,
      new Response(body, {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
  const href = URL.createObjectURL(
    new Blob([bytes], { type: 'application/pdf' }),
  );
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}
