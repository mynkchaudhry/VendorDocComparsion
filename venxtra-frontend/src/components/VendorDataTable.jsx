import React from 'react'
import { FileText, Package, Truck, CreditCard, AlertCircle, MessageSquare } from 'lucide-react'

const VendorDataTable = ({ vendor, documents }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-muted dark:text-dark-muted" />
        <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted">No processed documents available</p>
      </div>
    )
  }

  const completedDocs = documents.filter(doc => doc.processing_status === 'completed' && doc.structured_data)

  if (completedDocs.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-muted dark:text-dark-muted" />
        <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted">No successfully processed documents available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg border border-transparent dark:border-dark-primary">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary mb-4">
            Extracted Data for {vendor?.name}
          </h3>
          
          {completedDocs.map((doc, docIndex) => (
            <div key={doc.id} className="mb-8 last:mb-0">
              <div className="bg-gray-50 dark:bg-dark-accent px-4 py-3 rounded-t-lg border-b border-gray-200 dark:border-dark-primary">
                <h4 className="text-md font-medium text-gray-900 dark:text-dark-primary flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-600 dark:text-dark-secondary" />
                  {doc.filename}
                  <span className="ml-2 text-sm text-gray-500 dark:text-dark-muted">
                    ({doc.structured_data.document_type || 'Unknown type'})
                  </span>
                </h4>
              </div>
              
              <div className="border border-gray-200 dark:border-dark-primary rounded-b-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-primary">
                  <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-primary">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary bg-gray-50 dark:bg-dark-accent w-1/4">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-400 dark:text-dark-muted" />
                          Vendor Name
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-secondary">
                        {doc.structured_data.vendor_name || '-'}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary bg-gray-50 dark:bg-dark-accent">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-400 dark:text-dark-muted" />
                          Document Type
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-secondary">
                        {doc.structured_data.document_type || '-'}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary bg-gray-50 dark:bg-dark-accent">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-400 dark:text-dark-muted" />
                          Products/Services
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-secondary">
                        {doc.structured_data.products_or_services?.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {doc.structured_data.products_or_services.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        ) : '-'}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary bg-gray-50 dark:bg-dark-accent">
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-gray-400 dark:text-dark-muted" />
                          Delivery Terms
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-secondary">
                        {doc.structured_data.delivery_terms || '-'}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary bg-gray-50 dark:bg-dark-accent">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-gray-400 dark:text-dark-muted" />
                          Payment Terms
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-secondary">
                        {doc.structured_data.payment_terms || '-'}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary bg-gray-50 dark:bg-dark-accent">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-gray-400 dark:text-dark-muted" />
                          Special Clauses
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-secondary">
                        {doc.structured_data.special_clauses || '-'}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary bg-gray-50 dark:bg-dark-accent">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2 text-gray-400 dark:text-dark-muted" />
                          Notes
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-secondary">
                        {doc.structured_data.notes || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Pricing Table */}
                {doc.structured_data.pricing?.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-dark-primary">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-dark-accent">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-dark-primary">Pricing Details</h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-primary">
                        <thead className="bg-gray-100 dark:bg-dark-accent">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                              Item
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                              Total Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-primary">
                          {doc.structured_data.pricing.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-dark-secondary' : 'bg-gray-50 dark:bg-dark-accent'}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-primary">
                                {item.item || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-dark-muted">
                                {item.quantity || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-dark-muted">
                                {item.unit_price ? `$${item.unit_price}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary">
                                {item.total_price ? `$${item.total_price}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-dark-accent">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-primary text-right">
                              Document Total:
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-dark-primary">
                              ${doc.structured_data.pricing.reduce((sum, item) => {
                                const price = parseFloat(item.total_price?.replace(/[^0-9.-]+/g, '') || '0')
                                return sum + price
                              }, 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VendorDataTable