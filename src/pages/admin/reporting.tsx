import React from 'react';
import { NextPage } from 'next';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { ReportingCenter } from '../../components/dashboard/reporting/ReportingCenter';
import { withAuth } from '../../hocs/withAuth';

/**
 * Admin reporting page
 */
const ReportingPage: NextPage = () => {
  return (
    <AdminLayout title="Reporting" description="Generate and manage reports for AI Sports Edge">
      <ReportingCenter />
    </AdminLayout>
  );
};

export default withAuth(ReportingPage, ['admin']);
