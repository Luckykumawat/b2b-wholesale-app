'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectFilter({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  placeholder = 'Select options' 
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const displayLabel = selectedValues.length === 0 
    ? `All ${label}s` 
    : selectedValues.length === 1 
      ? selectedValues[0] 
      : `${selectedValues.length} selected`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-700 hover:border-gray-300 transition-colors"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 shadow-xl rounded-lg overflow-hidden min-w-[200px]">
          <div className="p-2 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#1B6F53]"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
             {filteredOptions.length === 0 ? (
               <div className="px-4 py-3 text-xs text-gray-400 text-center">No results found</div>
             ) : (
               filteredOptions.map((option) => (
                 <label
                   key={option}
                   className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                 >
                   <div className={`w-4 h-4 border rounded flex items-center justify-center mr-3 transition-colors ${
                     selectedValues.includes(option) ? 'bg-[#1B6F53] border-[#1B6F53]' : 'border-gray-300 group-hover:border-[#1B6F53]'
                   }`}>
                     {selectedValues.includes(option) && <Check className="w-3 h-3 text-white" />}
                   </div>
                   <input
                     type="checkbox"
                     className="hidden"
                     checked={selectedValues.includes(option)}
                     onChange={() => toggleOption(option)}
                   />
                   <span className={`text-xs ${selectedValues.includes(option) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                     {option}
                   </span>
                 </label>
               ))
             )}
          </div>

          <div className="p-2 border-t border-gray-50 flex gap-2">
            <button
              onClick={() => { onChange([]); setIsOpen(false); }}
              className="flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded transition-colors border border-gray-100"
            >
              Reset
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[#1B6F53] hover:bg-[#155a43] rounded transition-colors shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
