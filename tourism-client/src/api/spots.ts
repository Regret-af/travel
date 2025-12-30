import { request } from './client'
import type { Result, Spot } from '../types/api'

export function fetchSpots() {
  return request<Spot[]>({
    url: '/spots',
    method: 'GET',
  })
}

export function fetchSpotDetail(id: number) {
  return request<Spot>({
    url: `/spots/${id}`,
    method: 'GET',
  })
}
