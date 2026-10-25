import { useActionState } from "react";
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
    <form action={formAction}>
      <input type="email" name="email" required placeholder="Email" />
      <input type="password" name="password" required placeholder="Password" />
      
      {state.error && <p className="error">{state.error}</p>}
      {state.message && <p className="message">{state.message}</p>}
      
      <button type="submit" disabled={isPending}>
        {isPending ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}

export default Signup;