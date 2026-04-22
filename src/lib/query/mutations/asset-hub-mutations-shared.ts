import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'

export const GLOBAL_ASSET_PROJECT_ID = 'global-asset-hub'

export function invalidateGlobalCharacters(queryClient: QueryClient) {
  // invalidateQueries 会标记数据为 stale，并在组件使用时重新获取
  // exact: false 确保匹配所有以 ['global-assets', 'unified'] 开头的 key
  void queryClient.invalidateQueries({
    queryKey: queryKeys.assets.all('global'),
    exact: false,
  })
}

export function invalidateGlobalLocations(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.assets.all('global'),
    exact: false,
  })
}

export function invalidateGlobalVoices(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.assets.all('global'),
    exact: false,
  })
}
