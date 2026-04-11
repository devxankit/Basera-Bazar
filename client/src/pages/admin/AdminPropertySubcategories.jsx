import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminPropertySubcategories() {
  return (
    <AdminCategoryManagement 
      type="property" 
      showParent={true}
      title="Property Subcategories" 
      description="Manage detailed types (e.g. Apartments, Penthouses, IT Parks) linked to main categories."
    />
  );
}
