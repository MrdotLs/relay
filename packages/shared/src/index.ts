import { email, z } from 'zod';

export const signupSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    name: z.string().trim().min(1).max(100),
    password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type loginInput = z.infer<typeof loginSchema>;