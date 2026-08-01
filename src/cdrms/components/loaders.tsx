import React, { useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import {
  Building2,
  CheckCircle2,
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
import { VStack } from '@/components/ui/vstack'
import { COLORS } from '@/src/cdrms/theme'
import type { Screen } from '@/src/cdrms/types'

export type ScreenLoaderMeta = {
  title: string
  subtitle: string
  icon: LucideIcon
  color: string
}

/** Kept for callers that still look up screen meta; UI no longer shows title/text. */
export function getScreenLoaderConfig(screen: Screen): ScreenLoaderMeta {
  switch (screen) {
    case 'zc_home':
    case 'zc_create':
    case 'zc_detail':
      return {
        title: 'ZC',
        subtitle: '',
        icon: Building2,
        color: '#4F8CFF',
      }
    case 'cao_home':
    case 'cao_apps':
    case 'cao_detail':
    case 'cao_approve':
      return {
        title: 'CAO',
        subtitle: '',
        icon: ShieldCheck,
        color: '#8B5CF6',
      }
    case 'dashboard':
    case 'history':
    case 'engineer_detail':
      return {
        title: 'Dashboard',
        subtitle: '',
        icon: LayoutDashboard,
        color: COLORS.primary,
      }
    case 'project':
      return {
        title: 'Project',
        subtitle: '',
        icon: Building2,
        color: COLORS.primary,
      }
    case 'bandi':
      return {
        title: 'Boundaries',
        subtitle: '',
        icon: MapPin,
        color: COLORS.primary,
      }
    case 'dimensions':
      return {
        title: 'Dimensions',
        subtitle: '',
        icon: Ruler,
        color: COLORS.primary,
      }
    case 'directions':
      return {
        title: 'Directions',
        subtitle: '',
        icon: Compass,
        color: COLORS.primary,
      }
    case 'surroundings':
      return {
        title: 'Surroundings',
        subtitle: '',
        icon: Building2,
        color: COLORS.primary,
      }
    case 'photos':
    case 'video':
      return {
        title: 'Media',
        subtitle: '',
        icon: Camera,
        color: COLORS.primary,
      }
    case 'draft':
      return {
        title: 'Drafts',
        subtitle: '',
        icon: FileText,
        color: COLORS.primary,
      }
    case 'validate':
    case 'review':
      return {
        title: 'Review',
        subtitle: '',
        icon: CheckCircle2,
        color: '#059669',
      }
    case 'details':
      return {
        title: 'Details',
        subtitle: '',
        icon: FileText,
        color: '#0284C7',
      }
    case 'notifications':
      return {
        title: 'Notifications',
        subtitle: '',
        icon: Bell,
        color: '#EA580C',
      }
    case 'profile':
      return {
        title: 'Profile',
        subtitle: '',
        icon: User,
        color: '#6366F1',
      }
    case 'geo':
      return {
        title: 'Geo',
        subtitle: '',
        icon: MapPin,
        color: COLORS.primary,
      }
    case 'login':
    case 'otp':
    case 'permission':
      return {
        title: 'Auth',
        subtitle: '',
        icon: ShieldCheck,
        color: COLORS.primary,
      }
    default:
      return {
        title: 'CDRMS',
        subtitle: '',
        icon: FilePlus2,
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

/** Spinner only — no card, icon, title, or loading text. */
export function ScreenLoader({
  color = COLORS.primary,
  size = 'large',
  minHeight = 280,
  fullScreen = false,
}: ScreenLoaderProps) {
  if (fullScreen) {
    return (
      <VStack
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <ActivityIndicator size={size} color={color} />
      </VStack>
    )
  }

  return (
    <VStack className="items-center justify-center" style={{ minHeight }}>
      <ActivityIndicator size={size} color={color} />
    </VStack>
  )
}

interface ListLoaderProps {
  count?: number
  text?: string
}

/** Spinner only — no skeleton cards or loading text. */
export function ListLoader(_props: ListLoaderProps = {}) {
  return (
    <VStack className="items-center justify-center" style={{ minHeight: 160, paddingVertical: 24 }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
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
