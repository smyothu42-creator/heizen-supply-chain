"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  account,
  currentProject,
  projects as seedProjects,
  type Project,
  type Priority,
} from "@/lib/projects";
import {
  currentMemberId,
  organisation as seedOrganisation,
  seedInvitations,
  seedMembers,
  type Invitation,
  type Member,
  type Organisation,
  type Role,
} from "@/lib/workspace";

/**
 * Everything above a project, in one place.
 *
 * The projects list, the create form, the team page, the settings form and the
 * masthead's project switcher all read and write the same three arrays. They
 * were four separate static imports for as long as none of them could change
 * anything; the moment a project can be *created*, a switcher reading a frozen
 * module is a switcher that does not list the project you just made.
 *
 * **Held in React state and nowhere else, deliberately.** No `localStorage`:
 * the AI panel's width is a preference and belongs to the reader, while a
 * project is a record and belongs to a server that does not exist yet. Storing
 * records in a browser would make the prototype look like it had saved them.
 * Every surface that writes says so once instead. Same doctrine as the
 * connectors: designed as real, labelled honestly.
 */

interface WorkspaceState {
  organisation: Organisation;
  updateOrganisation: (patch: Partial<Organisation>) => void;

  projects: Project[];
  currentProjectId: string;
  setCurrentProject: (id: string) => void;
  createProject: (draft: ProjectDraft) => Project;
  /** The research inputs, changed after the fact. A first lead is a name and a
      sector; the website, the revenue, the people and the line that biases the
      run all arrive later, usually off the first call. Nothing here touches
      `status` or `researched`: those are the pipeline's readings, and §5's rule
      against hand-editing AI output is about exactly that half. */
  updateProject: (id: string, patch: ProjectDraft) => void;
  /** In or out of the working list. Reversible, unlike delete, so it takes no
      confirm dialog; the row moves to the Archived filter and back. */
  setProjectArchived: (id: string, archived: boolean) => void;
  deleteProject: (id: string) => void;
  /** Somebody pressed *New project* somewhere that is not the Projects page.
      The form asks six questions and one of them is a paragraph, so it lives on
      that page and nowhere else; this is how a caller elsewhere routes there and
      has it open on arrival. A flag in the provider rather than a query
      parameter because the provider survives a client-side navigation and
      `useSearchParams` would put a Suspense boundary around a static page. */
  newProjectAsked: boolean;
  askNewProject: () => void;
  clearNewProjectAsk: () => void;
  /** Somebody has just opened a project, so the shell asks whether anything has
      changed since the last time. A flag rather than a route or a timer,
      because the question belongs to the *act of arriving* and nothing else:
      switching surfaces inside a project must not re-ask it, and neither must a
      re-render. The two ways in set it, the dialog clears it. */
  updateAsked: boolean;
  askForUpdates: () => void;
  clearUpdateAsk: () => void;

  members: Member[];
  /** The signed-in person, resolved once so nothing matches on an address. */
  me: Member;
  updateMemberRole: (id: string, role: Role) => void;
  /** Everything about a person that is theirs to change. Not the role: that is
      somebody else's decision and `updateMemberRole` is where it is made. */
  updateMember: (id: string, patch: Partial<Omit<Member, "id" | "role">>) => void;
  removeMember: (id: string) => void;
  toggleMemberProject: (id: string, projectId: string) => void;

  invitations: Invitation[];
  invite: (email: string, role: Role) => void;
  cancelInvitation: (id: string) => void;
  resendInvitation: (id: string) => void;
}

export interface ProjectDraft {
  name: string;
  sector: string;
  domain?: string;
  revenueCr?: number;
  stakeholders?: string;
  prompt?: string;
  /** The consultant's own triage. Absent means not triaged, which the form
      offers as its own option rather than defaulting to a level nobody chose. */
  priority?: Priority;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace outside WorkspaceProvider");
  return ctx;
};

/* Ids are minted from a counter rather than from `Date.now()` or
   `Math.random()`. Both would be fine inside an event handler and neither is
   worth the habit: this file also seeds render, and the plan panel already
   records what a `new Date()` in a client component costs. */
let nextId = 1;
const mint = (prefix: string) => `${prefix}-new-${nextId++}`;

