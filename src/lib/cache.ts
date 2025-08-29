import NodeCache from "node-cache";

let cache: NodeCache | null = null;

export function getCache() {
  if (cache) return cache;
  cache = new NodeCache();
  return cache;
}
