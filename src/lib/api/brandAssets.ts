import { supabase } from '@/lib/supabase'
import type { BrandAsset } from '@/types'

interface BrandAssetRow {
  id: number
  client_id: number
  title: string
  type: string
  added_at: string
}

function rowToAsset(row: BrandAssetRow): BrandAsset {
  return {
    id: String(row.id),
    title: row.title,
    type: row.type as BrandAsset['type'],
    addedAt: row.added_at,
  }
}

export async function fetchBrandAssetsByClient(): Promise<Record<string, BrandAsset[]>> {
  const { data, error } = await supabase.from('brand_assets').select('*').order('id', { ascending: false })
  if (error) throw error
  const byClient: Record<string, BrandAsset[]> = {}
  for (const row of data as BrandAssetRow[]) {
    const key = String(row.client_id)
    ;(byClient[key] ??= []).push(rowToAsset(row))
  }
  return byClient
}

export async function insertBrandAsset(clientId: string, asset: BrandAsset): Promise<BrandAsset> {
  const { data, error } = await supabase
    .from('brand_assets')
    .insert({ client_id: Number(clientId), title: asset.title, type: asset.type, added_at: asset.addedAt })
    .select()
    .single()
  if (error) throw error
  return rowToAsset(data as BrandAssetRow)
}
