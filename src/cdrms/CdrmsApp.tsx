import { useCallback, useMemo, useState } from 'react';

import { Box } from '@/components/ui/box';
import { ProjectProvider } from '@/src/cdrms/project/ProjectContext';
import {
  GeoScreen,
  LoginScreen,
  OtpScreen,
  PermissionScreen,
  SplashScreen,
} from '@/src/cdrms/screens/AuthScreens';
import { ApplicationDetailsScreen } from '@/src/cdrms/screens/ApplicationDetailsScreen';
import {
  Dashboard,
  HistoryScreen,
  NotificationsScreen,
  ProfileScreen,
} from '@/src/cdrms/screens/MainScreens';
import {
  BandiScreen,
  DirectionsScreen,
  PhotosScreen,
  ProjectScreen,
  SurroundingsScreen,
  VideoScreen,
} from '@/src/cdrms/screens/SurveyScreens';
import { DimensionsScreen } from '@/src/cdrms/screens/DimensionsScreen';
import {
  DraftScreen,
  ErrorScreen,
  ReturnedScreen,
  ReviewScreen,
  SuccessScreen,
  ValidateScreen,
} from '@/src/cdrms/screens/StateScreens';
import {
  CaoDetailScreen,
  CaoHomeScreen,
} from '@/src/cdrms/screens/CaoScreens';
import {
  ZcCreateScreen,
  ZcDetailScreen,
  ZcHomeScreen,
} from '@/src/cdrms/screens/ZcScreens';
import type { Go, Screen } from '@/src/cdrms/types';

export function CdrmsApp() {
  const [screen, setScreen] = useState<Screen>('splash');

  const go: Go = useCallback((s) => {
    setScreen(s);
  }, []);

  const rendered = useMemo(() => {
    switch (screen) {
      case 'splash':
        return <SplashScreen go={go} />;
      case 'login':
        return <LoginScreen go={go} />;
      case 'otp':
        return <OtpScreen go={go} />;
      case 'permission':
        return <PermissionScreen go={go} />;
      case 'geo':
        return <GeoScreen go={go} />;
      case 'dashboard':
        return <Dashboard go={go} />;
      case 'zc_home':
        return <ZcHomeScreen go={go} />;
      case 'zc_create':
        return <ZcCreateScreen go={go} />;
      case 'zc_detail':
        return <ZcDetailScreen go={go} />;
      case 'cao_home':
        return <CaoHomeScreen go={go} />;
      case 'cao_detail':
        return <CaoDetailScreen go={go} />;
      case 'project':
        return <ProjectScreen go={go} />;
      case 'bandi':
        return <BandiScreen go={go} />;
      case 'dimensions':
        return <DimensionsScreen go={go} />;
      case 'directions':
        return <DirectionsScreen go={go} />;
      case 'surroundings':
        return <SurroundingsScreen go={go} />;
      case 'photos':
        return <PhotosScreen go={go} />;
      case 'video':
        return <VideoScreen go={go} />;
      case 'draft':
        return <DraftScreen go={go} />;
      case 'validate':
        return <ValidateScreen go={go} />;
      case 'review':
        return <ReviewScreen go={go} />;
      case 'success':
        return <SuccessScreen go={go} />;
      case 'notifications':
        return <NotificationsScreen go={go} />;
      case 'history':
        return <HistoryScreen go={go} />;
      case 'details':
        return <ApplicationDetailsScreen go={go} />;
      case 'returned':
        return <ReturnedScreen go={go} />;
      case 'profile':
        return <ProfileScreen go={go} />;
      case 'error':
        return <ErrorScreen go={go} />;
    }
  }, [screen, go]);

  return (
    <ProjectProvider>
      <Box className="flex-1 bg-background">
        <Box key={screen} className="flex-1">
          {rendered}
        </Box>
      </Box>
    </ProjectProvider>
  );
}
