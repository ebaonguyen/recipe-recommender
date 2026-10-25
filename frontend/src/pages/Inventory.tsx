import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./Inventory.css";
import { supabase } from "../auth/supabase";

type InventoryItem = {
  id: string;
  user_id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  expiration_date: string | null;
  created_at: string;
};

type Ingredient = {
  strIngredient: string;
  strThumb: string | null;
};

function Inventory() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [ingredientStatus, setIngredientStatus] = useState("Loading ingredients...");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState("Loading inventory...");

  async function handleDelete(id: string) {
    setDeleteError("");
    setDeletingId(id);

    try {
      if (!user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id");

      if (error || !data?.length) throw new Error("Delete failed");

      setInventoryItems((items) => items.filter((item) => item.id !== id));
    } catch {
      setDeleteError("Could not delete the item. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!user) {
      return setSubmitError("You must be logged in to save an ingredient.");
    }

    const formData = new FormData(event.currentTarget);
    const ingredientName = String(formData.get("ingredient") ?? "").trim();
    const quantity = String(formData.get("quantity") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const expirationDate = String(formData.get("expiration_date") ?? "");

    if (!ingredientName) return setSubmitError("Ingredient name is required.");
    if (quantity && (!Number.isFinite(Number(quantity)) || Number(quantity) < 0)) return setSubmitError("Quantity must be a non-negative number.");

    setIsSaving(true);
    try {
      const values = {
        ingredient_name: ingredientName,
        quantity: quantity === "" ? null : Number(quantity),
        unit: unit || null,
        expiration_date: expirationDate || null,
      };
      let savedItem: InventoryItem;

      if (!user) throw new Error("Not logged in");
      const query = editingItem
        ? supabase.from("inventory_items")
          .update(values)
          .eq("id", editingItem.id)
          .eq("user_id", user.id)
        : supabase.from("inventory_items")
          .insert({ ...values, user_id: user.id });

      const { data, error } = await query.select("*").single();
      if (error) throw new Error(error.message);
      savedItem = data;

      setInventoryItems((items) => editingItem
        ? items.map((item) => item.id === editingItem.id ? savedItem : item)
        : [savedItem, ...items],
      );
      dialogRef.current?.close();
    } catch {
      setSubmitError("Could not save the ingredient. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    // Check if user is logged in
    async function checkUser() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw new Error(authError.message);
        setUser(data.user);

        if (!data.user) {
          setInventoryStatus("Log in to view your inventory.");
          return;
        }

        const { data: items, error } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);
        setInventoryItems(items ?? []);
        setInventoryStatus("");
      } catch {
        setInventoryStatus("Could not load inventory. Please reload the page to retry.");
      }
    }

    // Load ingredients from the API
    async function loadIngredients() {
      try {
        const response = await fetch(
          "https://www.themealdb.com/api/json/v1/1/list.php?i=list",
        );
        if (!response.ok) throw new Error("Ingredient request failed");

        const data: { meals: Ingredient[] } = await response.json();
        setIngredients(data.meals);
        setIngredientStatus("");
      } catch {
        setIngredientStatus("Could not load ingredients. Please reopen the page to retry.");
      }
    }

    void checkUser();
    void loadIngredients();
  }, []);

  // Filter ingredients based on the user's query
  const matchingIngredients = ingredients.filter((ingredient) =>
    ingredient.strIngredient.toLowerCase().includes(ingredientQuery.trim().toLowerCase()),
  );

  if (!user) {
    return <p>You're not logged in. Log in here.</p>;
  }

  return (
    <main className="inventory-page">
      <h1>Inventory Page</h1>
      <button
        className="inventory-add-button"
        type="button"
        onClick={() => {
          setSubmitError("");
          setEditingItem(null);
          setIngredientQuery("");
          dialogRef.current?.showModal();
        }}
      >
        Add Ingredient
      </button>
      {deleteError && <p role="alert">{deleteError}</p>}
      {inventoryStatus ? (
        <p role="status">{inventoryStatus}</p>
      ) : inventoryItems.length === 0 ? (
        <p>Your inventory is empty.</p>
      ) : (
        <ul className="inventory-grid">
          {inventoryItems.map((item) => {
            const thumbnail = ingredients.find((ingredient) =>
              ingredient.strIngredient.toLowerCase() === item.ingredient_name.trim().toLowerCase(),
            )?.strThumb;

            return (
              <li className="inventory-card" key={item.id}>
                {thumbnail && (
                  <img
                    key={thumbnail}
                    className="inventory-card-image"
                    src={thumbnail}
                    alt={item.ingredient_name}
                    width={120}
                    height={120}
                    loading="lazy"
                    onError={(event) => { event.currentTarget.hidden = true; }}
                  />
                )}
                <h2>{item.ingredient_name}</h2>
                {(item.quantity !== null || item.unit) && (
                  <p>{[item.quantity, item.unit].filter((value) => value !== null && value !== "").join(" ")}</p>
                )}
                {item.expiration_date && <p>Expiration date: {item.expiration_date}</p>}
                <div className="inventory-card-actions">
                  <button
                    type="button"
                    disabled={deletingId !== null || isSaving}
                    onClick={() => {
                      setEditingItem(item);
                      setIngredientQuery(item.ingredient_name);
                      setSubmitError("");
                      dialogRef.current?.showModal();
                    }}
                    aria-label={`Edit ${item.ingredient_name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.ingredient_name}`}
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <dialog
        ref={dialogRef}
        className="inventory-dialog"
        aria-labelledby="ingredient-dialog-title"
        onCancel={(event) => {
          if (isSaving) event.preventDefault();
        }}
        onClose={() => {
          dialogRef.current?.querySelector("form")?.reset();
          setIngredientQuery("");
          setEditingItem(null);
        }}
      >
        <form key={editingItem?.id ?? "new"} onSubmit={handleSubmit}>
          <h2 id="ingredient-dialog-title">
            {editingItem ? "Edit Ingredient" : "Add Ingredient"}
          </h2>
          <label htmlFor="ingredient-name">Ingredient</label>
          <input
            id="ingredient-name"
            name="ingredient"
            type="text"
            list="ingredient-options"
            autoComplete="off"
            placeholder="Type to search ingredients"
            value={ingredientQuery}
            onChange={(event) => setIngredientQuery(event.target.value)}
            required
          />
          <datalist id="ingredient-options">
            {matchingIngredients.map((ingredient) => (
              <option key={ingredient.strIngredient} value={ingredient.strIngredient} />
            ))}
          </datalist>
          <p role="status">
            {ingredientStatus || (
              matchingIngredients.length === 0 ? "No matching ingredients." : ""
            )}
          </p>

          <label htmlFor="ingredient-quantity">Quantity (optional)</label>
          <input
            id="ingredient-quantity"
            name="quantity"
            defaultValue={editingItem?.quantity ?? ""}
            type="number"
            min="0"
            step="any"
          />

          <label htmlFor="ingredient-unit">Unit (optional)</label>
          <input
            id="ingredient-unit"
            name="unit"
            defaultValue={editingItem?.unit ?? ""}
            type="text"
            placeholder="e.g. grams, cups, pieces"
          />

          <label htmlFor="ingredient-expiration">Expiration date (optional)</label>
          <input
            id="ingredient-expiration"
            name="expiration_date"
            defaultValue={editingItem?.expiration_date ?? ""}
            type="date"
          />

          {submitError && <p role="alert">{submitError}</p>}
          <div className="inventory-dialog-actions">
            <button type="button" disabled={isSaving} onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
            <button className="inventory-add-button" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingItem ? "Save Changes" : "Add Ingredient"}
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}

export default Inventory;
