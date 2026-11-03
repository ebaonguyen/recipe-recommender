import { useActionState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../auth/supabase";

type FormState = { error: string; message: string };
const initialState: FormState = { error: "", message: "" };

function Profile({ user }: { user: User }) {
  async function updateProfile(_previous: FormState, formData: FormData): Promise<FormState> {
    const displayName = formData.get("displayName");
    const email = formData.get("email");
    if (typeof displayName !== "string" || !displayName.trim() ||
        typeof email !== "string" || !email.trim()) {
      return { error: "Display name and email are required.", message: "" };
    }

    try {
      const emailChanged = email.trim() !== user.email;
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
        ...(emailChanged ? { email: email.trim() } : {}),
      });
      if (error) return { error: error.message, message: "" };

      return {
        error: "",
        message: emailChanged && data.user.email !== email.trim()
          ? "Display name saved. Check your new and current email inboxes for confirmation links to complete the email change."
          : "Profile updated.",
      };
    } catch (error) {
      console.error("Profile update failed:", error);
      return { error: "Unable to update your profile. Please try again.", message: "" };
    }
  }

  async function updatePassword(_previous: FormState, formData: FormData): Promise<FormState> {
    const password = formData.get("password");
    if (typeof password !== "string" || password.length < 6) {
      return { error: "Password must be at least 6 characters.", message: "" };
    }
    if (password !== formData.get("confirmPassword")) {
      return { error: "Passwords do not match.", message: "" };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message, message: "" };
      return { error: "", message: "Password updated." };
    } catch (error) {
      console.error("Password update failed:", error);
      return { error: "Unable to update your password. Please try again.", message: "" };
    }
  }

  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, initialState);
  const displayName = user.user_metadata.display_name;
  const pending = profilePending || passwordPending;

  return (
    <main>
      <h1>Profile</h1>
      <form action={profileAction}>
        <fieldset disabled={pending}>
          <legend>Profile details</legend>
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            name="displayName"
            autoComplete="nickname"
            defaultValue={typeof displayName === "string" ? displayName : ""}
            required
          />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={user.email ?? ""} required />
          <button type="submit">{profilePending ? "Saving..." : "Save profile"}</button>
        </fieldset>
        {profileState.error && <p role="alert">{profileState.error}</p>}
        {profileState.message && <p role="status">{profileState.message}</p>}
      </form>

      <form action={passwordAction}>
        <fieldset disabled={pending}>
          <legend>Change password</legend>
          <label htmlFor="password">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required />
          <button type="submit">{passwordPending ? "Updating..." : "Update password"}</button>
        </fieldset>
        {passwordState.error && <p role="alert">{passwordState.error}</p>}
        {passwordState.message && <p role="status">{passwordState.message}</p>}
      </form>
    </main>
  );
}

export default Profile;
