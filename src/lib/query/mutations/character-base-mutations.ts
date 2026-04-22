import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logError as _ulogError } from '@/lib/logging/core'
import { useRef } from 'react'
import type { Character, Project } from '@/types/project'
import { queryKeys } from '../keys'
import type { AssetSummary, CharacterAssetSummary } from '@/lib/assets/contracts'
import { apiFetch } from '@/lib/api-fetch'
import {
    clearTaskTargetOverlay,
    upsertTaskTargetOverlay,
} from '../task-target-overlay'
import {
    requestJsonWithError,
    requestVoidWithError,
} from './mutation-shared'

interface SelectProjectCharacterImageContext {
    previousAssets: AssetSummary[] | undefined
    previousProject: Project | undefined
    targetKey: string
    requestId: number
}

interface DeleteProjectCharacterContext {
    previousAssets: AssetSummary[] | undefined
    previousProject: Project | undefined
}

function applyCharacterSelectionToAssetSummary(
    assets: AssetSummary[],
    characterId: string,
    appearanceId: string,
    selectedIndex: number | null,
): AssetSummary[] {
    return assets.map((asset) => {
        if (asset.kind !== 'character' || asset.id !== characterId) return asset
        const characterAsset = asset as CharacterAssetSummary
        return {
            ...characterAsset,
            variants: characterAsset.variants.map((variant) => {
                if (variant.id !== appearanceId) return variant
                const selectedRenderIndex = selectedIndex
                return {
                    ...variant,
                    selectionState: {
                        selectedRenderIndex,
                    },
                    renders: variant.renders.map((render, index) => ({
                        ...render,
                        isSelected: index === selectedIndex,
                    })),
                }
            }),
        }
    })
}

function applyCharacterSelectionToCharacters(
    characters: Character[],
    characterId: string,
    appearanceId: string,
    selectedIndex: number | null,
): Character[] {
    return characters.map((character) => {
        if (character.id !== characterId) return character
        return {
            ...character,
            appearances: (character.appearances || []).map((appearance) => {
                if (appearance.id !== appearanceId) return appearance
                const selectedUrl =
                    selectedIndex !== null && selectedIndex >= 0
                        ? (appearance.imageUrls[selectedIndex] ?? null)
                        : null
                return {
                    ...appearance,
                    selectedIndex,
                    imageUrl: selectedUrl ?? appearance.imageUrl ?? null,
                }
            }),
        }
    })
}

function applyCharacterSelectionToProject(
    previous: Project | undefined,
    characterId: string,
    appearanceId: string,
    selectedIndex: number | null,
): Project | undefined {
    if (!previous?.novelPromotionData) return previous
    const currentCharacters = previous.novelPromotionData.characters || []
    return {
        ...previous,
        novelPromotionData: {
            ...previous.novelPromotionData,
            characters: applyCharacterSelectionToCharacters(currentCharacters, characterId, appearanceId, selectedIndex),
        },
    }
}

function removeCharacterFromAssetSummary(
    assets: AssetSummary[],
    characterId: string,
): AssetSummary[] {
    return assets.filter((asset) => asset.id !== characterId)
}

function removeCharacterFromProject(
    previous: Project | undefined,
    characterId: string,
): Project | undefined {
    if (!previous?.novelPromotionData) return previous
    const currentCharacters = previous.novelPromotionData.characters || []
    return {
        ...previous,
        novelPromotionData: {
            ...previous.novelPromotionData,
            characters: currentCharacters.filter((character) => character.id !== characterId),
        },
    }
}

