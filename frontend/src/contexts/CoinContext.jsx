import { createContext, useContext, useState, useCallback } from 'react'

/**
 * CoinContext - Share coin state between windows
 * Used to pass active coin to CoinProperties and MemeStudio
 */

const CoinContext = createContext(null)

export function CoinProvider({ children }) {
  // Currently selected coin for viewing properties
  const [activeCoin, setActiveCoin] = useState(null)

  // Coin context for meme editor (set when "Make a Meme" is clicked)
  const [coinContextForEditor, setCoinContextForEditor] = useState(null)

  // Callback to open coin in meme editor
  const openCoinInEditor = useCallback((coin) => {
    setCoinContextForEditor(coin)
  }, [])

  // Clear coin context from editor after use
  const clearCoinContext = useCallback(() => {
    setCoinContextForEditor(null)
  }, [])

  // View coin properties
  const viewCoinProperties = useCallback((coin) => {
    setActiveCoin(coin)
  }, [])

  // Close coin properties
  const closeCoinProperties = useCallback(() => {
    setActiveCoin(null)
  }, [])

  return (
    <CoinContext.Provider
      value={{
        activeCoin,
        setActiveCoin,
        viewCoinProperties,
        closeCoinProperties,
        coinContextForEditor,
        openCoinInEditor,
        clearCoinContext,
      }}
    >
      {children}
    </CoinContext.Provider>
  )
}

export function useCoinContext() {
  const context = useContext(CoinContext)
  if (!context) {
    throw new Error('useCoinContext must be used within a CoinProvider')
  }
  return context
}

export default CoinContext
