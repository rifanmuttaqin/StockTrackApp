import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { ArrowLeftIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Badge } from '../../Components/UI';

export default function Show({ stockOut, items, totalQuantity, totalVariants }) {
  // Format tanggal ke format Indonesia
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
      title={`Stock Out - ${formatDate(stockOut.date)}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Out', href: '/stock-out' },
        { label: 'Detail' }
      ]}
    >
      <Head title={`Stock Out - ${formatDate(stockOut.date)}`} />
      
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
        {/* Header with back button */}
        <div className="mb-6">
          <Link
            href={route('stock-out.index')}
            className="inline-flex items-center text-slate-500 hover:text-ink"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to List
          </Link>
        </div>
        
        {/* Stock Out Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-ink">
                Stock Out Details
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Date: {formatDate(stockOut.date)}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${status.variant}-100 text-${status.variant}-800 mt-2 sm:mt-0`}>
              {status.label}
            </span>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-appbg rounded-lg p-4">
              <p className="text-sm text-slate-500">Total Variants</p>
              <p className="text-2xl font-bold text-ink">{totalVariants}</p>
            </div>
            <div className="bg-appbg rounded-lg p-4">
              <p className="text-sm text-slate-500">Total Quantity</p>
              <p className="text-2xl font-bold text-ink">{totalQuantity}</p>
            </div>
          </div>
          
          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Created: {formatDate(stockOut.created_at)}
            </p>
            <p className="text-sm text-slate-500">
              Updated: {formatDate(stockOut.updated_at)}
            </p>
          </div>
        </div>
        
        {/* Items List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-ink mb-4">Items</h2>
          
          {items.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No items found</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink">
                        {item.productVariant?.product?.name || 'Unknown Product'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {item.productVariant?.variant_name || 'Unknown Variant'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        SKU: {item.productVariant?.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <p className="text-2xl font-bold text-ink">
                        {item.quantity}
                      </p>
                      <p className="text-sm text-slate-500">Qty</p>
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
              className="inline-flex items-center px-4 py-2 bg-brand text-ink rounded-lg hover:bg-brand-600"
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