export function useGenerateProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.assets.all('project', projectId), exact: false })

    return useMutation({
        mutationFn: async ({
            characterId,
            appearanceId,
            count,
        }: {
            characterId: string
            appearanceId: string
            count?: number
        }) => {
            return await requestJsonWithError(`/api/assets/${characterId}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    appearanceId,
                    count,
                })
            }, 'Failed to generate image')
        },
        onMutate: ({ appearanceId }) => {
            upsertTaskTargetOverlay(queryClient, {
                projectId,
                targetType: 'CharacterAppearance',
                targetId: appearanceId,
                intent: 'generate',
            })
        },
        onError: (_error, { appearanceId }) => {
            clearTaskTargetOverlay(queryClient, {
                projectId,
                targetType: 'CharacterAppearance',
                targetId: appearanceId,
            })
        },
        onSettled: invalidateProjectAssets,
    })
}

/**
 * 上传项目角色图片
 */

export function useUploadProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.assets.all('project', projectId), exact: false })

    return useMutation({
        mutationFn: async ({
            file, characterId, appearanceId, imageIndex, labelText
        }: {
            file: File
            characterId: string
            appearanceId: string
            imageIndex?: number
            labelText?: string
        }) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'character')
            formData.append('id', characterId)
            formData.append('appearanceId', appearanceId)
            if (imageIndex !== undefined) formData.append('imageIndex', imageIndex.toString())
            if (labelText) formData.append('labelText', labelText)

            return await requestJsonWithError(`/api/novel-promotion/${projectId}/upload-asset-image`, {
                method: 'POST',
                body: formData
            }, 'Failed to upload image')
        },
        onSuccess: invalidateProjectAssets,
    })
}

/**
 * 选择项目角色图片
 */

export function useSelectProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const latestRequestIdByTargetRef = useRef<Record<string, number>>({})
    const invalidateProjectAssets = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.assets.all('project', projectId), exact: false })

    return useMutation({
        mutationFn: async ({
            characterId, appearanceId, imageIndex
        }: {
            characterId: string
            appearanceId: string
            imageIndex: number | null
            confirm?: boolean
        }) => {
            return await requestJsonWithError(`/api/assets/${characterId}/select-render`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    appearanceId,
                    imageIndex,
                })
            }, 'Failed to select image')
        },
        onMutate: async (variables): Promise<SelectProjectCharacterImageContext> => {
            const targetKey = `${variables.characterId}:${variables.appearanceId}`
            const requestId = (latestRequestIdByTargetRef.current[targetKey] ?? 0) + 1
            latestRequestIdByTargetRef.current[targetKey] = requestId

            // 🔥 使用 useAssets 实际使用的 queryKey 根路径
            const assetsQueryKey = queryKeys.assets.all('project', projectId)
            const projectQueryKey = queryKeys.projectData(projectId)

            await queryClient.cancelQueries({ queryKey: assetsQueryKey, exact: false })
            await queryClient.cancelQueries({ queryKey: projectQueryKey })

            const previousAssets = queryClient.getQueryData<AssetSummary[]>(assetsQueryKey)
            const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

            // 🔥 使用 exact: false 匹配所有以 assetsQueryKey 开头的缓存
            queryClient.setQueriesData<AssetSummary[] | undefined>(
                { queryKey: assetsQueryKey, exact: false },
                (previous) =>
                    previous ? applyCharacterSelectionToAssetSummary(previous, variables.characterId, variables.appearanceId, variables.imageIndex) : previous,
            )
            queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
                applyCharacterSelectionToProject(previous, variables.characterId, variables.appearanceId, variables.imageIndex),
            )

            return {
                previousAssets,
                previousProject,
                targetKey,
                requestId,
            }
        },
        onError: (_error, _variables, context) => {
            if (!context) return
            const latestRequestId = latestRequestIdByTargetRef.current[context.targetKey]
            if (latestRequestId !== context.requestId) return
            // 🔥 恢复正确的 queryKey
            queryClient.setQueriesData(
                { queryKey: queryKeys.assets.all('project', projectId), exact: false },
                context.previousAssets,
            )
            queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
        },
        onSettled: (_data, _error, _variables) => {
            // 🔥 无论 confirm 是什么值，都要 invalidate 确保 UI 更新
            void invalidateProjectAssets()
        },
    })
}

/**
 * 撤回项目角色图片
 */

export function useUndoProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.assets.all('project', projectId), exact: false })

    return useMutation({
        mutationFn: async ({ characterId, appearanceId }: { characterId: string; appearanceId: string }) => {
            return await requestJsonWithError(`/api/assets/${characterId}/revert-render`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    appearanceId
                })
            }, 'Failed to undo image')
        },
        onSuccess: invalidateProjectAssets,
    })
}

/**
 * 删除项目角色
 */

export function useDeleteProjectCharacter(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.assets.all('project', projectId), exact: false })

    return useMutation({
        mutationFn: async (characterId: string) => {
            await requestVoidWithError(
                `/api/novel-promotion/${projectId}/character?id=${encodeURIComponent(characterId)}`,
                { method: 'DELETE' },
                'Failed to delete character',
            )
        },
        onMutate: async (characterId): Promise<DeleteProjectCharacterContext> => {
            const assetsQueryKey = queryKeys.assets.all('project', projectId)
            const projectQueryKey = queryKeys.projectData(projectId)

            await queryClient.cancelQueries({ queryKey: assetsQueryKey, exact: false })
            await queryClient.cancelQueries({ queryKey: projectQueryKey })

            const previousAssets = queryClient.getQueryData<AssetSummary[]>(assetsQueryKey)
            const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

            queryClient.setQueriesData<AssetSummary[] | undefined>(
                { queryKey: assetsQueryKey, exact: false },
                (previous) => previous ? removeCharacterFromAssetSummary(previous, characterId) : previous,
            )
            queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
                removeCharacterFromProject(previous, characterId),
            )

            return {
                previousAssets,
                previousProject,
            }
        },
        onError: (_error, _characterId, context) => {
            if (!context) return
            queryClient.setQueriesData(
                { queryKey: queryKeys.assets.all('project', projectId), exact: false },
                context.previousAssets,
            )
            queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
        },
        onSettled: invalidateProjectAssets,
    })
}

/**
 * 删除项目角色形象
 */

export function useDeleteProjectAppearance(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.assets.all('project', projectId), exact: false })

    return useMutation({
        mutationFn: async ({ characterId, appearanceId }: { characterId: string; appearanceId: string }) => {
            await requestVoidWithError(
                `/api/novel-promotion/${projectId}/character/appearance?characterId=${encodeURIComponent(characterId)}&appearanceId=${encodeURIComponent(appearanceId)}`,
                { method: 'DELETE' },
                'Failed to delete appearance',
            )
        },
        onSuccess: invalidateProjectAssets,
    })
}

/**
 * 更新项目角色名字
 */

export function useUpdateProjectCharacterName(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.assets.all('project', projectId), exact: false })

    return useMutation({
        mutationFn: async ({ characterId, name }: { characterId: string; name: string }) => {
            const res = await requestJsonWithError(`/api/assets/${characterId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    name,
                })
            }, 'Failed to update character name')

            // 等待图片标签更新完成，确保 onSuccess invalidate 后前端能立即看到新标签
            try {
                await apiFetch(`/api/assets/${characterId}/update-label`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scope: 'project',
                        kind: 'character',
                        projectId,
                        newName: name
                    })
                })
            } catch (e) {
                _ulogError('更新图片标签失败:', e)
            }

            return res
        },
        onSuccess: invalidateProjectAssets,
    })
}
