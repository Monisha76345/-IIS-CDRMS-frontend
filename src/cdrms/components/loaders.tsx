import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  FileText,
  History,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  User,
  Bell,
  Camera,
  Compass,
  Ruler,
  type LucideIcon,
} from 'lucide-react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Skeleton } from '@/components/ui/skeleton'
import { COLORS } from '@/src/cdrms/theme'
import type { Screen } from '@/src/cdrms/types'

export type ScreenLoaderMeta = {
  title: string
  subtitle: string
  icon: LucideIcon
  color: string
}

export function getScreenLoaderConfig(screen: Screen): ScreenLoaderMeta {
  switch (screen) {
    case 'zc_home':
      return {
        title: 'Zonal Commissioner Dashboard',
        subtitle: 'Loading zone applications & assigned tasks…',
        icon: Building2,
        color: '#4F8CFF',
      }
    case 'zc_create':
      return {
        title: 'New Application',
        subtitle: 'Preparing site dimension form…',
        icon: FilePlus2,
        color: '#4F8CFF',
      }
    case 'zc_detail':
      return {
        title: 'Application Details',
        subtitle: 'Fetching application particulars & status…',
        icon: FileText,
        color: '#4F8CFF',
      }
    case 'cao_home':
      return {
        title: 'CAO Verification Portal',
        subtitle: 'Loading verification queue & returned tasks…',
        icon: ShieldCheck,
        color: '#8B5CF6',
      }
    case 'cao_apps':
      return {
        title: 'CAO Applications',
        subtitle: 'Loading all applications in your zone…',
        icon: FileText,
        color: '#8B5CF6',
      }
    case 'cao_detail':
      return {
        title: 'View Application',
        subtitle: 'Loading application particulars & engineer capture…',
        icon: FileCheck2,
        color: '#8B5CF6',
      }
    case 'cao_approve':
      return {
        title: 'View Application',
        subtitle: 'Loading application for view & PDF download…',
        icon: FileCheck2,
        color: '#8B5CF6',
      }
    case 'dashboard':
      return {
        title: 'Field Engineer Workspace',
        subtitle: 'Syncing assigned projects & site tasks…',
        icon: LayoutDashboard,
        color: COLORS.primary,
      }
    case 'project':
      return {
        title: 'Project Workspace',
        subtitle: 'Loading site details & GPS location…',
        icon: Building2,
        color: COLORS.primary,
      }
    case 'bandi':
      return {
        title: 'Site Boundaries',
        subtitle: 'Loading north, south, east, west boundaries…',
        icon: MapPin,
        color: COLORS.primary,
      }
    case 'dimensions':
      return {
        title: 'Site Dimensions',
        subtitle: 'Loading dimension calculations & road width…',
        icon: Ruler,
        color: COLORS.primary,
      }
    case 'directions':
      return {
        title: 'Site Directions',
        subtitle: 'Loading directional coordinates…',
        icon: Compass,
        color: COLORS.primary,
      }
    case 'surroundings':
      return {
        title: 'Surrounding Details',
        subtitle: 'Loading nearby roads & building particulars…',
        icon: Building2,
        color: COLORS.primary,
      }
    case 'photos':
      return {
        title: 'Site Photos',
        subtitle: 'Loading captured site images…',
        icon: Camera,
        color: COLORS.primary,
      }
    case 'video':
      return {
        title: 'Site Video',
        subtitle: 'Loading recorded site walkthrough…',
        icon: Camera,
        color: COLORS.primary,
      }
    case 'draft':
      return {
        title: 'Survey Drafts',
        subtitle: 'Loading offline draft surveys…',
        icon: FileText,
        color: COLORS.primary,
      }
    case 'validate':
    case 'review':
      return {
        title: 'Survey Review',
        subtitle: 'Validating site measurements & photos…',
        icon: CheckCircle2,
        color: '#059669',
      }
    case 'history':
      return {
        title: 'Application Records',
        subtitle: 'Loading submitted application history…',
        icon: History,
        color: '#0284C7',
      }
    case 'details':
      return {
        title: 'Application Particulars',
        subtitle: 'Fetching complete application record…',
        icon: FileText,
        color: '#0284C7',
      }
    case 'notifications':
      return {
        title: 'Notifications',
        subtitle: 'Fetching recent authority updates…',
        icon: Bell,
        color: '#EA580C',
      }
    case 'profile':
      return {
        title: 'Officer Profile',
        subtitle: 'Loading officer details & credentials…',
        icon: User,
        color: '#6366F1',
      }
    case 'geo':
      return {
        title: 'Geo Location Validation',
        subtitle: 'Acquiring GPS coordinates…',
        icon: MapPin,
        color: COLORS.primary,
      }
    case 'login':
    case 'otp':
    case 'permission':
      return {
        title: 'Authentication',
        subtitle: 'Verifying authority credentials…',
        icon: ShieldCheck,
        color: COLORS.primary,
      }
    default:
      return {
        title: 'CDRMS Authority Portal',
        subtitle: 'Loading screen data…',
        icon: Building2,
        color: COLORS.primary,
      }
  }
}

