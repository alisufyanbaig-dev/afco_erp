import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from './button'

// Create a table structure for compatibility
const Table = ({ className, children, ...props }) => (
  <div className={`w-full overflow-auto ${className || ''}`} {...props}>
    <table className="w-full caption-bottom text-sm">{children}</table>
  </div>
)

const TableHeader = ({ className, children, ...props }) => (
  <thead className={`[&_tr]:border-b ${className || ''}`} {...props}>{children}</thead>
)

const TableBody = ({ className, children, ...props }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`} {...props}>{children}</tbody>
)

const TableRow = ({ className, children, ...props }) => (
  <tr 
    className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ''}`} 
    {...props}
  >
    {children}
  </tr>
)

const TableHead = ({ className, children, ...props }) => (
  <th 
    className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className || ''}`} 
    {...props}
  >
    {children}
  </th>
)

const TableCell = ({ className, children, ...props }) => (
  <td 
    className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`} 
    {...props}
  >
    {children}
  </td>
)

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  pagination = null,
  onPaginationChange = null,
  className = "",
}) => {
  const renderCell = (row, column) => {
    if (column.cell) {
      return column.cell({ row: { original: row } })
    }
    
    const value = column.accessorKey ? row[column.accessorKey] : ''
    return value || '-'
  }

  const renderPagination = () => {
    if (!pagination || !onPaginationChange) return null

    const { pageIndex, pageSize, pageCount } = pagination
    const currentPage = pageIndex + 1
    const totalPages = pageCount || 1

    const handlePageChange = (newPageIndex) => {
      onPaginationChange({
        pageIndex: newPageIndex,
        pageSize: pageSize
      })
    }

    const handlePageSizeChange = (newPageSize) => {
      onPaginationChange({
        pageIndex: 0,
        pageSize: newPageSize
      })
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Rows per page
          </p>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(0)}
              disabled={pageIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={column.accessorKey || index}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={row.id || index}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={column.accessorKey || colIndex}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {renderPagination()}
    </div>
  )
}

export { DataTable }
export default DataTable