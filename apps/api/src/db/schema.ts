import {pgEnum, uuid, text, timestamp, primaryKey, pgTable } from "drizzle-orm/pg-core";

export const role = pgEnum('role', ['owner', 'member', 'viewer']);

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow()

});

export const sessions = pgTable('sessions',{
    id: text('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
    expiresAt: timestamp('expires_at', {withTimezone: true}).notNull(),
});

export const workspaces = pgTable('workspaces', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug : text('slug').notNull().unique(),
});

export const memberships = pgTable('memberships', {
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, {onDelete: 'cascade'}),
    userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
    role: role('role').notNull(),
}, (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })]);

