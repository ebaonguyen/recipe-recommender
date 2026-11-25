import { useActionState, useState } from "react";
import { Link } from "react-router";
import { supabase } from "./supabase";

async function handleSignupForm(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Email and both password fields are required.", message: "" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", message: "" };
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
      if (signupError.code === "user_already_exists") {
        return { error: "An account already exists with this email.", message: "" };
      }
      return { error: signupError.message, message: "" };
    }

    if (data.user?.identities?.length === 0) {
      return { error: "An account already exists with this email.", message: "" };
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, formAction, isPending] = useActionState(async (previousState: { error: string; message: string }, formData: FormData) => {
    const result = await handleSignupForm(previousState, formData);
    if (!result.error) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
    return result;
  }, {
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
          <input id="signup-email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" type="password" name="password" autoComplete="new-password" required placeholder="Choose a password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <label htmlFor="signup-confirm-password">Confirm password</label>
          <input id="signup-confirm-password" type="password" name="confirmPassword" autoComplete="new-password" required placeholder="Confirm your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
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