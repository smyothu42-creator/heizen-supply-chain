/**
 * What the product accepts when someone hands it a file, and how it says how
 * big one is.
 *
 * **Shared, because two surfaces take files now** — Sources, where a folder is
 * dropped in and ingested, and the assistant, where one is clipped to a
 * question. Two copies of an `accept` string is how a product ends up refusing
 * a `.heic` in one place and taking it in the other, and the list is not
 * something a reader can check by looking at the screen.
 */
export const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.markdown,.eml,image/*,.heic,.heif";

/** The same phrasing wherever a size is shown. Whole units below a megabyte:
 *  "1.4 MB" is worth a decimal, "37.2 KB" is not. */
export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
