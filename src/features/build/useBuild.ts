import { useEffect, useReducer } from "react"
import {
  defaultSelection,
  defaultAppearance,
  validateSelection,
  validateAppearance,
  type Selection,
  type Category,
  type Appearance,
} from "../../entities/catalog"
type State = {
  selection: Selection
  appearance: Appearance
}
type Action = {
  type: "part"
  category: Category
  id: string
} | {
  type: "appearance"
  value: Partial<Appearance>
} | {
  type: "load"
  value: State
}
function initialState(): State {
  try {
    const shared = new URLSearchParams(window.location.search).get("build")
    const data = shared
      ? JSON.parse(atob(shared))
      : JSON.parse(localStorage.getItem("odyssey-build-v1") ?? "null")
    if (data)
      return {
        selection: validateSelection(data.selection),
        appearance: validateAppearance(data.appearance),
      }
  } catch {
    /* Invalid or unavailable storage must not block the builder. */
  }
  return {
    selection: { ...defaultSelection },
    appearance: { ...defaultAppearance },
  }
}
function reducer(state: State, action: Action): State {
  if (action.type === "part")
    return {
      ...state,
      selection: { ...state.selection, [action.category]: action.id },
    }
  if (action.type === "appearance")
    return { ...state, appearance: { ...state.appearance, ...action.value } }
  return action.value
}
export default function useBuild() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  useEffect(() => {
    try {
      localStorage.setItem("odyssey-build-v1", JSON.stringify(state))
    } catch {
      /* Private mode / storage quota. */
    }
  }, [state])
  return { ...state, dispatch }
}
