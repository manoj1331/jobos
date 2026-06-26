"use client"

import * as React from "react"

type ToastVariant = "default" | "destructive" | "success"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

type Action =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string }

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case "ADD":
      return { toasts: [action.toast, ...state.toasts].slice(0, 5) }
    case "REMOVE":
      return { toasts: state.toasts.filter(t => t.id !== action.id) }
    default:
      return state
  }
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach(l => l(memoryState))
}

function toast({ title, description, variant = "default", duration = 4000 }: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2)
  dispatch({ type: "ADD", toast: { id, title, description, variant, duration } })
  setTimeout(() => dispatch({ type: "REMOVE", id }), duration)
  return id
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return { toasts: state.toasts, toast }
}

export { useToast, toast }
