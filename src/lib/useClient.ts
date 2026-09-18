import { useOutletContext } from 'react-router-dom'
import type { Client } from '@/types'

export function useClientOutlet(): Client {
  return useOutletContext<Client>()
}
