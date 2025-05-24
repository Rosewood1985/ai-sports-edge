import React from 'react';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table: React.FC<TableProps> = ({ className = '', ...props }) => {
  return <table className={`w-full border-collapse text-left ${className}`} {...props} />;
};

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHead: React.FC<TableHeadProps> = ({ className = '', ...props }) => {
  return <thead className={`bg-gray-50 border-b ${className}`} {...props} />;
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody: React.FC<TableBodyProps> = ({ className = '', ...props }) => {
  return <tbody className={`divide-y divide-gray-200 ${className}`} {...props} />;
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow: React.FC<TableRowProps> = ({ className = '', ...props }) => {
  return <tr className={`hover:bg-gray-50 ${className}`} {...props} />;
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell: React.FC<TableCellProps> = ({ className = '', ...props }) => {
  return <td className={`px-4 py-3 text-sm ${className}`} {...props} />;
};

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHeader: React.FC<TableHeaderProps> = ({ className = '', ...props }) => {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
      {...props}
    />
  );
};
