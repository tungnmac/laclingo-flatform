'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useSession } from '@/store/session'
import type {
  ChallengeLeaderboardEntry,
  WsAnswerResultPayload,
  WsEnvelope,
  WsErrorPayload,
  WsGameFinishedPayload,
  WsGameStartedPayload,
  WsQuestionEndedPayload,
  WsQuestionPayload,
} from '@/types/api'
import { buildChallengeWsUrl } from '../challenge.service'

export type GamePhase = 'lobby' | 'question' | 'reveal' | 'finished'

interface State {
  connected: boolean
  phase: GamePhase
  totalQuestions: number
  timePerQuestionSeconds: number
  question: WsQuestionPayload | null
  timeLeft: number
  myAnswer: number | null
  answerResult: WsAnswerResultPayload | null
  reveal: WsQuestionEndedPayload | null
  leaderboard: ChallengeLeaderboardEntry[]
  wsError: string | null
}

const initialState: State = {
  connected: false,
  phase: 'lobby',
  totalQuestions: 0,
  timePerQuestionSeconds: 0,
  question: null,
  timeLeft: 0,
  myAnswer: null,
  answerResult: null,
  reveal: null,
  leaderboard: [],
  wsError: null,
}

type Action =
  | { type: 'ws_open' }
  | { type: 'ws_close' }
  | { type: 'tick' }
  | { type: 'submit_local'; selectedIndex: number }
  | { type: 'server_message'; envelope: WsEnvelope }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ws_open':
      return { ...state, connected: true, wsError: null }
    case 'ws_close':
      return { ...state, connected: false }
    case 'tick':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) }
    case 'submit_local':
      return { ...state, myAnswer: action.selectedIndex }
    case 'server_message':
      return applyServerMessage(state, action.envelope)
    default:
      return state
  }
}

function applyServerMessage(state: State, envelope: WsEnvelope): State {
  switch (envelope.type) {
    case 'game_started': {
      const data = envelope.data as WsGameStartedPayload
      return { ...state, phase: 'question', totalQuestions: data.total_questions, timePerQuestionSeconds: data.time_per_question_seconds }
    }
    case 'question': {
      const data = envelope.data as WsQuestionPayload
      return { ...state, phase: 'question', question: data, timeLeft: data.time_limit_seconds, myAnswer: null, answerResult: null, reveal: null }
    }
    case 'answer_result':
      return { ...state, answerResult: envelope.data as WsAnswerResultPayload }
    case 'question_ended': {
      const data = envelope.data as WsQuestionEndedPayload
      return { ...state, phase: 'reveal', reveal: data, leaderboard: data.leaderboard }
    }
    case 'game_finished': {
      const data = envelope.data as WsGameFinishedPayload
      return { ...state, phase: 'finished', leaderboard: data.leaderboard }
    }
    case 'error':
      return { ...state, wsError: (envelope.data as WsErrorPayload).message }
    default:
      // participant_joined/participant_left không đổi state ở đây — hook gọi
      // onParticipantChange riêng để page tự reload REST (WS chỉ có user_id,
      // không có tên/avatar).
      return state
  }
}

/**
 * Quản lý 1 kết nối WebSocket cho phòng thử thách: nhận câu hỏi/kết quả/
 * leaderboard theo thời gian thực, gửi start_game/submit_answer. Không tự
 * reconnect khi mất kết nối — giới hạn đã biết, khớp với backend (Phase 1).
 */
export function useChallengeSocket(roomId: string, onParticipantChange?: () => void) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const wsRef = useRef<WebSocket | null>(null)
  const onParticipantChangeRef = useRef(onParticipantChange)
  onParticipantChangeRef.current = onParticipantChange

  useEffect(() => {
    const token = useSession.getState().token
    if (!token) return

    const ws = new WebSocket(buildChallengeWsUrl(roomId, token))
    wsRef.current = ws

    ws.onopen = () => dispatch({ type: 'ws_open' })
    ws.onclose = () => dispatch({ type: 'ws_close' })
    ws.onmessage = (ev) => {
      let envelope: WsEnvelope
      try {
        envelope = JSON.parse(ev.data as string) as WsEnvelope
      } catch {
        return // frame hỏng — bỏ qua
      }
      if (envelope.type === 'participant_joined' || envelope.type === 'participant_left') {
        onParticipantChangeRef.current?.()
        return
      }
      dispatch({ type: 'server_message', envelope })
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [roomId])

  useEffect(() => {
    if (state.phase !== 'question' || state.timeLeft <= 0) return
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(id)
  }, [state.phase, state.question, state.timeLeft])

  const send = useCallback((msg: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const startGame = useCallback(() => send({ type: 'start_game' }), [send])

  const submitAnswer = useCallback(
    (selectedIndex: number) => {
      if (!state.question || state.myAnswer !== null) return
      dispatch({ type: 'submit_local', selectedIndex })
      send({ type: 'submit_answer', question_index: state.question.index, selected_index: selectedIndex })
    },
    [send, state.question, state.myAnswer],
  )

  return { ...state, startGame, submitAnswer }
}
