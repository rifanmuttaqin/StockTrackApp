import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { ArrowLeftIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Badge } from '../../Components/UI';

export default function Show({ stockOut, items, totalQuantity, totalVariants }) {
  // Status configuration matching Index.jsx
  const statusConfig = {
    draft: {
      label: 'Draft',
      variant: 'yellow',
    },
    submit: {
      label: 'Submit',
      variant: 'green',
    },
  };
  
  const status = statusConfig[stockOut.status] || statusConfig.draft;
  
  return (
    <AppLayout
      title={`Stock Out - ${stockOut.date}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Out', href: '/stock-out' },
        { label: 'Detail' }
      ]}
    >
      <Head title={`Stock Out - ${stockOut.date}`} />
      
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
        {/* Header with back button */}
        <div className="mb-6">
          <Link
            href={route('stock-out.index')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to List
          </Link>
        </div>
        
        {/* Stock Out Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Stock Out Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Date: {stockOut.date}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${status.variant}-100 text-${status.variant}-800 mt-2 sm:mt-0`}>
              {status.label}
            </span>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Variants</p>
              <p className="text-2xl font-bold text-gray-900">{totalVariants}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuantity}</p>
            </div>
          </div>
          
          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Created: {new Date(stockOut.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Updated: {new Date(stockOut.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Items List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Items</h2>
          
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items found</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.productVariant?.product?.name || 'Unknown Product'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.productVariant?.variant_name || 'Unknown Variant'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        SKU: {item.productVariant?.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <p className="text-2xl font-bold text-gray-900">
                        {item.quantity}
                      </p>
                      <p className="text-sm text-gray-500">Qty</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        {stockOut.status === 'draft' && (
          <div className="mt-6">
            <Link
              href={route('stock-out.edit', stockOut.id)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Draft
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
