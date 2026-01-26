import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PropertiesPanel from './PropertiesPanel'

describe('PropertiesPanel', () => {
  const mockUpdateObject = vi.fn()
  const mockDeleteObject = vi.fn()
  const mockBringForward = vi.fn()
  const mockSendBackward = vi.fn()
  const mockClearDrawing = vi.fn()

  const defaultProps = {
    selectedObject: null,
    onUpdateObject: mockUpdateObject,
    onDeleteObject: mockDeleteObject,
    onBringForward: mockBringForward,
    onSendBackward: mockSendBackward,
    onClearDrawing: mockClearDrawing,
    isDrawingMode: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('should show hint when nothing is selected', () => {
      render(<PropertiesPanel {...defaultProps} />)

      expect(screen.getByText(/select an object/i)).toBeInTheDocument()
    })

    it('should show Properties header', () => {
      render(<PropertiesPanel {...defaultProps} />)

      expect(screen.getByText('Properties')).toBeInTheDocument()
    })
  })

  describe('drawing mode', () => {
    it('should show drawing mode UI when in drawing mode', () => {
      render(<PropertiesPanel {...defaultProps} isDrawingMode={true} />)

      expect(screen.getByText('Drawing Mode')).toBeInTheDocument()
      expect(screen.getByText(/clear drawing/i)).toBeInTheDocument()
    })

    it('should call onClearDrawing when clear button is clicked', () => {
      render(<PropertiesPanel {...defaultProps} isDrawingMode={true} />)

      fireEvent.click(screen.getByText(/clear drawing/i))

      expect(mockClearDrawing).toHaveBeenCalled()
    })
  })

  describe('text object selected', () => {
    const textObject = {
      id: 'text-1',
      type: 'text',
      text: 'Hello World',
      fontSize: 48,
      color: '#FFFFFF',
      strokeColor: '#000000',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
    }

    it('should show text properties header', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      expect(screen.getByText('Text Properties')).toBeInTheDocument()
    })

    it('should show text input with current text', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      const textarea = screen.getByPlaceholderText(/enter text/i)
      expect(textarea).toHaveValue('Hello World')
    })

    it('should call onUpdateObject when text is changed', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      const textarea = screen.getByPlaceholderText(/enter text/i)
      fireEvent.change(textarea, { target: { value: 'New text' } })

      expect(mockUpdateObject).toHaveBeenCalledWith('text-1', { text: 'New text' })
    })

    it('should show font size buttons', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      expect(screen.getByText('24')).toBeInTheDocument()
      expect(screen.getByText('48')).toBeInTheDocument()
      expect(screen.getByText('96')).toBeInTheDocument()
    })

    it('should call onUpdateObject when font size is clicked', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      fireEvent.click(screen.getByText('64'))

      expect(mockUpdateObject).toHaveBeenCalledWith('text-1', { fontSize: 64 })
    })

    it('should show z-order buttons', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      expect(screen.getByText(/forward/i)).toBeInTheDocument()
      expect(screen.getByText(/back/i)).toBeInTheDocument()
    })

    it('should call onBringForward when forward button is clicked', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      fireEvent.click(screen.getByText(/forward/i))

      expect(mockBringForward).toHaveBeenCalled()
    })

    it('should call onSendBackward when back button is clicked', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      fireEvent.click(screen.getByText(/back/i))

      expect(mockSendBackward).toHaveBeenCalled()
    })

    it('should show delete button', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      expect(screen.getByText(/delete text/i)).toBeInTheDocument()
    })

    it('should call onDeleteObject when delete button is clicked', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={textObject} />)

      fireEvent.click(screen.getByText(/delete text/i))

      expect(mockDeleteObject).toHaveBeenCalled()
    })
  })

  describe('image object selected', () => {
    const imageObject = {
      id: 'image-1',
      type: 'image',
      src: 'test-image.png',
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      rotation: 45,
    }

    it('should show image properties header', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={imageObject} />)

      expect(screen.getByText('Image Properties')).toBeInTheDocument()
    })

    it('should show size information', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={imageObject} />)

      expect(screen.getByText(/W: 300/)).toBeInTheDocument()
      expect(screen.getByText(/H: 200/)).toBeInTheDocument()
    })

    it('should show rotation information', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={imageObject} />)

      expect(screen.getByText(/45°/)).toBeInTheDocument()
    })

    it('should call onUpdateObject when reset rotation is clicked', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={imageObject} />)

      fireEvent.click(screen.getByText('Reset'))

      expect(mockUpdateObject).toHaveBeenCalledWith('image-1', { rotation: 0 })
    })

    it('should show delete image button', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={imageObject} />)

      expect(screen.getByText(/delete image/i)).toBeInTheDocument()
    })
  })

  describe('sticker object selected', () => {
    const stickerObject = {
      id: 'sticker-1',
      type: 'sticker',
      sticker: { id: 'star', name: 'Star', data: [] },
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
    }

    it('should show sticker properties header', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={stickerObject} />)

      expect(screen.getByText('Sticker Properties')).toBeInTheDocument()
    })

    it('should show delete sticker button', () => {
      render(<PropertiesPanel {...defaultProps} selectedObject={stickerObject} />)

      expect(screen.getByText(/delete sticker/i)).toBeInTheDocument()
    })
  })
})
