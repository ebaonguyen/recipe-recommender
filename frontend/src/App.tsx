import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import Recipes from "./pages/Recipes";
import SavedRecipes from "./pages/SavedRecipes";
import Signup from "./auth/Signup";
import Login from "./auth/Login";
import Profile from "./pages/Profile";
import { supabase } from "./auth/supabase";
import { clearLastActivity, IDLE_TIMEOUT_MS, useIdleLogout } from "./auth/useIdleLogout";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    let authChanged = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authChanged = true;
        if (event === "SIGNED_OUT") clearLastActivity();
        if (event === "SIGNED_IN") setAuthNotice("");
        if (active) {
          setUser(session?.user ?? null);
          setAuthError("");
          setLoading(false);
        }
      },
    );

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active && !authChanged) {
          setUser(data.session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Unable to load session:", error);
        if (active && !authChanged) {
          setAuthError("Unable to load your session. Please reload to try again.");
          setLoading(false);
        }
      }
    }

    void loadSession();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logOut = useCallback(async (reason: "manual" | "idle"): Promise<boolean> => {
    setSigningOut(true);
    try {
      // "local" ends only this browser's session; other devices stay signed in.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      clearLastActivity();
      setAuthNotice(
        reason === "idle"
          ? `You were logged out after ${Math.round(IDLE_TIMEOUT_MS / 60_000)} minutes of inactivity.`
          : "You have been logged out.",
      );
      navigate("/login", { replace: true });
      return true;
    } catch (error) {
      console.error("Sign out failed:", error);
      setAuthNotice("Unable to log out right now. Please check your connection and try again.");
      return false;
    } finally {
      setSigningOut(false);
    }
  }, [navigate]);

  const handleIdleTimeout = useCallback(() => logOut("idle"), [logOut]);
  useIdleLogout(!!user, handleIdleTimeout);

  return (
    <>
      <nav>
        <Link to="/">Home</Link>{" "}
        <Link to="/recipes">Recipes</Link>{" "}
        {user && <Link to="/saved">Saved</Link>}{" "}
        {user &&<Link to="/inventory">Inventory</Link>}{" "}
        {!user && <><Link to="/signup">Signup</Link>{" "}</>}
        {!user && <><Link to="/login">Login</Link>{" "}</>}
        {user && <><Link to="/profile">Profile</Link>{" "}</>}
        {user && (
          <button type="button" onClick={() => void logOut("manual")} disabled={signingOut}>
            {signingOut ? "Logging out..." : "Log out"}
          </button>
        )}
      </nav>

      {authError && <p role="alert">{authError}</p>}
      {authNotice && <p role="status">{authNotice}</p>}
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        
        <Route path="/recipes" element={<Recipes user={user} />} />
        <Route
          path="/saved"
          element={
            loading ? <p role="status">Loading saved recipes...</p> :
            authError ? null :
            user ? <SavedRecipes key={user.id} user={user} /> :
            <Navigate to="/login" replace />
          }
        />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={
            loading ? <p role="status">Loading profile...</p> :
            authError ? null :
            user ? <Profile key={user.id} user={user} /> :
            <Navigate to="/login" replace />
          }
        />
        
      </Routes>
    </>
  );
}

export default App;

