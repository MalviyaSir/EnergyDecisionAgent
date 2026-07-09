import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LearningHistoryPage } from '@/pages/LearningHistoryPage';
import { ModulePage } from '@/pages/ModulePage';
import { ObservationsPage } from '@/pages/ObservationsPage';
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
      {
        path: 'reasoning',
        element: (
          <ModulePage
            title="Reasoning"
            endpoint="/api/reasoning"
            summary="Transparent chain-of-thought-style trace for future explainable decisions."
          />
        ),
      },
      {
        path: 'recommendations',
        element: (
          <ModulePage
            title="Recommendations"
            endpoint="/api/recommendations"
            summary="Ranked action cards with rationale, effort, and expected savings."
          />
        ),
      },
      {
        path: 'savings',
        element: (
          <ModulePage
            title="Savings"
            endpoint="/api/savings"
            summary="Cost, demand, and carbon impact estimates for optimization actions."
          />
        ),
      },
      { path: 'what-if', element: <WhatIfPage /> },
      { path: 'learning-history', element: <LearningHistoryPage /> },
    ],
  },
]);
