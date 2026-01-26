import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LeftToolbar from './LeftToolbar'

// Mock the child components
vi.mock('../Editor', () => ({
  MemeTemplatePicker: ({ onSelectTemplate, onClose }) => (
    <div data-testid="template-picker">
      <button onClick={() => onSelectTemplate({ id: 'test', image: 'test.png' })}>
        Select Template
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

vi.mock('../Canvas/StickerPicker', () => ({
  default: ({ onSelectSticker, onClose }) => (
    <div data-testid="sticker-picker">
      <button onClick={() => onSelectSticker({ id: 'star', name: 'Star' })}>
        Select Sticker
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

// Helper to find button by data-tooltip
const getButtonByTooltip = (tooltip) => {
  return document.querySelector(`[data-tooltip="${tooltip}"]`)
}

describe('LeftToolbar', () => {
  const mockAddImage = vi.fn()
  const mockAddText = vi.fn()
  const mockAddSticker = vi.fn()
  const mockToggleDrawingMode = vi.fn()
  const mockDrawingColorChange = vi.fn()
  const mockBackgroundColorChange = vi.fn()
  const mockDeleteSelected = vi.fn()

  const defaultProps = {
    onAddImage: mockAddImage,
    onAddText: mockAddText,
    onAddSticker: mockAddSticker,
    isDrawingMode: false,
    onToggleDrawingMode: mockToggleDrawingMode,
    drawingColor: '#000000',
    onDrawingColorChange: mockDrawingColorChange,
    backgroundColor: '#FFFFFF',
    onBackgroundColorChange: mockBackgroundColorChange,
    selectedId: null,
    onDeleteSelected: mockDeleteSelected,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('layout', () => {
    it('should render Add section', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    it('should render Tools section', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(screen.getByText('Tools')).toBeInTheDocument()
    })

    it('should render Canvas section', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(screen.getByText('Canvas')).toBeInTheDocument()
    })
  })

  describe('Template button', () => {
    it('should render Template button', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(getButtonByTooltip('Template')).toBeInTheDocument()
    })

    it('should show template picker when clicked', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Template'))

      expect(screen.getByTestId('template-picker')).toBeInTheDocument()
    })

    it('should call onAddImage when template is selected', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Template'))
      fireEvent.click(screen.getByText('Select Template'))

      expect(mockAddImage).toHaveBeenCalledWith({ id: 'test', image: 'test.png' })
    })

    it('should close template picker when template is selected', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Template'))
      expect(screen.getByTestId('template-picker')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Select Template'))
      expect(screen.queryByTestId('template-picker')).not.toBeInTheDocument()
    })
  })

  describe('Add Text button', () => {
    it('should render Text button', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(getButtonByTooltip('Text')).toBeInTheDocument()
    })

    it('should call onAddText when clicked', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Text'))

      expect(mockAddText).toHaveBeenCalled()
    })
  })

  describe('Add Sticker button', () => {
    it('should render Sticker button', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(getButtonByTooltip('Sticker')).toBeInTheDocument()
    })

    it('should show sticker picker when clicked', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Sticker'))

      expect(screen.getByTestId('sticker-picker')).toBeInTheDocument()
    })

    it('should call onAddSticker when sticker is selected', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Sticker'))
      fireEvent.click(screen.getByText('Select Sticker'))

      expect(mockAddSticker).toHaveBeenCalledWith({ id: 'star', name: 'Star' })
    })
  })

  describe('Draw button', () => {
    it('should render Draw button', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(getButtonByTooltip('Draw')).toBeInTheDocument()
    })

    it('should call onToggleDrawingMode when clicked', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Draw'))

      expect(mockToggleDrawingMode).toHaveBeenCalled()
    })

    it('should show active state when drawing mode is on', () => {
      render(<LeftToolbar {...defaultProps} isDrawingMode={true} />)

      const drawButton = getButtonByTooltip('Draw')
      expect(drawButton).toHaveClass('active')
    })

    it('should show color indicator when drawing mode is on', () => {
      render(<LeftToolbar {...defaultProps} isDrawingMode={true} />)

      // Color indicator should be visible
      const colorIndicator = document.querySelector('.color-indicator')
      expect(colorIndicator).toBeInTheDocument()
    })
  })

  describe('Background button', () => {
    it('should render Background button', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(getButtonByTooltip('Background')).toBeInTheDocument()
    })

    it('should show color picker when clicked', () => {
      render(<LeftToolbar {...defaultProps} />)

      fireEvent.click(getButtonByTooltip('Background'))

      expect(screen.getByText('Background Color')).toBeInTheDocument()
    })
  })

  describe('Delete button', () => {
    it('should render Delete button', () => {
      render(<LeftToolbar {...defaultProps} />)

      expect(getButtonByTooltip('Delete')).toBeInTheDocument()
    })

    it('should be disabled when nothing is selected', () => {
      render(<LeftToolbar {...defaultProps} selectedId={null} />)

      const deleteButton = getButtonByTooltip('Delete')
      expect(deleteButton).toBeDisabled()
    })

    it('should be enabled when something is selected', () => {
      render(<LeftToolbar {...defaultProps} selectedId="some-id" />)

      const deleteButton = getButtonByTooltip('Delete')
      expect(deleteButton).not.toBeDisabled()
    })

    it('should call onDeleteSelected when clicked', () => {
      render(<LeftToolbar {...defaultProps} selectedId="some-id" />)

      fireEvent.click(getButtonByTooltip('Delete'))

      expect(mockDeleteSelected).toHaveBeenCalled()
    })
  })

  describe('picker exclusivity', () => {
    it('should close template picker when sticker button is clicked', () => {
      render(<LeftToolbar {...defaultProps} />)

      // Open template picker
      fireEvent.click(getButtonByTooltip('Template'))
      expect(screen.getByTestId('template-picker')).toBeInTheDocument()

      // Click sticker button
      fireEvent.click(getButtonByTooltip('Sticker'))

      // Template picker should be closed
      expect(screen.queryByTestId('template-picker')).not.toBeInTheDocument()
      // Sticker picker should be open
      expect(screen.getByTestId('sticker-picker')).toBeInTheDocument()
    })

    it('should close sticker picker when template button is clicked', () => {
      render(<LeftToolbar {...defaultProps} />)

      // Open sticker picker
      fireEvent.click(getButtonByTooltip('Sticker'))
      expect(screen.getByTestId('sticker-picker')).toBeInTheDocument()

      // Click template button
      fireEvent.click(getButtonByTooltip('Template'))

      // Sticker picker should be closed
      expect(screen.queryByTestId('sticker-picker')).not.toBeInTheDocument()
      // Template picker should be open
      expect(screen.getByTestId('template-picker')).toBeInTheDocument()
    })
  })
})
