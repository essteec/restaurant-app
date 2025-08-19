import { useState, useRef, useEffect } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { Search, X } from 'react-bootstrap-icons';

const SearchableDropdown = ({
  options = [],
  value = null,
  onChange,
  placeholder = 'Search and select...',
  searchPlaceholder = 'Type to search...',
  labelKey = 'label',
  valueKey = 'value',
  clearable = true,
  disabled = false,
  size = null,
  className = '',
  emptyMessage = 'No options found',
  renderOption = null,
  renderValue = null,
  isLoading = false,
  loadingMessage = 'Loading...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter(option => {
    const label = typeof option === 'string' ? option : option[labelKey];
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedOption = value 
    ? options.find(option => 
        (typeof option === 'string' ? option : option[valueKey]) === value
      )
    : null;

  const displayValue = selectedOption
    ? renderValue 
      ? renderValue(selectedOption)
      : (typeof selectedOption === 'string' ? selectedOption : selectedOption[labelKey])
    : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleOptionSelect = (option) => {
    const optionValue = typeof option === 'string' ? option : option[valueKey];
    onChange(optionValue);
    setShowDropdown(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setShowDropdown(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleOptionSelect(filteredOptions[focusedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  return (
    <div ref={dropdownRef} className={`position-relative ${className}`}>
      <InputGroup size={size}>
        <InputGroup.Text>
          <Search size={16} />
        </InputGroup.Text>
        <Form.Control
          ref={inputRef}
          type="text"
          placeholder={showDropdown ? searchPlaceholder : placeholder}
          value={showDropdown ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
        />
        {clearable && value && !disabled && (
          <InputGroup.Text 
            as="button" 
            type="button"
            onClick={handleClear}
            className="bg-transparent border-start-0 cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            <X size={16} />
          </InputGroup.Text>
        )}
      </InputGroup>

      {showDropdown && (
        <div className="dropdown-menu show w-100 mt-1 shadow" style={{ zIndex: 1050 }}>
          {isLoading ? (
            <div className="dropdown-item text-muted text-center py-3">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              {loadingMessage}
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const optionLabel = typeof option === 'string' ? option : option[labelKey];
              const optionValue = typeof option === 'string' ? option : option[valueKey];
              const isSelected = value === optionValue;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={optionValue}
                  type="button"
                  className={`dropdown-item ${isSelected ? 'active' : ''} ${isFocused ? 'bg-light' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {renderOption ? renderOption(option, isSelected) : optionLabel}
                </button>
              );
            })
          ) : (
            <div className="dropdown-item text-muted text-center py-3">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
