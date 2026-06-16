import { Router, type Request, type Response } from "express";
import authMiddleware from "../middlewares/auth.middlewares.js";
import { createGroupSchema, groupIdSchema } from "../schemas/group.schema.js";
import z from "zod";
import {
  checkUserPresenceInGroup,
  createGroup,
  getGroups,
  getMessages,
} from "../services/group.services.js";

export const groupRouter: Router = Router();

groupRouter.post("/", authMiddleware, async (req: Request, res: Response) => {
  if (!req.id) {
    return res.status(401).json({ message: "unauthorised" });
  }
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Missing params",
      errors: z.treeifyError(parsed.error),
    });
  }
  const groupInfo = parsed.data;
  const createdGroup = await createGroup(groupInfo, req.id);
  return res.status(200).json({
    message: "Group created successfully",
    createdGroup,
  });
});

groupRouter.get("/", authMiddleware, async (req: Request, res: Response) => {
  if (!req.id) {
    return res.status(401).json({ message: "unauthorised" });
  }
  const groups = await getGroups(req.id);
  return res.status(200).json({
    groups,
  });
});
groupRouter.get(
  "/:groupId/messages",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!req.id) {
      return res.status(401).json({ message: "unauthorised" });
    }
    const parsed = groupIdSchema.safeParse(req.params.groupId);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid group ID",
        error: z.treeifyError(parsed.error),
      });
    }
    const groupId = parsed.data;

    const a: boolean = await checkUserPresenceInGroup(groupId, req.id);
    if (!a) {
      return res.status(403).json({
        message: "You are not a member of this group.",
      });
    }
    const messages = await getMessages(groupId);
    return res.status(200).json({
      messages,
    });
  },
);
