'use client';

import { Input } from "./Input";
import { Search, X } from 'lucide-react';
import { Button } from "../buttons/Button";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск...',
  className = '',
}: SearchInputProps) {
  return (
    <div data-ui="search-input" className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      <Input
        variant="glass"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 rounded-md opacity-70 transition-all hover:opacity-100 hover:bg-accent/50"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

