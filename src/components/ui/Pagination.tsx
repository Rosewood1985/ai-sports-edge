import React from 'react';

import { IconButton } from './IconButton';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}) => {
  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];

    // If total pages is less than or equal to max visible pages, show all pages
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }

    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    // Adjust if end page exceeds total pages
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center space-x-1">
      {/* Previous button */}
      <IconButton
        icon="chevron-left"
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      />

      {/* First page */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            className={`px-3 py-1 rounded-md text-sm ${
              currentPage === 1 ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onPageChange(1)}
          >
            1
          </button>

          {/* Ellipsis if needed */}
          {pageNumbers[0] > 2 && <span className="px-2 text-gray-500">...</span>}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map(page => (
        <button
          key={page}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {/* Last page */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {/* Ellipsis if needed */}
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}

          <button
            className={`px-3 py-1 rounded-md text-sm ${
              currentPage === totalPages
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next button */}
      <IconButton
        icon="chevron-right"
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      />
    </div>
  );
};
