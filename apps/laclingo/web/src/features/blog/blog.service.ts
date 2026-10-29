import { API_URL, apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type {
  BlogCommentNode,
  BlogCommentRequest,
  BlogCommentToggleResponse,
  BlogImageResponse,
  BlogPostAdmin,
  BlogPostDetail,
  BlogPostRequest,
  BlogPostSummary,
  BlogToggleResponse,
  PageResult,
} from '@/types/api'

export const blogService = {
  list: (params: { languageId?: string; tag?: string; mine?: boolean; page?: number; pageSize?: number } = {}) =>
    apiFetch<PageResult<BlogPostSummary>>(
      `/blog/posts${buildQuery({
        language_id: params.languageId,
        tag: params.tag,
        mine: params.mine ? 'true' : undefined,
        page: params.page,
        page_size: params.pageSize,
      })}`,
    ),
  getDetail: (id: string) => apiFetch<BlogPostDetail>(`/blog/posts/${encodeURIComponent(id)}`),
  create: (body: BlogPostRequest) => apiFetch<BlogPostDetail>('/blog/posts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: BlogPostRequest) =>
    apiFetch<BlogPostDetail>(`/blog/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(`/blog/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Upload KHÔNG cần postId — ảnh được "nhận" vào bài khi lưu content (xem backend
  // adoptContentImages), nên có thể chèn ảnh ngay cả khi đang soạn bài MỚI. res.url
  // từ backend là path tương đối (giữ ổn định mãi, tự resolve sang R2 presigned URL
  // khi phục vụ) — ghép với API_URL để ra URL đầy đủ chèn vào content rich text.
  uploadImage: async (file: File): Promise<BlogImageResponse> => {
    const form = new FormData()
    form.append('image', file)
    const res = await apiFetch<BlogImageResponse>('/blog/images', { method: 'POST', body: form })
    return { ...res, url: `${API_URL}${res.url}` }
  },

  setStar: (postId: string, on: boolean) =>
    apiFetch<BlogToggleResponse>(`/blog/posts/${encodeURIComponent(postId)}/star`, { method: on ? 'PUT' : 'DELETE' }),
  setMarker: (postId: string, on: boolean) =>
    apiFetch<BlogToggleResponse>(`/blog/posts/${encodeURIComponent(postId)}/marker`, { method: on ? 'PUT' : 'DELETE' }),
  setLike: (postId: string, on: boolean) =>
    apiFetch<BlogToggleResponse>(`/blog/posts/${encodeURIComponent(postId)}/like`, { method: on ? 'PUT' : 'DELETE' }),
  setDislike: (postId: string, on: boolean) =>
    apiFetch<BlogToggleResponse>(`/blog/posts/${encodeURIComponent(postId)}/dislike`, { method: on ? 'PUT' : 'DELETE' }),

  listComments: (postId: string) => apiFetch<BlogCommentNode[]>(`/blog/posts/${encodeURIComponent(postId)}/comments`),
  createComment: (postId: string, body: BlogCommentRequest) =>
    apiFetch<BlogCommentNode>(`/blog/posts/${encodeURIComponent(postId)}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  updateComment: (commentId: string, content: string) =>
    apiFetch<void>(`/blog/comments/${encodeURIComponent(commentId)}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  deleteComment: (commentId: string) => apiFetch<void>(`/blog/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' }),

  setCommentLike: (commentId: string, on: boolean) =>
    apiFetch<BlogCommentToggleResponse>(`/blog/comments/${encodeURIComponent(commentId)}/like`, { method: on ? 'PUT' : 'DELETE' }),
  setCommentDislike: (commentId: string, on: boolean) =>
    apiFetch<BlogCommentToggleResponse>(`/blog/comments/${encodeURIComponent(commentId)}/dislike`, { method: on ? 'PUT' : 'DELETE' }),

  // Admin
  listAdmin: (params: { hiddenOnly?: boolean; page?: number; pageSize?: number } = {}) =>
    apiFetch<PageResult<BlogPostAdmin>>(
      `/admin/blog/posts${buildQuery({
        hidden_only: params.hiddenOnly ? 'true' : undefined,
        page: params.page,
        page_size: params.pageSize,
      })}`,
    ),
  hidePost: (id: string) => apiFetch<void>(`/admin/blog/posts/${encodeURIComponent(id)}/hide`, { method: 'PUT' }),
  unhidePost: (id: string) => apiFetch<void>(`/admin/blog/posts/${encodeURIComponent(id)}/unhide`, { method: 'PUT' }),
  adminDeletePost: (id: string) => apiFetch<void>(`/admin/blog/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  hideComment: (id: string) => apiFetch<void>(`/admin/blog/comments/${encodeURIComponent(id)}/hide`, { method: 'PUT' }),
  unhideComment: (id: string) => apiFetch<void>(`/admin/blog/comments/${encodeURIComponent(id)}/unhide`, { method: 'PUT' }),
  adminDeleteComment: (id: string) => apiFetch<void>(`/admin/blog/comments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
