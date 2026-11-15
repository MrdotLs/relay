import {pgEnum, uuid, text, timestamp, primaryKey, pgTable, index, integer, date } from "drizzle-orm/pg-core";



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

export const boards = pgTable('boards', {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, {onDelete: 'cascade'}),
    name: text('name').notNull(),
}, (t) => [index('boards_workspace_idx').on(t.workspaceId)]);

export const boardColumns = pgTable('board_columns', {
    id: uuid('id').primaryKey().defaultRandom(),
    boardId : uuid('board_id').notNull().references(() => boards.id, {onDelete:'cascade'}),
    name: text('name').notNull(),
    position: text('position').notNull(),
}, (t) => [index('board_columns_board_idx').on(t.boardId)]);

export const cards = pgTable('cards',{
    id: uuid('id').primaryKey().defaultRandom(),
    boardId: uuid('board_id').notNull().references(() => boards.id, {onDelete:'cascade'}),
    columnId: uuid('column_id').notNull().references(() => boardColumns.id, {onDelete:'cascade'}),
    title: text('title').notNull(),
    description: text('description'),
    assignedId: uuid('assignee_id').references(() => users.id, {onDelete:'set null'}),
    dueDate: date('due_date'),
    position: text('position').notNull(),
    version: integer('version').notNull().default(1),
    updatedAt:timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
}, (t) => [
    index('cards_column_position_index').on(t.columnId, t.position),
    index('card_board_idx').on(t.boardId),
]);

export const labels = pgTable('labels', {
    id: uuid('id').primaryKey().defaultRandom(),
    boardId: uuid('board_id').notNull().references(() => boards.id, {onDelete:'cascade'}),
    name: text('name').notNull(),
    color: text('color').notNull(),
});


export const cardLabels = pgTable('card_labels', {
    cardId: uuid('card_id').notNull().references(() => cards.id, {onDelete : 'cascade'}),
    labelId: uuid('label_id').notNull().references(() => labels.id, {onDelete: 'cascade'}),
}, (t) => [primaryKey({columns: [t.cardId, t.labelId]})]);

