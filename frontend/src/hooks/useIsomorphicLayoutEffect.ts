import { useEffect, useLayoutEffect } from 'react'

// SSR対応のuseLayoutEffect
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect