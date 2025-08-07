import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { vendorsAPI, comparisonAPI, projectsAPI } from '../utils/api'
import { DollarSign, Truck, CreditCard, FileText, Check, ArrowLeft, ChevronRight } from 'lucide-react'

const Comparison = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [selectedVendors, setSelectedVendors] = useState([])
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(false)

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

  const handleVendorToggle = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

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
        <span className="text-gray-900 dark:text-dark-primary font-medium">Compare</span>
      </div>

      {/* Header with Back Button */}
      <div className="bg-white dark:bg-dark-secondary shadow px-4 py-5 sm:rounded-lg sm:px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary bg-gray-100 dark:bg-dark-accent hover:bg-gray-200 dark:hover:bg-dark-primary rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-primary">Compare Vendors</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
              Select vendors to compare their proposals and pricing
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary mb-4">Select Vendors</h3>
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <label key={vendor.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(vendor.id)}
                  onChange={() => handleVendorToggle(vendor.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-dark-primary rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-dark-secondary">
                  {vendor.name}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-6">
            <button
              onClick={handleCompare}
              disabled={selectedVendors.length < 2 || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Comparing...' : 'Compare Selected Vendors'}
            </button>
            {selectedVendors.length < 2 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted">
                Select at least 2 vendors to compare
              </p>
            )}
          </div>
        </div>
      </div>

      {comparisonData && (
        <>
          <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary mb-4">Price Comparison</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comparisonData.vendors.map((vendor) => (
                  <div
                    key={vendor.vendor_id}
                    className={`border rounded-lg p-4 ${
                      vendor.vendor_name === comparisonData.comparison_summary.lowest_price_vendor
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400'
                        : 'border-gray-200 dark:border-dark-primary bg-white dark:bg-dark-accent'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 dark:text-dark-primary">{vendor.vendor_name}</h4>
                    <div className="mt-2 flex items-baseline">
                      <DollarSign className="h-4 w-4 text-gray-400 dark:text-dark-muted" />
                      <span className="text-2xl font-semibold text-gray-900 dark:text-dark-primary">
                        {formatPrice(vendor.aggregated_data.total_pricing)}
                      </span>
                    </div>
                    {vendor.vendor_name === comparisonData.comparison_summary.lowest_price_vendor && (
                      <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        <Check className="h-3 w-3 mr-1" />
                        Lowest Price
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-gray-50 dark:bg-dark-accent rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-dark-primary">Summary</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-dark-secondary">
                  <p>Price Range: {formatPrice(comparisonData.comparison_summary.price_range.min)} - {formatPrice(comparisonData.comparison_summary.price_range.max)}</p>
                  <p>Average Price: {formatPrice(comparisonData.comparison_summary.price_range.average)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary mb-4">Detailed Comparison</h3>
              <div className="space-y-6">
                {comparisonData.vendors.map((vendor) => (
                  <div key={vendor.vendor_id} className="border border-gray-200 dark:border-dark-primary rounded-lg p-4 bg-white dark:bg-dark-accent">
                    <h4 className="font-medium text-gray-900 dark:text-dark-primary text-lg mb-3">{vendor.vendor_name}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-dark-muted mb-2">
                          <FileText className="h-4 w-4 mr-2" />
                          Products/Services
                        </div>
                        {vendor.aggregated_data.products_services.length > 0 ? (
                          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-dark-secondary space-y-1">
                            {vendor.aggregated_data.products_services.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-dark-muted">No data available</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-dark-muted mb-2">
                          <Truck className="h-4 w-4 mr-2" />
                          Delivery Terms
                        </div>
                        {vendor.aggregated_data.delivery_terms.length > 0 ? (
                          <div className="text-sm text-gray-700 dark:text-dark-secondary space-y-1">
                            {vendor.aggregated_data.delivery_terms.map((term, idx) => (
                              <p key={idx}>{term}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-dark-muted">No data available</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-dark-muted mb-2">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Payment Terms
                        </div>
                        {vendor.aggregated_data.payment_terms.length > 0 ? (
                          <div className="text-sm text-gray-700 dark:text-dark-secondary space-y-1">
                            {vendor.aggregated_data.payment_terms.map((term, idx) => (
                              <p key={idx}>{term}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-dark-muted">No data available</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-dark-muted mb-2">
                          <FileText className="h-4 w-4 mr-2" />
                          Documents Analyzed
                        </div>
                        <p className="text-sm text-gray-700 dark:text-dark-secondary">
                          {vendor.aggregated_data.document_count} document(s)
                        </p>
                      </div>
                    </div>

                    {vendor.aggregated_data.pricing_items.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-dark-primary mb-2">Pricing Details</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-primary">
                            <thead className="bg-gray-50 dark:bg-dark-primary">
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
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Comparison