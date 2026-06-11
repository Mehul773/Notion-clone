/// <reference types="vite/client" />

interface Window {
  slate?: {
    setTheme: (theme: "light" | "dark") => void;
    zoom: (delta: number) => void;
  };
}

declare module "@emoji-mart/data" {
  interface EmojiSkin {
    native: string;
  }
  interface Emoji {
    id: string;
    name: string;
    keywords: string[];
    skins: EmojiSkin[];
  }
  interface Category {
    id: string;
    emojis: string[];
  }
  interface EmojiData {
    categories: Category[];
    emojis: Record<string, Emoji>;
  }
  const data: EmojiData;
  export default data;
}
