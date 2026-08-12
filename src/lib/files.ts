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

/**
 * What each kind of source is made of, when you are replacing one.
 *
 * Ingestion takes anything, because a consultant drops a folder in and the
 * pipeline decides what each file is. Replacing is the opposite act: the kind
 * is already known, so the picker should offer what that kind actually arrives
 * as. A filing is a document or a spreadsheet, a transcript is text or
 * captions, an email is an export from a mail client.
 *
 * **`web` has no entry, and that is the point of the table.** A web source is
 * an address rather than a file, so the control for it is a URL box and not a
 * picker. Anything reading this map has to handle that case rather than
 * defaulting to a file input, which is why the type says so.
 */
export const REPLACE_ACCEPT: Record<"filing" | "transcript" | "email", string> = {
  filing: ".pdf,.doc,.docx,.xls,.xlsx,.csv",
  transcript: ".txt,.md,.markdown,.vtt,.srt,.doc,.docx,.pdf",
  email: ".eml,.msg,.txt,.pdf",
};

/** The same phrasing wherever a size is shown. Whole units below a megabyte:
 *  "1.4 MB" is worth a decimal, "37.2 KB" is not. */
export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
