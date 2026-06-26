import React, { useState, useRef, useEffect } from "react";

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: string[];
  value: string;
  onChangeText?: (value: string) => void;
}

export function AutocompleteInput({
  suggestions,
  value,
  onChangeText,
  onChange,
  className,
  ...props
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
  };

  const handleSelect = (val: string) => {
    if (onChangeText) onChangeText(val);
    else if (onChange) {
      // Mock an event if we only have onChange
      const e = { target: { value: val } } as React.ChangeEvent<HTMLInputElement>;
      onChange(e);
    }
    setIsOpen(false);
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

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        className={className}
        autoComplete="off"
        {...props}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-[#0A0A0A]/95 backdrop-blur-md border border-[#333] rounded-lg shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-[#222]">
          {filtered.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 text-sm text-text-primary hover:bg-primary/20 hover:text-primary cursor-pointer transition-all duration-200 ease-in-out font-medium"
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
