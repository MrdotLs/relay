import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { memberships, workspaces } from "../db/schema.js";
import { authenticate } from "../auth/authenticate.js";

export const meRoute: FastifyPluginAsync = async (app) => {
    app.get('/me', {preHandler: authenticate}, async (req) => {
        const user = req.user!;
        const myWorkspaces = await db
        .select({ id : workspaces.id, name: workspaces.name, slug: workspaces.slug, role:memberships.role})
        .from(memberships)
        .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
        .where(eq(memberships.userId, user.id));
    return { user, workspaces:myWorkspaces};
    });
};