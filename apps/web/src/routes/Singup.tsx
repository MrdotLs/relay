import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useNavigate} from 'react-router';
import { signupSchema } from "@relay/shared";
import { useMe, useSignup } from "../lib/auth";
import { ApiError } from "../lib/api";


export function Signup() {
    const me = useMe();
    const signup = useSignup();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    if (me.data) return <Navigate to="/" replace />;

    function onSubmit(e: SubmitEvent<HTMLFormElement>){
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const parsed = signupSchema.safeParse({
            name: form.get('name'),
            email: form.get('email'),
            password: form.get('password'),
        });
        if(!parsed.success){
            setError(parsed.error.issues[0]?.message ?? 'Check your details');
            return;
        }

        setError(null);
        signup.mutate(parsed.data,{
            onSuccess: () => navigate('/', {replace :true}),
            onError: (err) =>
                setError(err instanceof ApiError && err.status === 409 ? 'That email is registered already' : 'Something went wrong. Try again')
        });
    }
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold">Create your account</h1>
                <label className="block">
                    <span className="text-sm font-medium">Name</span>
                    <input name="name" autoComplete="name" required className="mt-1 w-full rounded border px-3 py-2"/>
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded border px-3 py-2"/>
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Password</span>
                    <input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-1 w-full rounded border px-3 py-2" />
                    <span className="text-xs text-gray-500">At least 8 character</span>
                </label>

                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={signup.isPending} className="w-full rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-50">{signup.isPending ? 'Creating account...' : 'Sign up'}</button>
                <p className="text-sm text-gray-600">Already have an account ? <Link to="/sign-in" className="text-blue-600 underline">Sign in</Link></p>
            </form>
        </main>
    );


}