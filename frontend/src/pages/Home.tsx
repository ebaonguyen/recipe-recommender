import type { User } from "@supabase/supabase-js";
import { Link } from "react-router";
import "./Recipes.css";

function Home({ user }: { user: User | null }) {
  const displayName = user?.user_metadata.display_name;
  const name = typeof displayName === "string" && displayName
    ? displayName
    : user?.email?.split("@")[0];

  return (
    <main className="home-page">
      <section className="home-hero">
        <div>
          <p className="home-eyebrow">{user ? "Welcome back" : "Cook with what you have"}</p>
          <h1>{user ? `Good to see you, ${name}.` : "Plan meals simply."}</h1>
          <p className="home-lead">
            Discover recipes, keep track of ingredients, and find meals that fit your kitchen.
          </p>
          <div className="home-actions">
            <Link className="home-primary" to="/find">Find recipes</Link>
          </div>
        </div>
        <div className="home-visual" aria-hidden="true">
          <div className="plate"><div className="plate-center">🥗</div></div>
        </div>
      </section>

      <section className="home-features" aria-label="App features">
        <Link to="/find" className="home-feature">
          <span className="feature-icon">⌕</span>
          <div><h2>Find a match</h2><p>Use your ingredients and preferences to get relevant recipes.</p></div>
        </Link>
        {user ? (
          <Link to="/inventory" className="home-feature">
            <span className="feature-icon">▦</span>
            <div><h2>Manage inventory</h2><p>See what is in your kitchen and track expiration dates.</p></div>
          </Link>
        ) : (
          <Link to="/signup" className="home-feature">
            <span className="feature-icon">＋</span>
            <div><h2>Create an account</h2><p>Save favorite recipes and keep your own ingredient inventory.</p></div>
          </Link>
        )}
        <Link to={user ? "/saved" : "/login"} className="home-feature">
          <span className="feature-icon">♡</span>
          <div><h2>{user ? "Saved recipes" : "Log in"}</h2><p>{user ? "Revisit the meals you want to cook again." : "Access your saved recipes and personal inventory."}</p></div>
        </Link>
      </section>
    </main>
  );
}

export default Home;