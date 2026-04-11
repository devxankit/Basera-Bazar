import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminPropertyCategories() {
  return (
    <AdminCategoryManagement 
      type="property" 
      title="Property Categories" 
      description="Manage top-level property classifications (e.g. Residential, Commercial, Land)."
    />
  );
}
