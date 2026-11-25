import { useId, useState } from "react";
import type { KeyboardEvent } from "react";

type Props = {
  id: string;
  name?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

function Autocomplete({ id, name, value, options, onChange, onSelect, placeholder, required }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = options.filter((option) => option.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 50);
  const expanded = open && matches.length > 0;
  const activeIndex = active < matches.length ? active : -1;

  function choose(option: string) {
    if (onSelect) onSelect(option);
    else onChange(option);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      setOpen(true);
      setActive((current) => Math.min(current + 1, matches.length - 1));
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault();
      setOpen(true);
      setActive((current) => current <= 0 ? matches.length - 1 : current - 1);
    } else if (event.key === "Enter" && expanded && activeIndex >= 0) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="autocomplete">
      <input
        id={id}
        name={name}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); setActive(-1); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
      />
      {expanded && (
        <ul className="autocomplete-options" id={listId} role="listbox">
          {matches.map((option, index) => (
            <li
              id={`${listId}-${index}`}
              key={option}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Autocomplete;
