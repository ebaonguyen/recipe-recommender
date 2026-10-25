import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./Inventory.css";
import { supabase } from "../auth/supabase";

type InventoryItem = {
  id: string;
  ingredient_id: number;
  quantity: number | null;
  unit: string | null;
  expiration_date: string | null;
  ingredients?: Ingredient[];
};

type Ingredient = {
  id: number;
  name: string;
  thumbnail_url: string | null;
};

const inventorySelect =
  "id, ingredient_id, quantity, unit, expiration_date, ingredients(id, name, thumbnail_url)";

function Inventory() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null);
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
    const quantity = String(formData.get("quantity") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const expirationDate = String(formData.get("expiration_date") ?? "");

    if (!selectedIngredientId) return setSubmitError("Please select an ingredient.");
    if (quantity && (!Number.isFinite(Number(quantity)) || Number(quantity) < 0)) return setSubmitError("Quantity must be a non-negative number.");

    setIsSaving(true);
    try {
      const values = {
        ingredient_id: selectedIngredientId,
        quantity: quantity === "" ? null : Number(quantity),
        unit: unit || null,
        expiration_date: expirationDate || null,
      };
      let savedItem: InventoryItem;

      const query = editingItem
        ? supabase.from("inventory_items")
          .update(values)
          .eq("id", editingItem.id)
          .eq("user_id", user.id)
        : supabase.from("inventory_items")
          .insert({ ...values, user_id: user.id });

      const { data, error } = await query
        .select(inventorySelect)
        .single();
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
        .select(inventorySelect)
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);
        setInventoryItems(items ?? []);
        setInventoryStatus("");
      } catch {
        setInventoryStatus("Could not load inventory. Please reload the page to retry.");
      }
    }

    async function loadIngredients() {
      try {
        const { data, error } = await supabase
          .from("ingredients")
          .select("id, name, thumbnail_url")
          .order("name");
        if (error) throw new Error(error.message);

        setIngredients(data ?? []);
        setIngredientStatus("");
      } catch {
        setIngredientStatus("Could not load ingredients. Please reopen the page to retry.");
      }
    }

    void checkUser();
    void loadIngredients();
  }, []);

  const matchingIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(ingredientQuery.trim().toLowerCase()),
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
          setSelectedIngredientId(null);
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
            const ingredient = item.ingredients?.[0] ?? ingredients.find(
              (candidate) => candidate.id === item.ingredient_id,
            );
            const ingredientName = ingredient?.name ?? "Unknown ingredient";
            const thumbnail = ingredient?.thumbnail_url;

            return (
              <li className="inventory-card" key={item.id}>
                {thumbnail && (
                  <img
                    key={thumbnail}
                    className="inventory-card-image"
                    src={thumbnail}
                  alt={ingredientName}
                    width={120}
                    height={120}
                    loading="lazy"
                    onError={(event) => { event.currentTarget.hidden = true; }}
                  />
                )}
                <h2>{ingredientName}</h2>
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
                    setIngredientQuery(item.ingredients?.[0]?.name ?? "");
                    setSelectedIngredientId(item.ingredient_id);
                      setSubmitError("");
                      dialogRef.current?.showModal();
                    }}
                      aria-label={`Edit ${ingredientName}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${ingredientName}`}
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
          setSelectedIngredientId(null);
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
            onChange={(event) => {
              const value = event.target.value;
              setIngredientQuery(value);
              setSelectedIngredientId(
                ingredients.find(
                  (ingredient) => ingredient.name.toLowerCase() === value.trim().toLowerCase(),
                )?.id ?? null,
              );
            }}
            required
          />
          <datalist id="ingredient-options">
            {matchingIngredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.name} />
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
