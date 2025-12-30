import type { Comment, Diary, Spot } from '../../types/api'

export const spots: Spot[] = [
  {
    id: 1,
    name: '外滩',
    city: '上海',
    cover: 'https://picsum.photos/id/1018/400/240',
    description: '黄浦江畔的城市地标，夜景尤佳。',
  },
  {
    id: 2,
    name: '西湖',
    city: '杭州',
    cover: 'https://picsum.photos/id/1025/400/240',
    description: '湖光山色，四季皆景，适合慢行漫步。',
  },
]

export const diaries: Diary[] = [
  {
    id: 11,
    title: '周末打卡外滩夜景',
    content: '和朋友一起走过外滩，看了江景与灯光秀。',
    cover: 'https://picsum.photos/id/1036/400/240',
    spotId: 1,
    author: {
      id: 201,
      name: '旅人A',
      avatar: 'https://i.pravatar.cc/80?img=1',
    },
    stats: { likes: 18, comments: 4 },
    createdAt: '2025-01-06T08:00:00Z',
  },
  {
    id: 12,
    title: '西湖边的清晨',
    content: '早起在苏堤散步，薄雾与晨光很治愈。',
    cover: 'https://picsum.photos/id/1043/400/240',
    spotId: 2,
    author: {
      id: 202,
      name: '旅人B',
      avatar: 'https://i.pravatar.cc/80?img=2',
    },
    stats: { likes: 32, comments: 6 },
    createdAt: '2025-01-05T14:00:00Z',
  },
]

export const comments: Comment[] = [
  {
    id: 301,
    targetType: 'spot',
    targetId: 1,
    author: { id: 401, name: '小明', avatar: 'https://i.pravatar.cc/80?img=3' },
    content: '夜景确实漂亮，推荐坐游船看江景！',
    createdAt: '2025-01-06T10:00:00Z',
  },
  {
    id: 302,
    targetType: 'diary',
    targetId: 11,
    author: { id: 402, name: '小红', avatar: 'https://i.pravatar.cc/80?img=4' },
    content: '照片很好看，想去打卡！',
    createdAt: '2025-01-06T12:00:00Z',
  },
]
