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

/** Kept for callers that still look up screen meta. */
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
        color: '#0D9488',
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

// ─────────────────────────────────────────────
// Clean Spinners for Page & Section Content
// ─────────────────────────────────────────────

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

/** Pure spinner loader inside content area — centered, clean, fast. */
export function ScreenLoader({
  color = COLORS.primary,
  size = 'large',
  minHeight = 340,
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
    <VStack
      className="items-center justify-center"
      style={{ minHeight, flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}
    >
      <ActivityIndicator size={size} color={color} />
    </VStack>
  )
}

interface ListLoaderProps {
  count?: number
  text?: string
  color?: string
  minHeight?: number
}

/** List content area spinner — centered. */
export function ListLoader({
  color = COLORS.primary,
  minHeight = 280,
}: ListLoaderProps = {}) {
  return (
    <VStack
      className="items-center justify-center"
      style={{ minHeight, flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}
    >
      <ActivityIndicator size="large" color={color} />
    </VStack>
  )
}

/** Aliases for compatibility */
export const CardSkeleton = ListLoader
export const ListSkeleton = ListLoader
export const ProfileSkeleton = ScreenLoader
export const DetailSkeleton = ScreenLoader

interface ButtonLoaderProps {
  color?: string
  size?: 'small' | 'large'
}

export function ButtonLoader({ color = '#FFFFFF', size = 'small' }: ButtonLoaderProps) {
  return <ActivityIndicator size={size} color={color} />
}

/**
 * Hook to enforce a minimum loading state duration (default 350ms)
 * so the page spinner displays smoothly upon page navigation.
 */
export function useMinimumLoading(initialLoading = true, minTimeMs = 350) {
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
