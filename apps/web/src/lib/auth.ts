import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type { LoginInput, SignupInput } from '../../../../packages/shared/src';
import {api, ApiError} from './api';


export type User = {id: string; email: string; name:string};
export type Me = {
    user:User;
    workspaces: {id: string, name:string, slug:string; role: 'owner'|'member'|'viewer'}[];
};

const meKey = ['me'];

export function useMe() {
    return useQuery({
        queryKey: meKey,
        queryFn: async () => {
            try {
                return await api<Me>('/me');
            }catch (err){
                if (err instanceof ApiError && err.status === 401) return null;
                throw err;
            }
        },
    });
}

export function useLogin() {
    const queryClient = useQueryClient();
    return useMutation ({
        mutationFn: (input: LoginInput) => api<{user: User}>('/auth/login', {method:'POST', body: input}),
        onSuccess: () => queryClient.invalidateQueries({queryKey:meKey}),
    });
}

export function useSignup() {
    const queryClient = useQueryClient();
    return useMutation ({
        mutationFn: (input:SignupInput) => api<{user: User}>('/auth/signup', {method : 'POST', body: input}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: meKey}),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api<void>('/auth/logout', {method: 'POST'}),
        onSuccess: () => queryClient.setQueryData(meKey, null),
    });
}