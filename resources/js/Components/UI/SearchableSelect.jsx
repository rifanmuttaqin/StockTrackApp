import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SearchableSelect Component
 * A premium, responsive, and searchable select dropdown component.
 * Allows users to search through a list of options easily.
 *
 * @param {Object} props
 * @param {Array<{value: any, label: string}>} props.options - List of options to select from
 * @param {any} props.value - Currently selected value
 * @param {Function} props.onChange - Callback triggered when value changes
 * @param {string} props.placeholder - Placeholder text when no option is selected
 * @param {string} props.searchPlaceholder - Placeholder text for the search input
 * @param {string} props.emptyMessage - Message to display when search yields no results
 * @param {string} props.className - Additional classes for the container
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyMessage = 'Tidak ditemukan data',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small timeout to ensure input is rendered and visible
      const timer = setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Find the selected option's label
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Select Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand text-sm cursor-pointer"
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-500' : 'text-ink'}`}>
          {displayLabel}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-slate-400 ml-2 flex-shrink-0" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 flex flex-col border border-slate-200">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 flex items-center bg-appbg">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-sm text-ink placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 max-h-48 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-900 ${
                      isSelected
                        ? 'bg-brand-100 text-brand-900 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500 text-center">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
