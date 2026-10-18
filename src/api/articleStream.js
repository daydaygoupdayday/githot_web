import { createAsyncThunk } from '@reduxjs/toolkit'
import { ssePost } from './client'
import { start, gotMeta, appendText, done, fail } from '../store/articleSlice'

const ctrlRef = { current: null }

export const generateArticleStream = createAsyncThunk(
  'article/generateStream',
  async (params, { dispatch }) => {
    dispatch(start())
    const ctrl = new AbortController()
    ctrlRef.current = ctrl

    // 过滤空值：language/min_stars/word_count 留空则不传，用后端默认
    const body = {
      board: params.board,
      days_age: params.days_age,
      rank: params.rank,
      style: params.style,
    }
    if (params.language) body.language = params.language
    if (params.min_stars !== null && params.min_stars !== '') body.min_stars = Number(params.min_stars)
    if (params.word_count) body.word_count = Number(params.word_count)

    try {
      await ssePost('/api/article/stream', body, (event, data) => {
        if (event === 'meta') dispatch(gotMeta(data))
        else if (event === 'token') dispatch(appendText({ text: data.text }))
        else if (event === 'done') dispatch(done())
        else if (event === 'error') dispatch(fail(data.detail))
      }, ctrl.signal)
    } catch (e) {
      if (e.name === 'AbortError') dispatch(fail('已停止生成'))
      else dispatch(fail(e.message))
    } finally {
      ctrlRef.current = null
    }
  },
)

export function stopArticle() {
  ctrlRef.current?.abort()
}
