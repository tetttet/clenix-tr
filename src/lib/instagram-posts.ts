import { readFileSync } from "node:fs";
import { join } from "node:path";

export type InstagramPost = {
  id: string;
  url: string;
  embedUrl: string;
};

export function getInstagramPosts(): InstagramPost[] {
  const source = readFileSync(join(process.cwd(), "public/embed.txt"), "utf8");
  const urls = source.matchAll(
    /data-instgrm-permalink="(https:\/\/www\.instagram\.com\/(?:reel|p)\/([\w-]+)\/)/g,
  );
  const posts = new Map<string, InstagramPost>();

  for (const match of urls) {
    const [, url, id] = match;
    if (!posts.has(id)) {
      posts.set(id, { id, url, embedUrl: `${url}embed/captioned/` });
    }
  }

  return [...posts.values()];
}
