import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Input } from "./ui/input";

function AutoCompleteInput({ label, fetchUrl, register, onSelect }: any) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (input.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get(fetchUrl, {
            params: { q: input },
          });
          setSuggestions(response.data);
          setDropdownOpen(true);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setDropdownOpen(false);
    }
  }, [input, fetchUrl]);

  const handleSelectSuggestion = (suggestion: any) => {
    setInput(suggestion);
    onSelect(suggestion); // Update form value on selection
    setDropdownOpen(false);
  };

  return (
    <div>
      <label>{label}</label>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Input
            {...register} // Spread in register properties
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            onFocus={() => setDropdownOpen(suggestions.length > 0)}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No suggestions found</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default AutoCompleteInput;
