import { createContext, useContext, useEffect, type DependencyList, type ReactNode } from 'react'

type TopbarActionsContextValue = {
  setActions: (actions: ReactNode) => void
}

export const TopbarActionsContext = createContext<TopbarActionsContextValue>({
  setActions: () => {},
})

export function useTopbarActions(actions: ReactNode, deps: DependencyList = []) {
  const { setActions } = useContext(TopbarActionsContext)
  useEffect(() => {
    setActions(actions)
    return () => {
      setActions(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
