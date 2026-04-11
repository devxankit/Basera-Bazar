import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminProductCategories() {
  return (
    <AdminCategoryManagement 
      type="product" 
      title="Product Categories" 
      description="Manage main product classifications (e.g. Building Materials, Electronics)."
    />
  );
}
