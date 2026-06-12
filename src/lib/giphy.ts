/* GIPHY REST API for GIF covers. Free-tier key, used directly (no SDK). */

const GIPHY_KEY = "xiZ5tAETqMXkcLqQsqWi7gEjV8VDRIcU";

export type Gif = { id: string; url: string; preview: string; title: string };

/** Trending GIFs when the query is empty, search results otherwise. */
export async function fetchGifs(query: string): Promise<Gif[]> {
  const base = "https://api.giphy.com/v1/gifs";
  const url = query.trim()
    ? `${base}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(
        query.trim()
      )}&limit=18&rating=pg`
    : `${base}/trending?api_key=${GIPHY_KEY}&limit=18&rating=pg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GIPHY request failed (${res.status})`);
  const json = await res.json();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (json.data ?? []).map((g: any) => ({
    id: g.id,
    url: g.images?.original?.url ?? "",
    preview: g.images?.fixed_width?.url ?? "",
    title: g.title ?? "GIF",
  }));
}
