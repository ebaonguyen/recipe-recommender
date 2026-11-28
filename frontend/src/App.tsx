import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import FindRecipes from "./pages/FindRecipes";
import GenerateRecipePage from "./pages/GenerateRecipe";
import SavedRecipes from "./pages/SavedRecipes";
import Signup from "./auth/Signup";
import Login from "./auth/Login";
import Profile from "./pages/Profile";
import { supabase } from "./auth/supabase";
import { clearLastActivity, IDLE_TIMEOUT_MS, useIdleLogout } from "./auth/useIdleLogout";
import "./index.css";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!authNotice) return;
    const timer = setTimeout(() => setAuthNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [authNotice]);

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
      <nav className="app-nav" aria-label="Main navigation">
        <NavLink className="nav-brand" to="/" end aria-label="PantryPal home"><span>PantryPal</span></NavLink>
        <NavLink to="/find">Find Recipes</NavLink>
        {user && <NavLink to="/generate">AI Recipe</NavLink>}
        {user && <NavLink to="/saved">Saved</NavLink>}
        {user && <NavLink to="/inventory">Inventory</NavLink>}
        {!user && <NavLink to="/signup">Sign up</NavLink>}
        {!user && <NavLink to="/login">Log in</NavLink>}
        {user && <NavLink to="/profile">Profile</NavLink>}
        {user && (
          <button type="button" onClick={() => void logOut("manual")} disabled={signingOut}>
            {signingOut ? "Logging out..." : "Log out"}
          </button>
        )}
      </nav>

      {authError && <p role="alert">{authError}</p>}
      {authNotice && <p className="auth-notice" role="status">{authNotice}</p>}
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        
        <Route path="/recipes" element={<Navigate to="/find" replace />} />
        <Route path="/find" element={<FindRecipes user={user} />} />
        <Route path="/generate" element={<GenerateRecipePage />} />
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
        <Route path="/login" element={<Login user={user} />} />
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

