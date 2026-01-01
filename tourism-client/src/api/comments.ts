import { request } from './client'
import type { Comment } from '../types/api'

export function fetchComments(targetType: 'spot' | 'diary', targetId: number) {
  return request<Comment[]>({
    url: '/comments',
    method: 'GET',
    params: { targetType, targetId },
  })
}

export function createComment(payload: {
  targetType: 'spot' | 'diary'
  targetId: number
  content: string
}) {
  return request<Comment>({
    url: '/comments',
    method: 'POST',
    data: payload,
  })
}
