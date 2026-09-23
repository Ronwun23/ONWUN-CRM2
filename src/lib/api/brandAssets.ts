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

// Fetches one client's brand assets — called lazily, the first time that
// client is actually opened.
export async function fetchBrandAssetsForClient(clientId: string): Promise<BrandAsset[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('client_id', Number(clientId))
    .order('id', { ascending: false })
  if (error) throw error
  return (data as BrandAssetRow[]).map(rowToAsset)
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
