import { useState } from 'react'
import { useQuery } from 'react-query'
import { ProductFilters } from 'shared'
import { productsApi } from '../services/api'
import ProductCard from '../components/GameCard'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const HomePage = () => {
  const [filters, setFilters] = useState<ProductFilters & { page: number }>({
    page: 1,
    search: '',
    category: '',
    type: undefined,
    priceMin: undefined,
    priceMax: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const { data: productsData, isLoading, error } = useQuery(
    ['products', filters],
    () => productsApi.getProducts(filters),
    { keepPreviousData: true }
  )

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Amazing Indie Games & Apps
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Support independent developers and explore unique games and applications with cryptocurrency payments
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search games & apps..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>

          {/* Type Filter */}
          <select
            className="input-field"
            value={filters.type || ''}
            onChange={(e) => handleFilterChange({ type: e.target.value as 'GAME' | 'APP' | undefined })}
          >
            <option value="">All Types</option>
            <option value="GAME">Games</option>
            <option value="APP">Apps</option>
          </select>

          {/* Category */}
          <select
            className="input-field"
            value={filters.category}
            onChange={(e) => handleFilterChange({ category: e.target.value })}
          >
            <option value="">All Categories</option>
            {/* Game Categories */}
            <option value="Adventure">Adventure</option>
            <option value="Puzzle">Puzzle</option>
            <option value="Racing">Racing</option>
            <option value="RPG">RPG</option>
            <option value="Action">Action</option>
            <option value="Strategy">Strategy</option>
            <option value="Simulation">Simulation</option>
            <option value="Sports">Sports</option>
            {/* App Categories */}
            <option value="Productivity">Productivity</option>
            <option value="Creative">Creative</option>
            <option value="Developer Tools">Developer Tools</option>
            <option value="Audio">Audio</option>
            <option value="Video">Video</option>
            <option value="Utilities">Utilities</option>
            <option value="Business">Business</option>
            <option value="Education">Education</option>
          </select>

          {/* Price Filter */}
          <select
            className="input-field"
            onChange={(e) => {
              const value = e.target.value
              if (value === 'free') {
                handleFilterChange({ priceMin: 0, priceMax: 0 })
              } else if (value === 'paid') {
                handleFilterChange({ priceMin: 0.001, priceMax: undefined })
              } else {
                handleFilterChange({ priceMin: undefined, priceMax: undefined })
              }
            }}
          >
            <option value="">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          {/* Sort */}
          <select
            className="input-field"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              handleFilterChange({ sortBy: sortBy as any, sortOrder: sortOrder as any })
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="downloadCount-desc">Most Downloaded</option>
            <option value="title-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-600">Failed to load products. Please try again.</p>
        </div>
      )}

      {/* Products Grid */}
      {productsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {productsData.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {productsData.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-gray-700">
                Page {filters.page} of {productsData.pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= productsData.pagination.totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* No Results */}
          {productsData.data.length === 0 && (
            <div className="text-center py-16">
              {!filters.search && !filters.category && !filters.type && filters.priceMin === undefined && filters.priceMax === undefined ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Based Games & Apps!</h3>
                  <p className="text-gray-600 mb-4">
                    This marketplace is ready for developers to list their games and apps.
                  </p>
                  <p className="text-sm text-gray-500">
                    Are you a developer? <a href="/register" className="text-primary-600 hover:text-primary-700">Sign up</a> to start selling your products!
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600">Try adjusting your search filters</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default HomePage 