import { useActionState } from "react";
import { Link } from "react-router";
import { supabase } from "./supabase";

async function handleSignupForm(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required.", message: "" };
  }

  try {
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: "http://localhost:5173/login",
        data: {
          email: email.trim()
        }
      },
    });

    if (signupError) {
      return { error: signupError.message, message: "" };
    }

    return {
      error: "",
      message: data.session
        ? "Your account is ready. You are signed in."
        : "Check your email for a confirmation link to continue.",
    }
  } 
  catch (error) {
    console.error("Signup request failed:", error);
    return { error: "Unable to sign up right now. Please try again.", message: "" };
  }
}


function Signup() {
  const [state, formAction, isPending] = useActionState(handleSignupForm, {
    error: "",
    message: "",
  });

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <p className="page-eyebrow">YOUR KITCHEN, ORGANIZED</p>
        <h1 id="signup-title">Create your account</h1>
        <p className="page-intro">Save recipes you love and keep track of the ingredients you have.</p>
        <form className="account-form" action={formAction}>
          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" type="password" name="password" autoComplete="new-password" required placeholder="Choose a password" />
          {state.error && <p className="error" role="alert">{state.error}</p>}
          {state.message && <p className="message" role="status">{state.message}</p>}
          <button type="submit" disabled={isPending}>
            {isPending ? "Signing up..." : "Create account"}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </section>
    </main>
  );
}

export default Signup;