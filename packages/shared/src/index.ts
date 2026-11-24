import { z } from 'zod';

export const signupSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
    name: z.string().trim().min(1, 'Enter your name').max(100),
    password: z.string().min(8, 'Password must be 8 characters long').max(200),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
    password: z.string().min(1, 'Enter your password'),
});

export const createWorkspaceSchema = z.object ({
    name: z.string().trim().min(1, 'Enter workspace name').max(100, 'Name is too Long'),
});

export const createBoardSchema = z.object({
    name: z.string().trim().min(1, 'Enter board name').max(100, 'Name is too long'),
});



export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;