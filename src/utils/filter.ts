/**
 * Filter Utility
 * Provides reusable filtering functionality for dropdowns and tables
 */

/**
 * Filter options configuration
 */
export interface IFilterOptions {
  /** Fields to search in (for objects) */
  fields?: string[];
  /** Case insensitive search (default: true) */
  caseSensitive?: boolean;
  /** Show all items when search is empty (default: true) */
  showAllOnEmpty?: boolean;
}

/**
 * Dropdown filter configuration
 */
export interface IDropdownFilterOptions {
  /** CSS selector for the dropdown container */
  containerSelector: string;
  /** CSS selector for option elements */
  optionSelector?: string;
  /** CSS class to toggle visibility */
  hiddenClass?: string;
  /** Fields to search in (for option text) */
  fields?: string[];
}

/**
 * Table filter configuration
 */
export interface ITableFilterOptions {
  /** CSS selector for the table or table body */
  tableSelector: string;
  /** CSS selector for table rows */
  rowSelector?: string;
  /** Column indices to search (undefined = all columns) */
  columnIndices?: number[];
  /** CSS class to toggle visibility */
  hiddenClass?: string;
}

/**
 * Filter items in an array based on search term
 * @param items - Array of items to filter
 * @param searchTerm - Search term to filter by
 * @param options - Filter options
 * @returns Filtered array
 */
export function filterItems<T>(
  items: T[],
  searchTerm: string,
  options: IFilterOptions = {}
): T[] {
  const { fields, caseSensitive = false, showAllOnEmpty = true } = options;

  // Return all items if search is empty and showAllOnEmpty is true
  if (!searchTerm.trim() && showAllOnEmpty) {
    return items;
  }

  const normalizedSearch = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);

  return items.filter(item => {
    // If no fields specified, search all string properties
    if (!fields || fields.length === 0) {
      const itemStr = caseSensitive ? String(item) : String(item).toLowerCase();
      return searchTerms.every(term => itemStr.includes(term));
    }

    // Search in specified fields
    return searchTerms.every(term => {
      return fields.some(field => {
        const value = (item as Record<string, unknown>)[field];
        if (value === null || value === undefined) {
          return false;
        }
        const strValue = caseSensitive ? String(value) : String(value).toLowerCase();
        return strValue.includes(term);
      });
    });
  });
}

/**
 * Filter DOM elements (dropdown options, table rows, list items)
 * @param elements - Array of DOM elements to filter
 * @param searchTerm - Search term to filter by
 * @param getText - Function to get searchable text from element
 * @param hiddenClass - CSS class to add when hidden
 */
export function filterElements(
  elements: Element[],
  searchTerm: string,
  getText: (el: Element) => string,
  hiddenClass: string = 'hidden'
): void {
  const normalizedSearch = searchTerm.toLowerCase();
  const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);

  elements.forEach(element => {
    const text = getText(element).toLowerCase();
    const matches = searchTerms.every(term => text.includes(term));
    
    if (matches) {
      element.classList.remove(hiddenClass);
    } else {
      element.classList.add(hiddenClass);
    }
  });
}

/**
 * Apply filter to a dropdown (select element or custom dropdown)
 * @param container - Dropdown container element or selector
 * @param searchTerm - Search term to filter by
 * @param options - Filter options
 */
export function applyDropdownFilter(
  container: Element | string,
  searchTerm: string,
  options: IDropdownFilterOptions
): void {
  const containerEl = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerEl) {
    console.warn(`Dropdown filter: container not found - ${container}`);
    return;
  }

  const { optionSelector = 'option', hiddenClass = 'hidden' } = options;
  const optionsEls = Array.from(containerEl.querySelectorAll(optionSelector));

  filterElements(optionsEls, searchTerm, (el) => {
    // Get text content, fallback to value if no text
    return el.textContent?.trim() || (el as HTMLOptionElement).value || '';
  }, hiddenClass);
}

/**
 * Apply filter to table rows
 * @param table - Table element or selector
 * @param searchTerm - Search term to filter by
 * @param options - Filter options
 */
