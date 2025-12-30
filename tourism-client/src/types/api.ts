export type Result<T> = {
  code: number
  message: string
  data: T
}

export type Spot = {
  id: number
  name: string
  city: string
  cover: string
  description: string
}

export type Diary = {
  id: number
  title: string
  content: string
  cover?: string
  spotId?: number
  author: {
    id: number
    name: string
    avatar: string
  }
  stats: {
    likes: number
    comments: number
  }
  createdAt: string
}

export type Comment = {
  id: number
  targetType: 'spot' | 'diary'
  targetId: number
  author: {
    id: number
    name: string
    avatar: string
  }
  content: string
  createdAt: string
}
