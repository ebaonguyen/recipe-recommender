import { useActionState } from "react";
// import "./Login.css"; // or share the same stylesheet if styles are identical
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

function Login() {
  const [state, formAction, isPending] = useActionState(handleLoginForm, {
    error: "",
    message: "",
  });

  return (
    <form action={formAction}>
      <h2>Log In</h2>
      <input type="email" name="email" required placeholder="Email" />
      <input type="password" name="password" required placeholder="Password" />
      
      {state.error && <p className="error">{state.error}</p>}
      {state.message && <p className="message">{state.message}</p>}
      
      <button type="submit" disabled={isPending}>
        {isPending ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}

export default Login;
