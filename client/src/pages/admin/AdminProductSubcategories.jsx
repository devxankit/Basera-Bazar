import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminProductSubcategories() {
  return (
    <AdminCategoryManagement 
      type="product" 
      showParent={true}
      title="Product Sub-Categories" 
      description="Manage granular product types linked to main categories."
    />
  );
}
