import React, { useState, useRef, useEffect, KeyboardEvent } from "react";

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onKeyDown'> {
  suggestions: string[];
  value: string;
  onChangeText?: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export function AutocompleteInput({
  suggestions,
  value,
  onChangeText,
  onChange,
  onKeyDown,
  className,
  ...props
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onChangeText) onChangeText(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1); // Reset highlight on typing
  };

  const handleSelect = (val: string) => {
    if (onChangeText) onChangeText(val);
    else if (onChange) {
      // Mock an event if we only have onChange
      const e = { target: { value: val } } as React.ChangeEvent<HTMLInputElement>;
      onChange(e);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Filter and sort suggestions
  const getFilteredSuggestions = () => {
    if (!value) return [];
    const lowerValue = value.toLowerCase();

    // 1. Starts with
    const startsWith = suggestions.filter((s) => s.toLowerCase().startsWith(lowerValue));
    // 2. Contains (but doesn't start with)
    const contains = suggestions.filter(
      (s) => s.toLowerCase().includes(lowerValue) && !s.toLowerCase().startsWith(lowerValue)
    );

    return [...startsWith, ...contains].slice(0, 10); // Limit to top 10 results
  };

  const filtered = getFilteredSuggestions();

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (onKeyDown) onKeyDown(e);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const nextIndex = prev < filtered.length - 1 ? prev + 1 : prev;
        scrollToItem(nextIndex);
        return nextIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const nextIndex = prev > 0 ? prev - 1 : 0;
        scrollToItem(nextIndex);
        return nextIndex;
      });
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        e.preventDefault();
        handleSelect(filtered[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }

    if (onKeyDown) onKeyDown(e);
  };

  const scrollToItem = (index: number) => {
    if (listRef.current && listRef.current.children[index]) {
      const el = listRef.current.children[index] as HTMLElement;
      el.scrollIntoView({ block: 'nearest' });
    }
  };

  // Reset highlight if suggestions change while open
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value, suggestions]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        className={className}
        autoComplete="off"
        {...props}
      />
      {isOpen && filtered.length > 0 && (
        <ul ref={listRef} className="absolute z-[100] w-full mt-2 bg-[#0A0A0A]/95 backdrop-blur-md border border-[#333] rounded-lg shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-[#222]">
          {filtered.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-4 py-3 text-sm transition-all duration-150 ease-in-out font-medium cursor-pointer ${
                highlightedIndex === index
                  ? "bg-primary/20 text-primary border-l-2 border-primary"
                  : "text-text-primary hover:bg-primary/10 hover:text-primary border-l-2 border-transparent"
              }`}
            >
              {/* Highlight the matching part */}
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
