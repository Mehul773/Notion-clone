/* Client-side SHA-256 for page passwords. Protects content at rest in the
 * UI — not a multi-user ACL. Uses the built-in Web Crypto API (free). */

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
