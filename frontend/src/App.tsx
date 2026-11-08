import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Link, Navigate, Route, Routes } from "react-router";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import Recipes from "./pages/Recipes";
import SavedRecipes from "./pages/SavedRecipes";
import Signup from "./auth/Signup";
import Login from "./auth/Login";
import Profile from "./pages/Profile";
import { supabase } from "./auth/supabase";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    let authChanged = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authChanged = true;
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

  return (
    <>
      <nav>
        <Link to="/">Home</Link>{" "}
        <Link to="/recipes">Recipes</Link>{" "}
        {user && <Link to="/saved">Saved</Link>}{" "}
        <Link to="/inventory">Inventory</Link>{" "}
        <Link to="/signup">Signup</Link>{" "}
        <Link to="/login">Login</Link>{" "}
        {user && <Link to="/profile">Profile</Link>}
      </nav>

      {authError && <p role="alert">{authError}</p>}
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

