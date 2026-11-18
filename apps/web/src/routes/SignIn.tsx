import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { loginSchema } from "@relay/shared";
import { useLogin, useMe } from "../lib/auth";
import { ApiError } from "../lib/api";



export function SignIn() {
    const me = useMe();
    const login = useLogin();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);

    const from = (location.state as {from?: string} | null)?.from ?? '/';

    if(me.data) return <Navigate to={from} replace />

    function onSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const parsed = loginSchema.safeParse({email: form.get('email'), password: form.get('password')});
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? 'Check your details');
            return;
        }
        setError(null);
        login.mutate(parsed.data, {
            onSuccess: () => navigate(from, {replace: true}),
            onError: (err) => 
                setError(err instanceof ApiError && err.status === 401 ? 'Wrong email or password.' : 'Something went wrong. Try again'),
        });

    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold"> Sign in to Relay</h1>
                    <label className="block">
                        <span className="text-sm font-medium">Email</span>
                        <input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded border px-3 py-2"/>

                    </label>

                    <label className="block">
                        <span className="text-sm font-medium">Password</span>
                        <input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded border px-3 py-2"/>
                    </label>

                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={login.isPending} className="w-full rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-50">{login.isPending ? 'Signing in...': 'Sign in'}</button>
                    <p className="text-sm text-gray-600">
                        No account? <Link to="/sign-up" className="text-blue-600 underline">Sign up</Link>
                    </p>
            </form>
        </main>
    )
}