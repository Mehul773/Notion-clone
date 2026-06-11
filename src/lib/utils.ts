export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  debounced.flush = (...args: Args) => {
    clearTimeout(timer);
    fn(...args);
  };
  return debounced;
}

export const COVER_GRADIENTS: { name: string; css: string }[] = [
  { name: "Dusk", css: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Sunset", css: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
  { name: "Flamingo", css: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Ocean", css: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Meadow", css: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { name: "Blush", css: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "Aurora", css: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)" },
  { name: "Sand", css: "linear-gradient(135deg, #e8d5b7 0%, #b8956a 100%)" },
  { name: "Slate", css: "linear-gradient(135deg, #485563 0%, #29323c 100%)" },
  { name: "Rose", css: "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)" },
  { name: "Forest", css: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)" },
  { name: "Plum", css: "linear-gradient(135deg, #614385 0%, #516395 100%)" },
];

/** Named tag colors, Notion-style. Users can pick one per option; unpicked
 * options fall back to a stable hash of the option text. */
export const TAG_PALETTE: { id: string; label: string; bg: string; fg: string }[] = [
  { id: "gray", label: "Gray", bg: "rgba(69,75,78,0.18)", fg: "#5a6066" },
  { id: "brown", label: "Brown", bg: "rgba(140,100,70,0.22)", fg: "#8a5a3b" },
  { id: "orange", label: "Orange", bg: "rgba(217,115,13,0.2)", fg: "#b35b08" },
  { id: "yellow", label: "Yellow", bg: "rgba(203,145,47,0.22)", fg: "#a8761c" },
  { id: "green", label: "Green", bg: "rgba(68,131,97,0.2)", fg: "#3a7a55" },
  { id: "blue", label: "Blue", bg: "rgba(35,131,226,0.18)", fg: "#1d6fc4" },
  { id: "purple", label: "Purple", bg: "rgba(144,101,176,0.22)", fg: "#8052a3" },
  { id: "pink", label: "Pink", bg: "rgba(193,76,138,0.18)", fg: "#b13578" },
  { id: "red", label: "Red", bg: "rgba(212,76,71,0.18)", fg: "#c23d38" },
  { id: "teal", label: "Teal", bg: "rgba(38,148,150,0.2)", fg: "#1f7e80" },
];

export function tagColor(
  option: string,
  optionColors?: Record<string, string>
) {
  const explicit = optionColors?.[option];
  if (explicit) {
    const found = TAG_PALETTE.find((c) => c.id === explicit);
    if (found) return found;
  }
  let hash = 0;
  for (let i = 0; i < option.length; i++) {
    hash = (hash * 31 + option.charCodeAt(i)) | 0;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

export function parseEmbedUrl(raw: string): string | null {
  let url = raw.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
      const embed = u.pathname.match(/^\/embed\/([\w-]+)/);
      if (embed) return url;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/\/(\d+)/);
      if (id) return `https://player.vimeo.com/video/${id[1]}`;
    }
    return url;
  } catch {
    return null;
  }
}
