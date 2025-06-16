'use client'

import { PartnerGuard } from '@/components/PartnerGuard'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PartnerGuard>{children}</PartnerGuard>
}