export function applyTableFilter(
  table: Element | string,
  searchTerm: string,
  options: ITableFilterOptions
): void {
  const tableEl = typeof table === 'string' 
    ? document.querySelector(table) 
    : table;
  
  if (!tableEl) {
    console.warn(`Table filter: table not found - ${table}`);
    return;
  }

  const { 
    rowSelector = 'tbody tr', 
    columnIndices,
    hiddenClass = 'hidden' 
  } = options;
  
  const rows = Array.from(tableEl.querySelectorAll(rowSelector));

  filterElements(rows, searchTerm, (row) => {
    const cells = row.querySelectorAll('td');
    
    if (columnIndices && columnIndices.length > 0) {
      // Only search specified columns
      return Array.from(cells)
        .filter((_, index) => columnIndices.includes(index))
        .map(cell => cell.textContent || '')
        .join(' ');
    }
    
    // Search all columns
    return Array.from(cells)
      .map(cell => cell.textContent || '')
      .join(' ');
  }, hiddenClass);
}

/**
 * Create a custom searchable dropdown that replaces a native select
 * @param selectId - ID of the select element to replace
 * @returns The container element with the searchable dropdown
 */
export function createSearchableDropdown(selectId: string): HTMLElement | null {
  const select = document.getElementById(selectId) as HTMLSelectElement;
  if (!select) {
    console.warn(`Searchable dropdown: select not found - ${selectId}`);
    return null;
  }

  // Get current selection
  const selectedValue = select.value;
  const selectedOption = select.querySelector(`option[value="${selectedValue}"]`);
  const selectedText = selectedOption?.textContent || '';

  // Create container
  const container = document.createElement('div');
  container.className = 'searchable-select';
  container.style.position = 'relative';

  // Create input (trigger)
  const input = document.createElement('input');
  input.type = 'text';
  input.className = select.className;
  input.value = selectedText;
  input.placeholder = select.getAttribute('placeholder') || 'Select...';
  input.readOnly = false;
  input.autocomplete = 'off';

  // Create dropdown list
  const dropdown = document.createElement('div');
  dropdown.className = 'searchable-select-dropdown';
  dropdown.style.display = 'none';
  dropdown.style.position = 'absolute';
  dropdown.style.top = '100%';
  dropdown.style.left = '0';
  dropdown.style.right = '0';
  dropdown.style.zIndex = '1000';
  dropdown.style.maxHeight = '200px';
  dropdown.style.overflowY = 'auto';
  dropdown.style.backgroundColor = '#fff';
  dropdown.style.border = '1px solid #ddd';
  dropdown.style.borderRadius = '4px';
  dropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

  // Create search input inside dropdown
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'searchable-select-search';
  searchInput.placeholder = 'Search...';
  searchInput.style.width = '100%';
  searchInput.style.padding = '8px';
  searchInput.style.border = 'none';
  searchInput.style.borderBottom = '1px solid #eee';
  searchInput.style.outline = 'none';
  searchInput.style.boxSizing = 'border-box';

  // Create options container
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'searchable-select-options';
  optionsContainer.style.overflowY = 'auto';
  optionsContainer.style.maxHeight = '160px';

  // Copy options from select
  const options = select.querySelectorAll('option');
  const optionElements: HTMLElement[] = [];

  options.forEach(option => {
    const optEl = document.createElement('div');
    optEl.className = 'searchable-select-option';
    optEl.textContent = option.textContent;
    optEl.setAttribute('data-value', option.value);
    optEl.style.padding = '8px 12px';
    optEl.style.cursor = 'pointer';
    optEl.style.whiteSpace = 'nowrap';
    optEl.style.overflow = 'hidden';
    optEl.style.textOverflow = 'ellipsis';

    // Hover effect
    optEl.addEventListener('mouseenter', () => {
      optEl.style.backgroundColor = '#f5f5f5';
    });
    optEl.addEventListener('mouseleave', () => {
      optEl.style.backgroundColor = '';
    });

    // Click handler
    optEl.addEventListener('click', () => {
      const value = optEl.getAttribute('data-value') || '';
      const text = optEl.textContent || '';
      select.value = value;
      input.value = text;
      dropdown.style.display = 'none';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    optionElements.push(optEl);
    optionsContainer.appendChild(optEl);
  });

  // Assemble dropdown
  dropdown.appendChild(searchInput);
  dropdown.appendChild(optionsContainer);

  // Add to container
  container.appendChild(input);
  container.appendChild(dropdown);

  // Replace select with container
  select.parentNode?.insertBefore(container, select);
  select.style.display = 'none';

  // Toggle dropdown on input click/focus
  const toggleDropdown = (e?: Event) => {
    e?.preventDefault();
    e?.stopPropagation();
    const isOpen = dropdown.style.display === 'block';
    if (!isOpen) {
      dropdown.style.display = 'block';
      searchInput.value = '';
      searchInput.focus();
      filterOptions('');
    } else {
      dropdown.style.display = 'none';
    }
  };

  input.addEventListener('mousedown', toggleDropdown);
  input.addEventListener('focus', toggleDropdown);

  // Filter options based on search
  const filterOptions = (search: string) => {
    const searchLower = search.toLowerCase();
    optionElements.forEach(opt => {
      const text = opt.textContent?.toLowerCase() || '';
      opt.style.display = text.includes(searchLower) ? 'block' : 'none';
    });
  };

  // Search input handler
  searchInput.addEventListener('input', () => {
    filterOptions(searchInput.value);
  });

  // Prevent dropdown from closing when clicking inside it
  dropdown.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // Close dropdown when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (!container.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  });

  // Handle escape key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      input.focus();
    }
  });

  return container;
}

