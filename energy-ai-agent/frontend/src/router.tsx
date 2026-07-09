import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LearningHistoryPage } from '@/pages/LearningHistoryPage';
import { ModulePage } from '@/pages/ModulePage';
import { ObservationsPage } from '@/pages/ObservationsPage';
import { ReasoningPage } from '@/pages/ReasoningPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { SavingsPage } from '@/pages/SavingsPage';
import { WhatIfPage } from '@/pages/WhatIfPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'observations', element: <ObservationsPage /> },
      {
        path: 'predictions',
        element: (
          <ModulePage
            title="Predictions"
            endpoint="/api/predictions"
            summary="Forward-looking energy, peak-risk, and confidence projections."
          />
        ),
      },
      { path: 'reasoning', element: <ReasoningPage /> },
      { path: 'recommendations', element: <RecommendationsPage /> },
      { path: 'savings', element: <SavingsPage /> },
      { path: 'what-if', element: <WhatIfPage /> },
      { path: 'learning-history', element: <LearningHistoryPage /> },
      // TODO: Add an Upload route only when the CSV upload module is implemented.
      // TODO: Wire upload completion into the Observation Engine once that flow exists.
    ],
  },
]);
