import type { AxiosRequestConfig } from 'axios'
import { comments, diaries, spots } from './data'
import type { Comment, Diary, Result, Spot } from '../../types/api'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function parseIdFromUrl(url: string) {
  const match = url.match(/\/(\d+)(?:\?.*)?$/)
  return match ? Number(match[1]) : null
}

function success<T>(data: T): Result<T> {
  return { code: 0, message: 'ok', data }
}

function notFound<T>(message: string): Result<T> {
  return { code: 404, message, data: null as unknown as T }
}

export async function useMockRequest<T>(config: AxiosRequestConfig): Promise<Result<T>> {
  const url = config.url || ''
  const method = (config.method || 'GET').toUpperCase()
  await delay()

  // Spots list
  if (url === '/spots' && method === 'GET') {
    return success(spots as T)
  }

  // Spot detail
  if (url.startsWith('/spots/') && method === 'GET') {
    const id = parseIdFromUrl(url)
    const spot = spots.find((s) => s.id === id)
    return spot ? success(spot as T) : notFound<T>('Spot not found')
  }

  // Diaries list
  if (url === '/diaries' && method === 'GET') {
    return success(diaries as T)
  }

  // Diary detail
  if (url.startsWith('/diaries/') && method === 'GET') {
    const id = parseIdFromUrl(url)
    const diary = diaries.find((d) => d.id === id)
    return diary ? success(diary as T) : notFound<T>('Diary not found')
  }

  // Diary create
  if (url === '/diaries' && method === 'POST') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const newDiary: Diary = {
      id: Date.now(),
      title: payload.title,
      content: payload.content,
      cover: payload.cover,
      spotId: payload.spotId,
      author: { id: 999, name: 'Mock User', avatar: 'https://i.pravatar.cc/80?img=8' },
      stats: { likes: 0, comments: 0 },
      createdAt: new Date().toISOString(),
    }
    diaries.unshift(newDiary)
    return success(newDiary as T)
  }

  // Comments list
  if (url === '/comments' && method === 'GET') {
    const params = config.params || {}
    const { targetType, targetId } = params
    const filtered = comments.filter(
      (c) => c.targetType === targetType && c.targetId === Number(targetId),
    )
    return success(filtered as T)
  }

  // Comment create
  if (url === '/comments' && method === 'POST') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const newComment: Comment = {
      id: Date.now(),
      targetType: payload.targetType,
      targetId: payload.targetId,
      author: { id: 999, name: 'Mock User', avatar: 'https://i.pravatar.cc/80?img=9' },
      content: payload.content,
      createdAt: new Date().toISOString(),
    }
    comments.unshift(newComment)
    return success(newComment as T)
  }

  return success(null as T)
}
