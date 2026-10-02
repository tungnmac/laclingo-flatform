'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useSession } from '@/store/session'
import type {
  ChallengeLeaderboardEntry,
  WsAnswerResultPayload,
  WsChatMessagePayload,
  WsEnvelope,
  WsErrorPayload,
  WsGameFinishedPayload,
  WsGameStartedPayload,
  WsKickedPayload,
  WsParticipantReadyPayload,
  WsQuestionEndedPayload,
  WsQuestionPayload,
  WsReactionPayload,
} from '@/types/api'
import { buildChallengeWsUrl } from '../challenge.service'

export type GamePhase = 'lobby' | 'question' | 'reveal' | 'finished'

export interface ChatEntry {
  userId: string
  message: string
  sentAt: string
}

export interface ReactionEntry {
  id: string
  userId: string
  emoji: string
  at: number
}

const maxChatMessages = 50
const reactionLifetimeMs = 2500

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
  readyMap: Record<string, boolean>
  chatMessages: ChatEntry[]
  reactions: ReactionEntry[]
  kicked: { reason: string } | null
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
  readyMap: {},
  chatMessages: [],
  reactions: [],
  kicked: null,
}

type Action =
  | { type: 'ws_open' }
  | { type: 'ws_close' }
  | { type: 'tick' }
  | { type: 'submit_local'; selectedIndex: number }
  | { type: 'server_message'; envelope: WsEnvelope }
  | { type: 'prune_reactions' }

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
    case 'prune_reactions': {
      const cutoff = Date.now() - reactionLifetimeMs
      return { ...state, reactions: state.reactions.filter((r) => r.at >= cutoff) }
    }
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
    case 'participant_ready': {
      const data = envelope.data as WsParticipantReadyPayload
      return { ...state, readyMap: { ...state.readyMap, [data.user_id]: data.ready } }
    }
    case 'chat_message': {
      const data = envelope.data as WsChatMessagePayload
      const entry: ChatEntry = { userId: data.user_id, message: data.message, sentAt: data.sent_at }
      return { ...state, chatMessages: [...state.chatMessages, entry].slice(-maxChatMessages) }
    }
    case 'reaction': {
      const data = envelope.data as WsReactionPayload
      const entry: ReactionEntry = { id: `${Date.now()}-${Math.random()}`, userId: data.user_id, emoji: data.emoji, at: Date.now() }
      return { ...state, reactions: [...state.reactions, entry] }
    }
    case 'kicked':
      return { ...state, kicked: { reason: (envelope.data as WsKickedPayload).reason } }
    case 'error':
      return { ...state, wsError: (envelope.data as WsErrorPayload).message }
    default:
      // participant_joined/participant_left/participant_kicked không đổi
      // state ở đây — hook gọi onParticipantChange riêng để page tự reload
      // REST (WS chỉ có user_id, không có tên/avatar).
      return state
  }
}

const membershipChangeTypes = new Set(['participant_joined', 'participant_left', 'participant_kicked'])

/**
 * Quản lý 1 kết nối WebSocket cho phòng thử thách: nhận câu hỏi/kết quả/
 * leaderboard/chat/reaction/ready theo thời gian thực, gửi các action tương
 * ứng. Không tự reconnect khi mất kết nối — giới hạn đã biết từ Phase 1.
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
      if (membershipChangeTypes.has(envelope.type)) {
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

  useEffect(() => {
    if (state.reactions.length === 0) return
    const id = setInterval(() => dispatch({ type: 'prune_reactions' }), 500)
    return () => clearInterval(id)
  }, [state.reactions.length])

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

  const leaveRoom = useCallback(() => send({ type: 'leave_room' }), [send])
  const setReady = useCallback((ready: boolean) => send({ type: 'set_ready', ready }), [send])
  const kickParticipant = useCallback((userId: string) => send({ type: 'kick', user_id: userId }), [send])
  const sendChat = useCallback((message: string) => send({ type: 'send_chat', message }), [send])
  const sendReaction = useCallback((emoji: string) => send({ type: 'send_reaction', emoji }), [send])

  return { ...state, startGame, submitAnswer, leaveRoom, setReady, kickParticipant, sendChat, sendReaction }
}