/**
 * Setup a search input to filter a dropdown
 * Uses native datalist for filtering
 * @param inputId - ID of the search input
 * @param selectId - ID of the select to filter
 */
export function setupDropdownSearch(inputId: string, selectId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const select = document.getElementById(selectId) as HTMLSelectElement;
  
  if (!input || !select) {
    console.warn(`Dropdown search setup: elements not found - ${inputId}, ${selectId}`);
    return;
  }

  // Ensure input has a datalist
  const datalistId = input.getAttribute('list') || `${inputId}-list`;
  let datalist = document.getElementById(datalistId) as HTMLDataListElement;
  
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = datalistId;
    input.setAttribute('list', datalistId);
    input.parentNode?.insertBefore(datalist, input.nextSibling);
  }

  // Populate datalist from select options
  const updateDatalist = () => {
    const searchTerm = input.value.toLowerCase();
    datalist.innerHTML = '';
    
    const options = select.querySelectorAll('option');
    options.forEach(option => {
      const text = option.textContent?.toLowerCase() || '';
      if (!searchTerm || text.includes(searchTerm)) {
        const dataOption = document.createElement('option');
        dataOption.value = option.textContent || '';
        dataOption.setAttribute('data-value', option.value);
        datalist.appendChild(dataOption);
      }
    });
  };

  // Update datalist on input
  input.addEventListener('input', updateDatalist);

  // Handle selection
  input.addEventListener('change', () => {
    const selectedOption = Array.from(datalist.options)
      .find(opt => opt.value === input.value);
    
    if (selectedOption) {
      const value = selectedOption.getAttribute('data-value') || '';
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Initial population
  updateDatalist();
}

/**
 * FilterController - Manages multiple filters for a page
 * Useful when you have multiple searchable controls that need to work together
 */
export class FilterController {
  private filters: Map<string, () => void> = new Map();

  /**
   * Register a filter with a unique ID
   * @param id - Unique identifier for the filter
   * @param filterFn - Function that applies the filter
   */
  register(id: string, filterFn: () => void): void {
    this.filters.set(id, filterFn);
  }

  /**
   * Unregister a filter
   * @param id - Filter ID to remove
   */
  unregister(id: string): void {
    this.filters.delete(id);
  }

  /**
   * Apply a specific filter
   * @param id - Filter ID to apply
   */
  apply(id: string): void {
    const filterFn = this.filters.get(id);
    if (filterFn) {
      filterFn();
    }
  }

  /**
   * Apply all registered filters
   */
  applyAll(): void {
    this.filters.forEach(filterFn => filterFn());
  }

  /**
   * Clear all registered filters
   */
  clear(): void {
    this.filters.clear();
  }
}
