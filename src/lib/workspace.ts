/**
 * The workspace: the organisation, the people in it, and who they can see.
 *
 * Everything above a project. Meridian is project-first (CLAUDE.md §5), which
 * only means something if there is a level above a project to create one from,
 * and that level is this: one organisation, a list of people, a role each, and
 * a set of projects each of them is on.
 *
 * The shape is taken from the production app rather than invented here, so the
 * two do not have to be reconciled later: owner / admin / member, invitations
 * that are sent and can be cancelled or resent, and per-project assignment. The
 * words and the money are Meridian's.
 *
 * **Designed as real, labelled honestly**, the same rule as the connectors and
 * `RunButton`. Nothing here reaches a server. Changes live in the tab and go
 * when it closes, and every surface that writes says so once rather than
 * pretending a save happened.
 */

export type Role = "owner" | "admin" | "member";

/** Ordered by what each may do, which is the order the picker offers them in. */
export const ROLES: Role[] = ["owner", "admin", "member"];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

/**
 * What a role actually buys, in words a consultant can read.
 *
 * A role list with no glosses is three nouns and a guess. §7.6: where a term
 * must appear, gloss it inline once.
 */
export const ROLE_MEANING: Record<Role, string> = {
  owner: "Everything an admin can do, plus billing and deleting the workspace.",
  admin: "Creates projects, invites people, and changes what anyone can see.",
  member: "Reads and works in the projects they have been put on.",
};

export const canManage = (role: Role) => role === "owner" || role === "admin";

export interface Organisation {
  name: string;
  /** The part of a URL. Fixed once it exists, which is why the field is read only. */
  slug: string;
  /** A real logo the moment there is one. Until then the monogram stands in. */
  logoUrl?: string;
  /** Shown under the name on the settings form. */
  line: string;
}

export const organisation: Organisation = {
  name: "Heizen",
  slug: "heizen",
  line: "Supply chain consulting. Discovery, then delivery.",
};

export interface Member {
  id: string;
  /**
   * The person's name where we have one. **Not invented from the email** when
   * we do not: an address is not a display name, and a prototype that guesses
   * one is showing a real person something untrue about themselves. The row
   * falls back to the address, which is the identity anyway.
   */
  name?: string;
  email: string;
  role: Role;
  /** What they do, which is not the same question as what they may do. */
  title: string;
  /** ISO. Formatted with `formatDay` so it reads `6 Aug 2026` like every other date. */
  joinedOn: string;
  /** Which projects they can open. Owners and admins see all of them regardless. */
  projectIds: string[];
  photoUrl?: string;
}

/**
 * The team, and it is the real one: the review chain in CLAUDE.md §6 is Sai
 * (design) to Aman, Abhilasha and Jeet (feedback) to Jeet (implementation).
 *
 * The signed-in account is Sai, and it is one row rather than two. It used to
 * be `yashvi@heizen.work` with no name on it, sitting above a separate Sai
 * further down the list, so the same person appeared twice and the one you were
 * signed in as was the one with nothing to call it. Merged: one entry, named,
 * and it owns the workspace.
 */
export const seedMembers: Member[] = [
  {
    id: "mem-sai",
    name: "Sai",
    email: "sai@heizen.work",
    role: "owner",
    title: "Design",
    joinedOn: "2026-01-12",
    projectIds: ["p-suvarna", "p-kesarwani", "p-deccan"],
  },
  {
    id: "mem-jeet",
    name: "Jeet",
    email: "jeet@heizen.work",
    role: "admin",
    title: "Engineering",
    joinedOn: "2026-02-03",
    projectIds: ["p-suvarna", "p-kesarwani", "p-deccan"],
  },
  {
    id: "mem-aman",
    name: "Aman",
    email: "aman@heizen.work",
    role: "member",
    title: "Delivery",
    joinedOn: "2026-04-20",
    projectIds: ["p-kesarwani"],
  },
  {
    id: "mem-abhilasha",
    name: "Abhilasha",
    email: "abhilasha@heizen.work",
    role: "member",
    title: "Delivery",
    joinedOn: "2026-04-20",
    projectIds: ["p-suvarna"],
  },
];

/** The signed-in person. One id, so nothing has to match on the address. */
export const currentMemberId = "mem-sai";

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  /** ISO. An invitation with no date on it cannot be read as stale. */
  sentOn: string;
}

export const seedInvitations: Invitation[] = [
  {
    id: "inv-1",
    email: "rhea@heizen.work",
    role: "member",
    sentOn: "2026-08-04",
  },
  {
    id: "inv-2",
    email: "karthik@heizen.work",
    role: "admin",
    sentOn: "2026-08-09",
  },
];

/**
 * How long an invitation is worth chasing. Seven days is the production
 * default; what it is for here is the *Sent 7 days ago* reading on the row,
 * which is the whole reason the date is stored rather than the status.
 */
export const INVITE_EXPIRY_DAYS = 7;
