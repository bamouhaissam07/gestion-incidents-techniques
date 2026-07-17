import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { debounce } from '../../utils/helpers';
import Input from '../ui/Input';

/**
 * Composant SearchBar avec debounce
 */
const SearchBar = ({
  placeholder = 'Rechercher...',
  onSearch,
  delay = 500,
  className = '',
  showClearButton = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Créer une fonction debounced pour la recherche
  useEffect(() => {
    const debouncedSearch = debounce((term) => {
      if (onSearch) {
        onSearch(term);
      }
    }, delay);

    debouncedSearch(searchTerm);
  }, [searchTerm, onSearch, delay]);

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          icon={<Search className="w-4 h-4" />}
          className="pr-10"
        />
        
        {showClearButton && searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;