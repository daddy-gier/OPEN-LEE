export async function callClaude(prompt: string, timeoutMs = 90000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Proxy error: ${res.status} ${body}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text ?? '';
  } catch (err) {
    if ((err as any).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