interface ScreenLoaderProps {
  text?: string
  title?: string
  subtitle?: string
  color?: string
  size?: 'small' | 'large'
  minHeight?: number
  fullScreen?: boolean
  icon?: LucideIcon
}

export function ScreenLoader({
  text,
  title,
  subtitle,
  color = COLORS.primary,
  size = 'large',
  minHeight = 280,
  fullScreen = false,
  icon: Icon = Building2,
}: ScreenLoaderProps) {
  const labelText = text || subtitle || 'Loading details…'

  if (fullScreen) {
    return (
      <VStack
        className="flex-1 items-center justify-center p-6 text-center"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <Box
          className="items-center justify-center rounded-3xl border p-8"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E2E8F0',
            width: '88%',
            maxWidth: 340,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: `${color}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Icon size={28} color={color} strokeWidth={2.2} />
          </View>

          {Boolean(title) && (
            <Text
              className="text-base font-extrabold text-foreground mb-1 text-center"
              style={{ color: '#0F172A' }}
            >
              {title}
            </Text>
          )}

          <HStack className="items-center gap-2 mt-2 mb-1 justify-center">
            <ActivityIndicator size="small" color={color} />
            <Text
              className="text-xs font-semibold tracking-wide"
              style={{ color: '#64748B' }}
            >
              {labelText}
            </Text>
          </HStack>
        </Box>
      </VStack>
    )
  }

  return (
    <VStack
      className="items-center justify-center p-6 text-center"
      style={{ minHeight }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: `${color}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <ActivityIndicator size={size} color={color} />
      </View>
      {Boolean(title) && (
        <Text
          className="text-sm font-extrabold text-foreground mb-1 text-center"
          style={{ color: '#0F172A' }}
        >
          {title}
        </Text>
      )}
      <Text
        className="text-xs font-semibold tracking-wide uppercase text-center"
        style={{ color: '#64748B' }}
      >
        {labelText}
      </Text>
    </VStack>
  )
}

interface ListLoaderProps {
  count?: number
  text?: string
}

export function ListLoader({ count = 3, text = 'Loading records…' }: ListLoaderProps) {
  return (
    <VStack className="gap-3 p-4">
      {Boolean(text) && (
        <HStack className="items-center gap-2 mb-1 justify-center">
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text className="text-xs font-medium" style={{ color: '#64748B' }}>
            {text}
          </Text>
        </HStack>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={`list-skeleton-${i}`}
          className="p-4 rounded-2xl border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
        >
          <HStack className="items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <VStack className="flex-1 gap-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </VStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}

interface ButtonLoaderProps {
  color?: string
  size?: 'small' | 'large'
}

export function ButtonLoader({ color = '#FFFFFF', size = 'small' }: ButtonLoaderProps) {
  return <ActivityIndicator size={size} color={color} />
}

/**
 * Hook to enforce a minimum 500ms (0.5s) loading state duration
 * so loading indicators display smoothly before revealing screen data.
 */
export function useMinimumLoading(initialLoading = true, minTimeMs = 500) {
  const [loading, setLoading] = useState(initialLoading)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (initialLoading) {
      setLoading(true)
      timer = setTimeout(() => {
        setLoading(false)
      }, minTimeMs)
    } else {
      setLoading(false)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [initialLoading, minTimeMs])

  return loading
}
