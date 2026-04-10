import React from 'react';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

export default function AdminTable({ 
  columns, 
  data, 
  loading, 
  title, 
  onSearch, 
  searchPlaceholder = "Search...",
  pagination = true,
  hideFilter = false,
  actions
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Reset to page 1 whenever search/data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const paginatedData = data.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 transition-all overflow-hidden">
      {/* Table Header */}
      <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {title && <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>}
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-black uppercase tracking-wider w-full md:w-72 outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-700"
            />
          </div>
          {!hideFilter && (
            <button className="p-3 text-slate-400 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:bg-slate-100 transition-all">
              <Filter size={18} />
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/30">
              {columns.map((col, idx) => (
                <th key={idx} className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-8 py-5 border-b border-slate-50">
                      <div className="h-4 bg-slate-100 animate-pulse rounded-md w-full"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-8 py-20 text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest">No data available</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                  {columns.map((col, j) => (
                    <td key={j} className="px-8 py-4 border-b border-slate-50 text-sm font-medium text-slate-600">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && data.length > itemsPerPage && (
        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{endIndex}</span> of <span className="text-slate-900">{data.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm overflow-hidden">
               {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                 <button 
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={`w-8 h-8 rounded-md text-sm font-bold transition-all ${
                     currentPage === page 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50'
                   }`}
                 >
                   {page}
                 </button>
               ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
