import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { vendorsAPI, comparisonAPI, projectsAPI } from '../utils/api'
import { 
  Check, X, RefreshCw, Download, Filter, 
  DollarSign, Truck, CreditCard, FileText, 
  Package, AlertCircle, MessageSquare,
  ChevronUp, ChevronDown, ArrowLeft, ChevronRight
} from 'lucide-react'

const ComparisonResults = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedVendors, setSelectedVendors] = useState([])
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState('total_pricing')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showPricingDetails, setShowPricingDetails] = useState(false)

  // Get vendors for this project
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', projectId],
    queryFn: async () => {
      const response = await vendorsAPI.getByProject(projectId)
      return response.data
    }
  })

  // Get project details for breadcrumb
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsAPI.getOne(projectId)
      return response.data
    }
  })

  // Initialize selected vendors from URL params
  useEffect(() => {
    const vendorIds = searchParams.get('vendors')?.split(',') || []
    if (vendorIds.length > 0 && vendors.length > 0) {
      const validVendorIds = vendorIds.filter(id => 
        vendors.some(vendor => vendor.id === id)
      )
      setSelectedVendors(validVendorIds)
    }
  }, [searchParams, vendors])

  // Auto-compare when vendors are selected
  useEffect(() => {
    if (selectedVendors.length >= 2) {
      handleCompare()
    } else {
      setComparisonData(null)
    }
  }, [selectedVendors])

  const handleVendorToggle = (vendorId) => {
    const newSelection = selectedVendors.includes(vendorId) 
      ? selectedVendors.filter(id => id !== vendorId)
      : [...selectedVendors, vendorId]
    
    setSelectedVendors(newSelection)
    
    // Update URL params
    if (newSelection.length > 0) {
      setSearchParams({ vendors: newSelection.join(',') })
    } else {
      setSearchParams({})
    }
  }

  const handleCompare = async () => {
    if (selectedVendors.length < 2) return
    
    setLoading(true)
    try {
      const response = await comparisonAPI.compare({
        vendor_ids: selectedVendors,
        project_id: projectId
      })
      setComparisonData(response.data)
    } catch (error) {
      console.error('Comparison failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedVendors = () => {
    if (!comparisonData) return []
    
    return [...comparisonData.vendors].sort((a, b) => {
      let aValue, bValue
      
      switch (sortField) {
        case 'vendor_name':
          aValue = a.vendor_name.toLowerCase()
          bValue = b.vendor_name.toLowerCase()
          break
        case 'total_pricing':
          aValue = a.aggregated_data.total_pricing
          bValue = b.aggregated_data.total_pricing
          break
        case 'document_count':
          aValue = a.aggregated_data.document_count
          bValue = b.aggregated_data.document_count
          break
        case 'products_count':
          aValue = a.aggregated_data.products_services.length
          bValue = b.aggregated_data.products_services.length
          break
        default:
          return 0
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const exportResults = () => {
    if (!comparisonData) return
    
    const csvData = getSortedVendors().map(vendor => ({
      'Vendor Name': vendor.vendor_name,
      'Total Price': vendor.aggregated_data.total_pricing,
      'Documents': vendor.aggregated_data.document_count,
      'Products/Services': vendor.aggregated_data.products_services.length,
      'Delivery Terms': vendor.aggregated_data.delivery_terms.join(' | '),
      'Payment Terms': vendor.aggregated_data.payment_terms.join(' | ')
    }))
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendor-comparison.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 dark:text-dark-primary hover:text-gray-600 dark:hover:text-dark-secondary"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-muted">
        <Link 
          to="/dashboard" 
          className="hover:text-gray-700 dark:hover:text-dark-secondary transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link 
          to="/projects" 
          className="hover:text-gray-700 dark:hover:text-dark-secondary transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link 
          to={`/projects/${projectId}`} 
          className="hover:text-gray-700 dark:hover:text-dark-secondary transition-colors"
        >
          {project?.name || projectId}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-dark-primary font-medium">Compare Results</span>
      </div>

      {/* Header with Back Button */}
      <div className="bg-white dark:bg-dark-secondary shadow px-4 py-5 sm:rounded-lg sm:px-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary bg-gray-100 dark:bg-dark-accent hover:bg-gray-200 dark:hover:bg-dark-primary rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-primary">Vendor Comparison Results</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
                Select and compare vendors to make informed decisions
              </p>
            </div>
          </div>
          {comparisonData && (
            <button
              onClick={exportResults}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-primary text-sm font-medium rounded-md text-gray-700 dark:text-dark-secondary bg-white dark:bg-dark-accent hover:bg-gray-50 dark:hover:bg-dark-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Vendor Selection */}
      <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary mb-4">
            Select Vendors to Compare ({selectedVendors.length} selected)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <label key={vendor.id} className="relative flex items-start p-3 border border-gray-200 dark:border-dark-primary rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-accent">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(vendor.id)}
                    onChange={() => handleVendorToggle(vendor.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-dark-primary rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className="font-medium text-gray-900 dark:text-dark-primary">{vendor.name}</span>
                  <p className="text-gray-500 dark:text-dark-muted">Click to select</p>
                </div>
                {selectedVendors.includes(vendor.id) && (
                  <Check className="h-5 w-5 text-green-500 dark:text-green-400 ml-auto" />
                )}
              </label>
            ))}
          </div>
          
          {selectedVendors.length < 2 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Select at least 2 vendors to compare. You can select as many as you need.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Results */}
      {loading && (
        <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
              <span className="ml-3 text-lg text-gray-600 dark:text-dark-secondary">Comparing vendors...</span>
            </div>
          </div>
        </div>
      )}

      {comparisonData && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-dark-secondary overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400 dark:text-dark-muted" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-dark-muted truncate">
                        Vendors Compared
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-dark-primary">
                        {comparisonData.comparison_summary.vendor_count}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-secondary overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-dark-muted truncate">
                        Price Range
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-dark-primary">
                        {formatPrice(comparisonData.comparison_summary.price_range.min)} - {formatPrice(comparisonData.comparison_summary.price_range.max)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-secondary overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-dark-muted truncate">
                        Average Price
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-dark-primary">
                        {formatPrice(comparisonData.comparison_summary.price_range.average)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-secondary overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Check className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-dark-muted truncate">
                        Best Price
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-dark-primary truncate">
                        {comparisonData.comparison_summary.lowest_price_vendor || 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary">Detailed Comparison</h3>
                <button
                  onClick={() => setShowPricingDetails(!showPricingDetails)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  {showPricingDetails ? 'Hide' : 'Show'} Pricing Details
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-primary">
                  <thead className="bg-gray-50 dark:bg-dark-accent">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                        <SortButton field="vendor_name">Vendor</SortButton>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                        <SortButton field="total_pricing">Total Price</SortButton>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                        <SortButton field="document_count">Documents</SortButton>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                        <SortButton field="products_count">Products/Services</SortButton>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                        Delivery Terms
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                        Payment Terms
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-primary">
                    {getSortedVendors().map((vendor, index) => (
                      <React.Fragment key={vendor.vendor_id}>
                        <tr className={`${
                          vendor.vendor_name === comparisonData.comparison_summary.lowest_price_vendor
                            ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400'
                            : index % 2 === 0 ? 'bg-white dark:bg-dark-secondary' : 'bg-gray-50 dark:bg-dark-accent'
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-dark-primary flex items-center">
                                  {vendor.vendor_name}
                                  {vendor.vendor_name === comparisonData.comparison_summary.lowest_price_vendor && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                      <Check className="h-3 w-3 mr-1" />
                                      Best Price
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-dark-primary">
                              {formatPrice(vendor.aggregated_data.total_pricing)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-muted">
                            {vendor.aggregated_data.document_count}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-muted">
                            <div className="max-w-xs">
                              {vendor.aggregated_data.products_services.length > 0 ? (
                                <div className="space-y-1">
                                  {vendor.aggregated_data.products_services.slice(0, 3).map((service, idx) => (
                                    <div key={idx} className="text-xs bg-gray-100 dark:bg-dark-primary text-gray-700 dark:text-dark-secondary px-2 py-1 rounded">
                                      {service}
                                    </div>
                                  ))}
                                  {vendor.aggregated_data.products_services.length > 3 && (
                                    <div className="text-xs text-gray-400 dark:text-dark-muted">
                                      +{vendor.aggregated_data.products_services.length - 3} more
                                    </div>
                                  )}
                                </div>
                              ) : (
                                '-'
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-muted max-w-xs">
                            {vendor.aggregated_data.delivery_terms.length > 0 
                              ? vendor.aggregated_data.delivery_terms.join(', ')
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-muted max-w-xs">
                            {vendor.aggregated_data.payment_terms.length > 0 
                              ? vendor.aggregated_data.payment_terms.join(', ')
                              : '-'
                            }
                          </td>
                        </tr>
                        
                        {/* Pricing Details Row */}
                        {showPricingDetails && vendor.aggregated_data.pricing_items.length > 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 bg-gray-50 dark:bg-dark-accent">
                              <div className="text-sm">
                                <h4 className="font-medium text-gray-900 dark:text-dark-primary mb-2">Pricing Breakdown</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-primary">
                                    <thead className="bg-gray-100 dark:bg-dark-primary">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Item</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Quantity</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Unit Price</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-primary">
                                      {vendor.aggregated_data.pricing_items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-dark-primary">{item.item || '-'}</td>
                                          <td className="px-3 py-2 text-sm text-gray-500 dark:text-dark-muted">{item.quantity || '-'}</td>
                                          <td className="px-3 py-2 text-sm text-gray-500 dark:text-dark-muted">{item.unit_price || '-'}</td>
                                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-dark-primary">{item.total_price || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ComparisonResults