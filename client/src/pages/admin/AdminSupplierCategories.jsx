import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminSupplierCategories() {
  return (
    <AdminCategoryManagement 
      type="supplier" 
      title="Supplier Categories" 
      description="Manage supplier types like Manufacturers, Wholesalers, Retailers."
    />
  );
}
