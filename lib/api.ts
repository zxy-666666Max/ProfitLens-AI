const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Sends receipt files to the backend.
// With no NEXT_PUBLIC_API_URL set, it fakes a 1s upload so the UI works without a backend.
export async function uploadReceipts(files: File[]) {
  if (!API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { uploaded: files.length };
  }

  const body = new FormData();
  files.forEach((file) => body.append("receipts", file));

  const res = await fetch(`${API_URL}/api/receipts`, { method: "POST", body });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json();
}