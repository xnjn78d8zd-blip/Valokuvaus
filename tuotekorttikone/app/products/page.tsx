'use client'
import { Suspense } from 'react'
import CardListPage from '@/components/CardListPage'

export default function ProductsPage() {
  return (
    <Suspense>
      <CardListPage kind="product" />
    </Suspense>
  )
}
