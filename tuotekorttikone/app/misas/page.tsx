'use client'
import { Suspense } from 'react'
import CardListPage from '@/components/CardListPage'

export default function MisasPage() {
  return (
    <Suspense>
      <CardListPage kind="misa" />
    </Suspense>
  )
}
