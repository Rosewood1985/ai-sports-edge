import { NextPage } from 'next';
import React from 'react';

import { ContentManagement } from '../../components/dashboard/content/ContentManagement';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { withAuth } from '../../hocs/withAuth';

const ContentPage: NextPage = () => {
  return (
    <AdminLayout title="Content Management" description="Create, edit, and manage content">
      <ContentManagement />
    </AdminLayout>
  );
};

export default withAuth(ContentPage, ['admin']);
