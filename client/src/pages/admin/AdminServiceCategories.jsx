import React from 'react';
import AdminCategoryManagement from './AdminCategoryManagement';

export default function AdminServiceCategories() {
  return (
    <AdminCategoryManagement 
      type="service" 
      title="Service Categories" 
      description="Manage main service groups like Maintenance, Legal, Construction."
    />
  );
}
