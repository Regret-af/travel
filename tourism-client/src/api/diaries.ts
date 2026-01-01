import { request } from './client'
import type { Diary } from '../types/api'

export function fetchDiaries() {
  return request<Diary[]>({
    url: '/diaries',
    method: 'GET',
  })
}

export function fetchDiaryDetail(id: number) {
  return request<Diary>({
    url: `/diaries/${id}`,
    method: 'GET',
  })
}

export function createDiary(payload: {
  title: string
  content: string
  cover?: string
  spotId?: number
}) {
  return request<Diary>({
    url: '/diaries',
    method: 'POST',
    data: payload,
  })
}
