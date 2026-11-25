import { useCallback, useState } from 'react'

type Callbacks<R> = { onSuccess?: (result: R) => void; onError?: (error: unknown) => void }
type State = { status: 'idle' | 'pending' | 'error' | 'success'; error: unknown }

/**
 * État d'une action asynchrone hors données du BFF (connexion chez identity) : en cours, échec, remise à zéro. Les
 * lectures et commandes du BFF passent par `@joutio/client`, jamais par ce hook.
 */
export function useAction<V, R = void>(run: (value: V) => Promise<R>) {
  const [state, setState] = useState<State>({ status: 'idle', error: null })
  const mutate = useCallback(
    (value: V, callbacks: Callbacks<R> = {}) => {
      setState({ status: 'pending', error: null })
      run(value).then(
        (result) => {
          setState({ status: 'success', error: null })
          callbacks.onSuccess?.(result)
        },
        (error: unknown) => {
          setState({ status: 'error', error })
          callbacks.onError?.(error)
        },
      )
    },
    [run],
  )
  const reset = useCallback(() => setState({ status: 'idle', error: null }), [])
  return { mutate, reset, isPending: state.status === 'pending', isError: state.status === 'error', error: state.error }
}
