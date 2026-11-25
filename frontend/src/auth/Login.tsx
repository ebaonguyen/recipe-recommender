import { useActionState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Link, useNavigate } from "react-router";
import { supabase } from "./supabase";

async function handleLoginForm(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required.", message: "" };
  }

  try {
    // Call Supabase auth system to sign the user in with password
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      return { error: loginError.message, message: "" };
    }

    return {
      error: "",
      message: `Welcome back! Logged in as ${data.user?.email}.`,
    };
  } 
  catch (error) {
    console.error("Login request failed:", error);
    return { error: "Unable to sign in right now. Please try again.", message: "" };
  }
}

function Login({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [state, formAction, isPending] = useActionState(handleLoginForm, {
    error: "",
    message: "",
  });
  useEffect(() => {
    if (state.message && user) navigate("/profile", { replace: true });
  }, [state.message, user, navigate]);

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="page-eyebrow">WELCOME BACK</p>
        <h1 id="login-title">Log in</h1>
        <p className="page-intro">Pick up where you left off with your recipes and ingredients.</p>
        <form className="account-form" action={formAction}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" name="password" autoComplete="current-password" required placeholder="Your password" />
          {state.error && <p className="error" role="alert">{state.error}</p>}
          {state.message && <p className="message" role="status">{state.message}</p>}
          <button type="submit" disabled={isPending}>
            {isPending ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="auth-switch">New here? <Link to="/signup">Create an account</Link></p>
      </section>
    </main>
  );
}

export default Login;
