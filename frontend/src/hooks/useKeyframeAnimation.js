/**
 * Keyframe Animation System
 *
 * Provides interpolation between keyframes for object properties.
 * Supports position (x, y), scale, rotation, and opacity animations.
 */

// Easing functions
export const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
}

// Properties that can be animated
export const ANIMATABLE_PROPERTIES = ['x', 'y', 'scale', 'rotation', 'opacity']

/**
 * Interpolate between two values using an easing function
 */
function interpolate(from, to, progress, easing = 'linear') {
  const easingFn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.linear
  const easedProgress = easingFn(progress)
  return from + (to - from) * easedProgress
}

/**
 * Get the interpolated value of a property at a given time
 *
 * @param {Array} keyframes - Array of keyframe objects { time, x, y, scale, rotation, opacity, easing }
 * @param {number} currentTime - Current time in seconds
 * @param {string} property - Property name to interpolate
 * @param {number} defaultValue - Default value if no keyframes
 * @returns {number} Interpolated value
 */
export function getInterpolatedValue(keyframes, currentTime, property, defaultValue) {
  if (!keyframes || keyframes.length === 0) {
    return defaultValue
  }

  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)

  // If before first keyframe, use first keyframe value
  if (currentTime <= sorted[0].time) {
    return sorted[0][property] ?? defaultValue
  }

  // If after last keyframe, use last keyframe value
  if (currentTime >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1][property] ?? defaultValue
  }

  // Find surrounding keyframes
  let prevKeyframe = sorted[0]
  let nextKeyframe = sorted[sorted.length - 1]

  for (let i = 0; i < sorted.length - 1; i++) {
    if (currentTime >= sorted[i].time && currentTime < sorted[i + 1].time) {
      prevKeyframe = sorted[i]
      nextKeyframe = sorted[i + 1]
      break
    }
  }

  // Calculate progress between keyframes
  const duration = nextKeyframe.time - prevKeyframe.time
  const elapsed = currentTime - prevKeyframe.time
  const progress = duration > 0 ? elapsed / duration : 0

  // Get values (use default if not specified in keyframe)
  const fromValue = prevKeyframe[property] ?? defaultValue
  const toValue = nextKeyframe[property] ?? defaultValue

  // Interpolate with easing (use next keyframe's easing for transition TO it)
  const easing = nextKeyframe.easing || 'linear'
  return interpolate(fromValue, toValue, progress, easing)
}

/**
 * Get all interpolated properties for an object at a given time
 *
 * @param {Object} obj - Canvas object with keyframes array
 * @param {number} currentTime - Current time in seconds
 * @returns {Object} Object with interpolated x, y, scale, rotation, opacity
 */
export function getInterpolatedProperties(obj, currentTime) {
  if (!obj.keyframes || obj.keyframes.length === 0) {
    // No animation, return current static values
    return {
      x: obj.x,
      y: obj.y,
      scale: obj.scale ?? 1,
      rotation: obj.rotation ?? 0,
      opacity: obj.opacity ?? 1,
    }
  }

  return {
    x: getInterpolatedValue(obj.keyframes, currentTime, 'x', obj.x),
    y: getInterpolatedValue(obj.keyframes, currentTime, 'y', obj.y),
    scale: getInterpolatedValue(obj.keyframes, currentTime, 'scale', obj.scale ?? 1),
    rotation: getInterpolatedValue(obj.keyframes, currentTime, 'rotation', obj.rotation ?? 0),
    opacity: getInterpolatedValue(obj.keyframes, currentTime, 'opacity', obj.opacity ?? 1),
  }
}

/**
 * Create a keyframe from the current object state
 *
 * @param {Object} obj - Canvas object
 * @param {number} time - Time for the keyframe
 * @param {string} easing - Easing function name
 * @returns {Object} Keyframe object
 */
export function createKeyframe(obj, time, easing = 'linear') {
  return {
    id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    time,
    x: obj.x,
    y: obj.y,
    scale: obj.scale ?? 1,
    rotation: obj.rotation ?? 0,
    opacity: obj.opacity ?? 1,
    easing,
  }
}

/**
 * Add a keyframe to an object's keyframes array
 * If a keyframe at the same time exists, it will be replaced
 *
 * @param {Array} keyframes - Existing keyframes array (or undefined)
 * @param {Object} newKeyframe - New keyframe to add
 * @returns {Array} Updated keyframes array
 */
export function addKeyframe(keyframes, newKeyframe) {
  const existing = keyframes || []

  // Remove any keyframe at the same time (within 0.05s tolerance)
  const filtered = existing.filter(kf => Math.abs(kf.time - newKeyframe.time) > 0.05)

  // Add new keyframe and sort by time
  return [...filtered, newKeyframe].sort((a, b) => a.time - b.time)
}

/**
 * Remove a keyframe by ID
 *
 * @param {Array} keyframes - Existing keyframes array
 * @param {string} keyframeId - ID of keyframe to remove
 * @returns {Array} Updated keyframes array
 */
export function removeKeyframe(keyframes, keyframeId) {
  if (!keyframes) return []
  return keyframes.filter(kf => kf.id !== keyframeId)
}

/**
 * Update a keyframe's properties
 *
 * @param {Array} keyframes - Existing keyframes array
 * @param {string} keyframeId - ID of keyframe to update
 * @param {Object} updates - Properties to update
 * @returns {Array} Updated keyframes array
 */
export function updateKeyframe(keyframes, keyframeId, updates) {
  if (!keyframes) return []
  return keyframes.map(kf =>
    kf.id === keyframeId ? { ...kf, ...updates } : kf
  ).sort((a, b) => a.time - b.time)
}

/**
 * Get keyframe at or near a specific time
 *
 * @param {Array} keyframes - Keyframes array
 * @param {number} time - Time to search for
 * @param {number} tolerance - Time tolerance in seconds (default 0.1)
 * @returns {Object|null} Keyframe if found, null otherwise
 */
export function getKeyframeAtTime(keyframes, time, tolerance = 0.1) {
  if (!keyframes || keyframes.length === 0) return null

  return keyframes.find(kf => Math.abs(kf.time - time) <= tolerance) || null
}

/**
 * Check if an object has animation (keyframes)
 *
 * @param {Object} obj - Canvas object
 * @returns {boolean} True if object has keyframes
 */
export function hasAnimation(obj) {
  return obj.keyframes && obj.keyframes.length > 0
}

/**
 * Get the motion path points for visualization
 * Returns an array of {x, y, time} points for each keyframe
 *
 * @param {Object} obj - Canvas object with keyframes
 * @returns {Array} Array of motion path points
 */
export function getMotionPathPoints(obj) {
  if (!obj.keyframes || obj.keyframes.length === 0) {
    return []
  }

  return obj.keyframes
    .sort((a, b) => a.time - b.time)
    .map(kf => ({
      x: kf.x,
      y: kf.y,
      time: kf.time,
      id: kf.id,
    }))
}

export default {
  EASING_FUNCTIONS,
  ANIMATABLE_PROPERTIES,
  getInterpolatedValue,
  getInterpolatedProperties,
  createKeyframe,
  addKeyframe,
  removeKeyframe,
  updateKeyframe,
  getKeyframeAtTime,
  hasAnimation,
  getMotionPathPoints,
}
