"use client";

import { useRouter } from "next/navigation";
import { useWorkspace } from "./WorkspaceProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The question the product asks on the way into a project: *do you have
 * anything to update today?*
 *
 * On request. The reason it is worth a dialog rather than a line on a page is
 * §4's chain: everything in here traces back to a source, so a dossier is only
 * as current as the last thing dropped into Sources. A consultant who has just
 * come off a call is holding the most valuable input the pipeline will get all
 * week, and the moment he is most likely to hand it over is the moment he opens
 * the project. Two clicks later he is reading the old research instead, and the
 * transcript stays in his downloads folder.
 *
 * **Yes goes to Sources and nowhere else.** Sources is where an upload lands,
 * and sending him to a general "add something" screen that then asks him what
 * kind of thing it is would be the same question twice.
 *
 * **It asks once per arrival, not once per render or once per surface.** The
 * flag is set by the two ways into a project — *View project* on the Projects
 * page and picking a company in the masthead switcher — and cleared by whatever
 * dismisses this. Moving between the seven surfaces afterwards must not re-ask
 * it: a dialog that reappears on every navigation is one that gets dismissed
 * without being read, which is worse than never asking.
 *
 * **Nothing is remembered across a reload**, which is the honest scope of a
 * prototype with no server. When this is wired, the thing to store is when the
 * project last had a source added, so the question can go unasked on a day when
 * it has already been answered.
 */
export function UpdateAsk() {
  const router = useRouter();
  const { updateAsked, clearUpdateAsk, projects, currentProjectId } = useWorkspace();
  const project = projects.find((p) => p.id === currentProjectId);

  const close = () => clearUpdateAsk();

  return (
    <Dialog open={updateAsked} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Do you have anything to update today?</DialogTitle>
        </DialogHeader>

        {/* The project is named here and nowhere else in the box. It is the one
            fact that makes the question answerable: a consultant with three
            clients open has to know which one is being asked about. */}
        <DialogBody>
          <DialogDescription className="mt-0 reading">
            A call recording, a file, an email thread. Anything new on{" "}
            {project ? project.name : "this project"} goes into Sources, and the
            research is rebuilt from it.
          </DialogDescription>
        </DialogBody>

        {/* **"Not today", not "No".** A bare no reads as a decision about the
            product rather than about this morning, and the honest answer most
            days is that nothing has changed since yesterday. It is also the
            secondary button: the useful outcome is the upload, and §7 spends
            the boldness in one place per screen. */}
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Not today
          </Button>
          <Button
            onClick={() => {
              close();
              router.push("/sources");
            }}
          >
            Yes, add it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
