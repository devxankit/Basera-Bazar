import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminBrands() {
  return (
    <AdminCategoryManagement 
      type="product" 
      endpoint="brands"
      title="Brands" 
      description="Manage product brands available on the platform."
    />
  );
}
