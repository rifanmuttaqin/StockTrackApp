import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { Alert } from '../../../Components/UI';
import {
  MagnifyingGlassIcon,
  BanknotesIcon,
  CubeIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

/**
 * Asset Report Page
 * Menampilkan total nilai aset (modal barang) = harga beli x stok tersedia.
 */
const Index = ({ items = [], statistics = {}, filters = {}, error }) => {
  const { props } = usePage();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(filters?.search || '');

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value ?? 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/reports/asset', { search: search || undefined }, {
      preserveState: true,
      preserveScroll: true,
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    });
  };

  const handleReset = () => {
    setSearch('');
    router.get('/reports/asset', {}, {
      preserveState: true,
      preserveScroll: true,
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    });
  };

  const stats = [
    {
      label: 'Total Nilai Aset',
      value: formatRupiah(statistics?.grand_total),
      icon: BanknotesIcon,
      bg: 'bg-brand',
    },
    {
      label: 'Total Qty Tersedia',
      value: (statistics?.total_qty ?? 0).toLocaleString('id-ID'),
      icon: CubeIcon,
      bg: 'bg-green-500',
    },
    {
      label: 'Jumlah Produk',
      value: (statistics?.total_products ?? 0).toLocaleString('id-ID'),
      icon: ArchiveBoxIcon,
      bg: 'bg-amber-500',
    },
    {
      label: 'Jumlah Varian',
      value: (statistics?.total_variants ?? 0).toLocaleString('id-ID'),
      icon: Squares2X2Icon,
      bg: 'bg-sky-500',
    },
  ];

  return (
    <AppLayout
      title="Laporan Aset"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Laporan Aset' },
      ]}
    >
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-ink sm:text-3xl sm:truncate">
            Laporan Aset
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Nilai modal barang berdasarkan harga beli × stok yang tersedia
          </p>
        </div>

        {(props.flash?.success || props.flash?.error || error) && (
          <div className="mb-4">
            {props.flash?.success && <Alert type="success" message={props.flash.success} />}
            {(props.flash?.error || error) && <Alert type="error" message={props.flash?.error || error} />}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 ${stat.bg} rounded-md flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">{stat.label}</dt>
                        <dd className="text-lg font-bold text-ink truncate">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="bg-white shadow rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk, varian, atau SKU..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-ink bg-brand hover:bg-brand-600 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Mencari...' : 'Cari'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-appbg focus:outline-none"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-appbg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Varian / SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Harga Beli</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {items.length > 0 ? (
                  items.map((item, idx) => {
                    if (item.is_product_summary) {
                      return (
                        <tr key={`summary-${item.product_id}-${idx}`} className="bg-brand-50">
                          <td colSpan="2" className="px-6 py-2 text-xs font-medium text-brand-800">
                            Subtotal {item.product_name} ({item.variant_count} varian)
                          </td>
                          <td className="px-6 py-2 text-right text-xs font-medium text-brand-800">
                            {(item.product_qty ?? 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-2 text-right text-xs text-brand-800">—</td>
                          <td className="px-6 py-2 text-right text-sm font-bold text-brand-800">
                            {formatRupiah(item.product_total)}
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={item.variant_id || idx} className="hover:bg-appbg">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-ink">{item.product_name}</div>
                          <div className="text-xs text-slate-500">{item.product_sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-ink">{item.variant_name}</div>
                          <div className="text-xs text-slate-500">
                            {item.variant_sku}
                            {item.unit ? ` • ${item.unit.abbreviation}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-ink">
                          {(item.stock_current ?? 0).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-ink">
                          {formatRupiah(item.purchase_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-ink">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                      Tidak ada data aset ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-appbg">
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-bold text-ink">
                      Grand Total Aset
                    </td>
                    <td className="px-6 py-3 text-right text-base font-bold text-ink">
                      {formatRupiah(statistics?.grand_total)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="mt-4 bg-brand-50 border border-brand-200 rounded-lg p-4">
          <p className="text-sm text-brand-700">
            Nilai aset = harga beli × stok tersedia per varian. Produk existing yang harga belinya
            masih 0 berkontribusi 0 — perbarui harga belinya lewat menu Edit Produk.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
