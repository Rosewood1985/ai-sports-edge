import React from 'react';
import { NextPage } from 'next';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { ContentManagement } from '../../components/dashboard/content/ContentManagement';
import { withAuth } from '../../hocs/withAuth';

const ContentPage: NextPage = () => {
  return (
    <AdminLayout title="Content Management" description="Create, edit, and manage content">
      <ContentManagement />
    </AdminLayout>
  );
};

export default withAuth(ContentPage, ['admin']);
