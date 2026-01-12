import { useState, useCallback } from 'react'

// Custom hook for optimistic updates to prevent page refreshes
export function useOptimisticUpdate(initialData, updateFn) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  const updateData = useCallback(async (id, updatePayload, action = 'update') => {
    setLoading(true)
    
    // Optimistic update - update UI immediately
    if (action === 'delete') {
      setData(prev => prev.filter(item => item.id !== id))
    } else if (action === 'update') {
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updatePayload } : item
      ))
    } else if (action === 'add') {
      setData(prev => [...prev, updatePayload])
    }

    try {
      // Perform the actual API call
      await updateFn(id, updatePayload)
    } catch (error) {
      console.error('Update failed:', error)
      // Revert on error (you might want to show a toast notification)
      await load() // Reload original data
    } finally {
      setLoading(false)
    }
  }, [updateFn])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await updateFn()
      setData(result)
    } catch (error) {
      console.error('Load failed:', error)
    } finally {
      setLoading(false)
    }
  }, [updateFn])

  return { data, loading, updateData, load, setData }
}
