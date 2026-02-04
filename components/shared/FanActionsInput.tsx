"use client";

import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const MAX_ACTIONS = 2;
const MAX_ACTION_LENGTH = 50;

interface FanActionsInputProps {
  value: string[];
  onChange: (actions: string[]) => void;
  disabled?: boolean;
}

export interface FanActionsInputHandle {
  /** Commit any pending input text as actions. Returns the updated array. */
  flush: () => string[];
}

export const FanActionsInput = forwardRef<
  FanActionsInputHandle,
  FanActionsInputProps
>(function FanActionsInput({ value, onChange, disabled }, ref) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allActions, setAllActions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Keep a ref to the latest value so flush() always sees current state
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    fetch("/api/org-profiles/fan-actions")
      .then((res) => res.json())
      .then((data) => setAllActions(data.fan_actions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = allActions.filter(
        (a) =>
          a.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(a),
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, allActions, value]);

  /** Parse comma-separated input into individual actions and add them. */
  function addFromInput(raw: string) {
    const parts = raw.split(",");
    let current = valueRef.current;
    for (const part of parts) {
      const trimmed = part.trim().slice(0, MAX_ACTION_LENGTH);
      if (
        !trimmed ||
        current.length >= MAX_ACTIONS ||
        current.includes(trimmed)
      ) {
        continue;
      }
      current = [...current, trimmed];
    }
    if (current !== valueRef.current) {
      onChangeRef.current(current);
    }
    setInputValue("");
    setShowSuggestions(false);
  }

  function addAction(action: string) {
    const trimmed = action.trim();
    if (!trimmed || value.length >= MAX_ACTIONS || value.includes(trimmed)) {
      return;
    }
    onChange([...value, trimmed.slice(0, MAX_ACTION_LENGTH)]);
    setInputValue("");
    setShowSuggestions(false);
  }

  function removeAction(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  /** Expose flush so the parent can commit pending input before saving. */
  useImperativeHandle(ref, () => ({
    flush(): string[] {
      if (!inputValue.trim()) {
        return valueRef.current;
      }
      const parts = inputValue.split(",");
      let current = valueRef.current;
      for (const part of parts) {
        const trimmed = part.trim().slice(0, MAX_ACTION_LENGTH);
        if (
          !trimmed ||
          current.length >= MAX_ACTIONS ||
          current.includes(trimmed)
        ) {
          continue;
        }
        current = [...current, trimmed];
      }
      if (current !== valueRef.current) {
        onChangeRef.current(current);
      }
      setInputValue("");
      setShowSuggestions(false);
      return current;
    },
  }));

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addAction(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addFromInput(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((action, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {action}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAction(i)}
                  className="ml-1 rounded-sm hover:bg-secondary-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {value.length < MAX_ACTIONS && (
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) =>
              setInputValue(e.target.value.slice(0, MAX_ACTION_LENGTH))
            }
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder="e.g., Register to vote, Pressure decision-makers"
            disabled={disabled}
          />
          {inputValue && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {inputValue.length}/{MAX_ACTION_LENGTH}
            </span>
          )}

          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
            >
              {suggestions.map((suggestion, i) => (
                <button
                  key={suggestion}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                    i === selectedIndex ? "bg-accent" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addAction(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {value.length >= MAX_ACTIONS && (
        <p className="text-xs text-muted-foreground">
          Maximum {MAX_ACTIONS} actions reached.
        </p>
      )}
    </div>
  );
});
