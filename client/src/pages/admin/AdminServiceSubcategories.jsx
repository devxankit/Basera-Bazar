import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminServiceSubcategories() {
  return (
    <AdminCategoryManagement 
      type="service" 
      showParent={true}
      title="Service Subcategories" 
      description="Manage granular services like Plumbers, Electricians, Architects."
    />
  );
}
