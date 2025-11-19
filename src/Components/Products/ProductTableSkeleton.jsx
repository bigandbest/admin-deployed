/* eslint-disable react/prop-types */
// Loading skeleton component for table rows
const ProductRowSkeleton = () => (
  <tr className="border-b border-gray-100/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-slate-50/30 hover:to-gray-50/30 dark:hover:from-slate-900/20 dark:hover:to-gray-900/20 transition-all duration-200">
    <td className="text-center p-3">
      <div className="flex flex-col items-center gap-2">
        <div className="h-15 w-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl animate-pulse shadow-sm"></div>
        <div className="h-4 w-12 bg-gradient-to-r from-indigo-200 to-blue-200 dark:from-indigo-700 dark:to-blue-700 rounded-full animate-pulse"></div>
      </div>
    </td>
    <td className="p-3">
      <div className="h-5 w-4/5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg animate-pulse mb-2"></div>
      <div className="h-3 w-3/5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
    </td>
    <td className="p-3 bg-gray-50/50 dark:bg-gray-800/50">
      <div className="h-4 w-11/12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
    </td>
    <td className="p-3">
      <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
    </td>
    <td className="p-3 bg-gray-50/50 dark:bg-gray-800/50">
      <div className="h-4 w-4/5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
    </td>
    <td className="text-right p-3">
      <div className="h-5 w-16 bg-gradient-to-r from-emerald-200 to-green-200 dark:from-emerald-700 dark:to-green-700 rounded-lg animate-pulse ml-auto"></div>
    </td>
    <td className="text-right p-3">
      <div className="h-6 w-14 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 rounded-full animate-pulse ml-auto"></div>
    </td>
    <td className="text-center p-3">
      <div className="h-7 w-7 bg-gradient-to-br from-emerald-200 to-green-200 dark:from-emerald-700 dark:to-green-700 rounded-xl animate-pulse mx-auto shadow-sm"></div>
    </td>
    <td className="text-center p-3">
      <div className="h-7 w-7 bg-gradient-to-br from-emerald-200 to-green-200 dark:from-emerald-700 dark:to-green-700 rounded-xl animate-pulse mx-auto shadow-sm"></div>
    </td>
    <td className="text-center p-3">
      <div className="h-7 w-7 bg-gradient-to-br from-emerald-200 to-green-200 dark:from-emerald-700 dark:to-green-700 rounded-xl animate-pulse mx-auto shadow-sm"></div>
    </td>
    <td className="text-center p-3">
      <div className="h-7 w-7 bg-gradient-to-br from-red-200 to-rose-200 dark:from-red-700 dark:to-rose-700 rounded-xl animate-pulse mx-auto shadow-sm"></div>
    </td>
    {Array.from({ length: 11 }).map((_, index) => (
      <td key={index} className="text-center p-3">
        <div className="h-7 w-7 bg-gradient-to-br from-slate-200 to-gray-300 dark:from-slate-600 dark:to-gray-700 rounded-xl animate-pulse mx-auto shadow-sm"></div>
      </td>
    ))}
    <td className="text-center p-3">
      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-full mx-auto w-fit">
        <div className="h-4 w-6 bg-gradient-to-r from-slate-200 to-gray-200 dark:from-slate-600 dark:to-gray-600 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="text-center p-3">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-full mx-auto w-fit">
        <div className="h-4 w-8 bg-gradient-to-r from-yellow-200 to-amber-200 dark:from-yellow-700 dark:to-amber-700 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="text-center p-3">
      <div className="flex justify-center gap-3">
        <div className="h-8 w-8 bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-700 dark:to-indigo-700 rounded-xl animate-pulse shadow-sm"></div>
        <div className="h-8 w-8 bg-gradient-to-br from-red-200 to-rose-200 dark:from-red-700 dark:to-rose-700 rounded-xl animate-pulse shadow-sm"></div>
        <div className="h-8 w-16 bg-gradient-to-r from-purple-200 to-indigo-200 dark:from-purple-700 dark:to-indigo-700 rounded-xl animate-pulse shadow-sm"></div>
      </div>
    </td>
  </tr>
);

const ProductTableSkeleton = ({ rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <ProductRowSkeleton key={index} />
      ))}
    </>
  );
};

export default ProductTableSkeleton;
