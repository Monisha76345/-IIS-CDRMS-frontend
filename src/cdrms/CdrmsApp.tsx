import { useCallback, useEffect, useMemo, useState } from 'react';

import { Box } from '@/components/ui/box';
import { ProjectProvider } from '@/src/cdrms/project/ProjectContext';
import { useAuth } from '@/src/auth/AuthContext';
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
  EngineerDetailScreen,
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
  CaoApplicationsScreen,
  CaoApprovalScreen,
  CaoDetailScreen,
  CaoHomeScreen,
} from '@/src/cdrms/screens/CaoScreens';
import {
  ZcCreateScreen,
  ZcDetailScreen,
  ZcHomeScreen,
} from '@/src/cdrms/screens/ZcScreens';
import type { Go, Screen } from '@/src/cdrms/types';
import { AppDialogHost } from '@/src/cdrms/components/AppDialog';
import { ScreenLoader } from '@/src/cdrms/components/primitives';

function ScreenTransitionWrapper({
  screen,
  children,
}: {
  screen: Screen;
  children: React.ReactNode;
}) {
  const [transitioning, setTransitioning] = useState(false);
  const isAuthScreen =
    screen === 'splash' ||
    screen === 'login' ||
    screen === 'otp' ||
    screen === 'permission' ||
    screen === 'geo';

  useEffect(() => {
    if (isAuthScreen) {
      setTransitioning(false);
      return;
    }
    setTransitioning(true);
    const timer = setTimeout(() => {
      setTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [screen, isAuthScreen]);

  if (transitioning && !isAuthScreen) {
    return <ScreenLoader fullScreen />;
  }

  return <>{children}</>;
}

export function CdrmsApp() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState<Screen>('splash');

  const go: Go = useCallback((s) => {
    setScreen(s);
  }, []);

  // If session is cleared while on an app / gate screen, return to login.
  // Never keep the user on permission/geo without an active login.
  useEffect(() => {
    if (isAuthenticated) return;
    if (screen === 'splash' || screen === 'login' || screen === 'otp') return;
    setScreen('login');
  }, [isAuthenticated, screen]);

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
      case 'cao_apps':
        return <CaoApplicationsScreen go={go} />;
      case 'cao_detail':
        return <CaoDetailScreen go={go} />;
      case 'cao_approve':
        return <CaoApprovalScreen go={go} />;
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
      case 'engineer_detail':
        return <EngineerDetailScreen go={go} />;
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
        <ScreenTransitionWrapper screen={screen}>
          <Box key={screen} className="flex-1">
            {rendered}
          </Box>
        </ScreenTransitionWrapper>
        <AppDialogHost />
      </Box>
    </ProjectProvider>
  );
}
