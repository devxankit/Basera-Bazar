import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminProductUnits() {
  return (
    <AdminCategoryManagement 
      type="product" 
      endpoint="units"
      title="Product Units" 
      description="Manage measurement units like Kilograms, Pieces, Square Feet."
    />
  );
}
