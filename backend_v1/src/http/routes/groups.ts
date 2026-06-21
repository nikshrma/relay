import { Router, type Request, type Response } from "express";
import authMiddleware from "../middlewares/auth.middlewares.js";
import {
  addMembersSchema,
  createGroupSchema,
  groupIdSchema,
  userIdScehma,
  roleSchema,
} from "../schemas/group.schema.js";
import z from "zod";
import {
  addMembers,
  checkUserPresenceInGroup,
  createGroup,
  getGroups,
  getMessages,
  removeMembersFromGroup,
  checkUserAdminInGroup,
  getGroupDetails,
  leaveGroup,
  updateMemberRole,
  deleteGroup,
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

    const a: boolean = await checkUserPresenceInGroup(groupId, [req.id]);
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
groupRouter.post(
  "/:groupId/members",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!req.id) {
      return res.status(401).json({ message: "unauthorised" });
    }
    const parsed = addMembersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid memberIds",
        error: z.treeifyError(parsed.error),
      });
    }
    const members = parsed.data;
    const parsedGroupId = groupIdSchema.safeParse(req.params.groupId);
    if (!parsedGroupId.success) {
      return res.status(400).json({
        message: "Invalid group ID",
        error: z.treeifyError(parsedGroupId.error),
      });
    }
    const groupId = parsedGroupId.data;
    const isAdmin = await checkUserAdminInGroup(groupId, req.id);
    if (!isAdmin) {
      return res.status(403).json({
        message: "You must be an admin to add members.",
      });
    }
    const addedMembers = await addMembers(members, groupId);
    return res.status(200).json({
      addedMembers,
    });
  },
);
groupRouter.delete(
  "/:groupId/members",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!req.id) {
      return res.status(401).json({ message: "unauthorised" });
    }
    const parsed = userIdScehma.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid member Ids",
        error: z.treeifyError(parsed.error),
      });
    }
    const members = parsed.data;
    const parsedGroupId = groupIdSchema.safeParse(req.params.groupId);
    if (!parsedGroupId.success) {
      return res.status(400).json({
        message: "Invalid group ID",
        error: z.treeifyError(parsedGroupId.error),
      });
    }
    const groupId = parsedGroupId.data;
    const isAdmin = await checkUserAdminInGroup(groupId, req.id);
    if (!isAdmin) {
      return res.status(403).json({
        message: "You must be an admin to remove members.",
      });
    }

    const b: boolean = await checkUserPresenceInGroup(groupId, members);
    if (!b) {
      return res.status(403).json({
        message: "User is not a member of this group.",
      });
    }
    await removeMembersFromGroup(groupId, members);
    return res.json({
      message: "Removed users",
    });
  },
);

groupRouter.get(
  "/:groupId",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!req.id) return res.status(401).json({ message: "unauthorised" });
    
    const parsedGroupId = groupIdSchema.safeParse(req.params.groupId);
    if (!parsedGroupId.success) return res.status(400).json({ message: "Invalid group ID" });
    const groupId = parsedGroupId.data;

    const isMember = await checkUserPresenceInGroup(groupId, [req.id]);
    if (!isMember) return res.status(403).json({ message: "You are not a member of this group." });

    const groupDetails = await getGroupDetails(groupId);
    if (!groupDetails) return res.status(404).json({ message: "Group not found" });
    
    return res.status(200).json({ group: groupDetails });
  }
);

groupRouter.delete(
  "/:groupId/leave",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!req.id) return res.status(401).json({ message: "unauthorised" });
    
    const parsedGroupId = groupIdSchema.safeParse(req.params.groupId);
    if (!parsedGroupId.success) return res.status(400).json({ message: "Invalid group ID" });
    const groupId = parsedGroupId.data;

    const isMember = await checkUserPresenceInGroup(groupId, [req.id]);
    if (!isMember) return res.status(403).json({ message: "You are not a member of this group." });

    await leaveGroup(groupId, req.id);
    return res.status(200).json({ message: "Successfully left the group" });
  }
);

groupRouter.patch(
  "/:groupId/members/:userId/role",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!req.id) return res.status(401).json({ message: "unauthorised" });
    
    const parsedGroupId = groupIdSchema.safeParse(req.params.groupId);
    const parsedUserId = z.string().uuid().safeParse(req.params.userId);
    const parsedRole = roleSchema.safeParse(req.body.role);

    if (!parsedGroupId.success || !parsedUserId.success || !parsedRole.success) {
      return res.status(400).json({ message: "Invalid parameters or body" });
    }

    const groupId = parsedGroupId.data;
    const targetUserId = parsedUserId.data;
    const newRole = parsedRole.data;

    const isAdmin = await checkUserAdminInGroup(groupId, req.id);
    if (!isAdmin) return res.status(403).json({ message: "You must be an admin to update roles." });

    const isTargetMember = await checkUserPresenceInGroup(groupId, [targetUserId]);
    if (!isTargetMember) return res.status(404).json({ message: "Target user is not in the group." });

    await updateMemberRole(groupId, targetUserId, newRole);
    return res.status(200).json({ message: "Role updated successfully" });
  }
);

groupRouter.delete(
  "/:groupId",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!req.id) return res.status(401).json({ message: "unauthorised" });
    
    const parsedGroupId = groupIdSchema.safeParse(req.params.groupId);
    if (!parsedGroupId.success) return res.status(400).json({ message: "Invalid group ID" });
    const groupId = parsedGroupId.data;

    const isAdmin = await checkUserAdminInGroup(groupId, req.id);
    if (!isAdmin) return res.status(403).json({ message: "You must be an admin to delete the group." });

    await deleteGroup(groupId);
    return res.status(200).json({ message: "Group deleted successfully" });
  }
);
