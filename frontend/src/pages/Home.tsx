import type { User } from "@supabase/supabase-js";

function Home({ user }: { user: User | null }) {
  const displayName = user?.user_metadata.display_name;
  return (
    <h1>
      {user
        ? `Welcome back ${typeof displayName === "string" && displayName ? displayName : user.email}!`
        : "Welcome to Recipe Recommender!"}
    </h1>
  );
}

export default Home;