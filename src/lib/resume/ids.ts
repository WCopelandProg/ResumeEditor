import { customAlphabet } from "nanoid";

// Short, URL-safe, collision-resistant ids for resume tree nodes
// (sections/entries/bullets). Prefixed so a bare id string is easy to
// recognize in logs, suggestions, and DOM ids used for scroll-to-highlight.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 12);

export function newSectionId() {
  return `sec_${nano()}`;
}
export function newEntryId() {
  return `ent_${nano()}`;
}
export function newBulletId() {
  return `blt_${nano()}`;
}
