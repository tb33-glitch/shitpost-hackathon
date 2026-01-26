import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'trashart_notifications'
const MAX_NOTIFICATIONS = 50

// Notification types
export const NOTIFICATION_TYPES = {
  BURN: 'burn',
  ACHIEVEMENT: 'achievement',
  SYSTEM: 'system',
  SOCIAL: 'social',
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Default state
const getDefaultState = () => ({
  notifications: [],
  unreadCount: 0,
})

export default function useNotifications() {
  const [state, setState] = useState(getDefaultState)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState({
          ...parsed,
          unreadCount: parsed.notifications.filter(n => !n.read).length,
        })
      }
    } catch (e) {
      console.error('Failed to load notifications:', e)
    }
  }, [])

  // Save to localStorage
  const saveState = useCallback((newState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to save notifications:', e)
    }
  }, [])

  // Add notification
  const addNotification = useCallback((notification) => {
    setState(prev => {
      const newNotification = {
        id: generateId(),
        timestamp: Date.now(),
        read: false,
        ...notification,
      }

      const newNotifications = [newNotification, ...prev.notifications].slice(0, MAX_NOTIFICATIONS)
      const newState = {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      }

      saveState(newState)
      return newState
    })
  }, [saveState])

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setState(prev => {
      const newNotifications = prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
      const newState = {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      }

      saveState(newState)
      return newState
    })
  }, [saveState])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setState(prev => {
      const newNotifications = prev.notifications.map(n => ({ ...n, read: true }))
      const newState = {
        notifications: newNotifications,
        unreadCount: 0,
      }

      saveState(newState)
      return newState
    })
  }, [saveState])

  // Delete notification
  const deleteNotification = useCallback((notificationId) => {
    setState(prev => {
      const newNotifications = prev.notifications.filter(n => n.id !== notificationId)
      const newState = {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      }

      saveState(newState)
      return newState
    })
  }, [saveState])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    const newState = getDefaultState()
    saveState(newState)
    setState(newState)
  }, [saveState])

  // Get notifications by type
  const getByType = useCallback((type) => {
    return state.notifications.filter(n => n.type === type)
  }, [state.notifications])

  // Helper functions to add specific notification types
  const notifyBurn = useCallback(({ title, tokenId, burnerAddress, imageUrl, wasteEarned }) => {
    addNotification({
      type: NOTIFICATION_TYPES.BURN,
      subject: 'YOUR ART HAS BEEN DESTROYED',
      body: `${burnerAddress?.slice(0, 6)}...${burnerAddress?.slice(-4)} burned your masterpiece "${title || `NFT #${tokenId}`}". The flames consumed it, but the $WASTE lives on.`,
      imageUrl,
      tokenId,
      burnerAddress,
      wasteEarned,
      icon: '🔥',
    })
  }, [addNotification])

  const notifyAchievement = useCallback(({ name, description, icon }) => {
    addNotification({
      type: NOTIFICATION_TYPES.ACHIEVEMENT,
      subject: `Achievement Unlocked: ${name}`,
      body: description,
      icon: icon || '🏆',
    })
  }, [addNotification])

  const notifySystem = useCallback(({ subject, body, icon = '📢' }) => {
    addNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      subject,
      body,
      icon,
    })
  }, [addNotification])

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getByType,
    notifyBurn,
    notifyAchievement,
    notifySystem,
    NOTIFICATION_TYPES,
  }
}