/** Today, as the workspace reckons it. See `PLAN_START` for why it is a constant. */
export const TODAY = "2026-08-11";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [organisation, setOrganisation] = useState(seedOrganisation);
  const [projects, setProjects] = useState(seedProjects);
  const [currentProjectId, setCurrentProjectId] = useState(currentProject.id);
  const [members, setMembers] = useState(seedMembers);
  const [invitations, setInvitations] = useState(seedInvitations);
  const [newProjectAsked, setNewProjectAsked] = useState(false);

  const [updateAsked, setUpdateAsked] = useState(false);

  const askNewProject = useCallback(() => setNewProjectAsked(true), []);
  const clearNewProjectAsk = useCallback(() => setNewProjectAsked(false), []);
  const askForUpdates = useCallback(() => setUpdateAsked(true), []);
  const clearUpdateAsk = useCallback(() => setUpdateAsked(false), []);

  const updateOrganisation = useCallback(
    (patch: Partial<Organisation>) => setOrganisation((o) => ({ ...o, ...patch })),
    [],
  );

  const createProject = useCallback((draft: ProjectDraft) => {
    const project: Project = {
      id: mint("p"),
      name: draft.name.trim(),
      sector: draft.sector.trim(),
      /* **A new project has no research and the row says so**, which is the
         same honest label the two real Heizen projects already carry. Creating
         a project is not running one: §5 puts creation first precisely so it
         survives a failed upload and can be opened with nothing in it. */
      status: "Created here · nothing ingested yet",
      researched: false,
      createdOn: TODAY,
      domain: draft.domain?.trim() || undefined,
      revenueCr: draft.revenueCr,
      stakeholders: draft.stakeholders?.trim() || undefined,
      prompt: draft.prompt?.trim() || undefined,
      priority: draft.priority,
    };
    setProjects((ps) => [project, ...ps]);
    /* Whoever created it is on it. An admin who makes a project and then cannot
       see it is the first bug anybody files against a permissions model. */
    setMembers((ms) =>
      ms.map((m) =>
        m.id === currentMemberId
          ? { ...m, projectIds: [...m.projectIds, project.id] }
          : m,
      ),
    );
    return project;
  }, []);

  /* The draft's optional fields are written as `undefined` when they are
     cleared rather than left at their old value: a consultant who empties the
     stakeholder box means "we do not know", and a patch that skipped blanks
     would make that the one edit the form cannot make. */
  const updateProject = useCallback(
    (id: string, patch: ProjectDraft) =>
      setProjects((ps) =>
        ps.map((p) =>
          p.id === id
            ? {
                ...p,
                name: patch.name.trim(),
                sector: patch.sector.trim(),
                domain: patch.domain?.trim() || undefined,
                revenueCr: patch.revenueCr,
                stakeholders: patch.stakeholders?.trim() || undefined,
                prompt: patch.prompt?.trim() || undefined,
                priority: patch.priority,
              }
            : p,
        ),
      ),
    [],
  );

  const setProjectArchived = useCallback(
    (id: string, archived: boolean) =>
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, archived } : p))),
    [],
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((ps) => ps.filter((p) => p.id !== id));
    setMembers((ms) =>
      ms.map((m) => ({ ...m, projectIds: m.projectIds.filter((p) => p !== id) })),
    );
    /* If the open project is the one that just went, the switcher has to land
       somewhere real rather than on an id nothing answers to. */
    setCurrentProjectId((open) => (open === id ? currentProject.id : open));
  }, []);

  const updateMemberRole = useCallback(
    (id: string, role: Role) =>
      setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role } : m))),
    [],
  );

  const updateMember = useCallback(
    (id: string, patch: Partial<Omit<Member, "id" | "role">>) =>
      setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m))),
    [],
  );

  const removeMember = useCallback(
    (id: string) => setMembers((ms) => ms.filter((m) => m.id !== id)),
    [],
  );

  const toggleMemberProject = useCallback(
    (id: string, projectId: string) =>
      setMembers((ms) =>
        ms.map((m) =>
          m.id === id
            ? {
                ...m,
                projectIds: m.projectIds.includes(projectId)
                  ? m.projectIds.filter((p) => p !== projectId)
                  : [...m.projectIds, projectId],
              }
            : m,
        ),
      ),
    [],
  );

  const invite = useCallback(
    (email: string, role: Role) =>
      setInvitations((is) => [
        { id: mint("inv"), email: email.trim().toLowerCase(), role, sentOn: TODAY },
        ...is,
      ]),
    [],
  );

  const cancelInvitation = useCallback(
    (id: string) => setInvitations((is) => is.filter((i) => i.id !== id)),
    [],
  );

  const resendInvitation = useCallback(
    (id: string) =>
      setInvitations((is) =>
        is.map((i) => (i.id === id ? { ...i, sentOn: TODAY } : i)),
      ),
    [],
  );

  const me = useMemo(
    () =>
      members.find((m) => m.id === currentMemberId) ?? {
        id: currentMemberId,
        email: account.email,
        role: "owner" as Role,
        title: account.role,
        joinedOn: TODAY,
        projectIds: [],
      },
    [members],
  );

  const value = useMemo(
    () => ({
      organisation,
      updateOrganisation,
      projects,
      currentProjectId,
      setCurrentProject: setCurrentProjectId,
      createProject,
      updateProject,
      setProjectArchived,
      deleteProject,
      newProjectAsked,
      askNewProject,
      clearNewProjectAsk,
      updateAsked,
      askForUpdates,
      clearUpdateAsk,
      members,
      me,
      updateMemberRole,
      updateMember,
      removeMember,
      toggleMemberProject,
      invitations,
      invite,
      cancelInvitation,
      resendInvitation,
    }),
    [
      organisation,
      updateOrganisation,
      projects,
      currentProjectId,
      createProject,
      updateProject,
      setProjectArchived,
      deleteProject,
      newProjectAsked,
      askNewProject,
      clearNewProjectAsk,
      updateAsked,
      askForUpdates,
      clearUpdateAsk,
      members,
      me,
      updateMemberRole,
      updateMember,
      removeMember,
      toggleMemberProject,
      invitations,
      invite,
      cancelInvitation,
      resendInvitation,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
