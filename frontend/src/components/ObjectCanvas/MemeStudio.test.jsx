import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemeStudio from './MemeStudio'

// Mock the child components
vi.mock('./ObjectCanvas', () => ({
  default: (props) => (
    <div data-testid="object-canvas" data-selected-id={props.selectedId}>
      ObjectCanvas
    </div>
  ),
}))

vi.mock('./LeftToolbar', () => ({
  default: (props) => (
    <div data-testid="left-toolbar">
      <button onClick={() => props.onAddText('Test')}>Add Text</button>
      <button onClick={() => props.onAddImage({ id: 't1', image: 'test.png' })}>
        Add Image
      </button>
      <button onClick={props.onToggleDrawingMode}>Toggle Draw</button>
    </div>
  ),
}))

vi.mock('./PropertiesPanel', () => ({
  default: (props) => (
    <div data-testid="properties-panel">
      {props.selectedObject && (
        <div data-testid="selected-info">{props.selectedObject.type}</div>
      )}
      {props.isDrawingMode && <div data-testid="drawing-mode">Drawing</div>}
    </div>
  ),
}))

vi.mock('../Editor/SubmitTemplateModal', () => ({
  default: () => null,
}))

vi.mock('./VideoExportModal', () => ({
  default: () => null,
}))

describe('MemeStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('layout', () => {
    it('should render the top bar', () => {
      render(<MemeStudio />)

      expect(screen.getByText(/undo/i)).toBeInTheDocument()
      expect(screen.getByText(/redo/i)).toBeInTheDocument()
      expect(screen.getByText(/export/i)).toBeInTheDocument()
    })

    it('should render the left toolbar', () => {
      render(<MemeStudio />)

      expect(screen.getByTestId('left-toolbar')).toBeInTheDocument()
    })

    it('should render the object canvas', () => {
      render(<MemeStudio />)

      expect(screen.getByTestId('object-canvas')).toBeInTheDocument()
    })

    it('should render the properties panel', () => {
      render(<MemeStudio />)

      expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
    })
  })

  describe('top bar buttons', () => {
    it('should have disabled undo button initially', () => {
      render(<MemeStudio />)

      const undoButton = screen.getByText(/undo/i)
      expect(undoButton).toBeDisabled()
    })

    it('should have disabled redo button initially', () => {
      render(<MemeStudio />)

      const redoButton = screen.getByText(/redo/i)
      expect(redoButton).toBeDisabled()
    })

    it('should have enabled export button', () => {
      render(<MemeStudio />)

      const exportButton = screen.getByText(/export/i)
      expect(exportButton).not.toBeDisabled()
    })

    it('should show clear all button', () => {
      render(<MemeStudio />)

      expect(screen.getByText(/clear all/i)).toBeInTheDocument()
    })
  })

  describe('adding objects', () => {
    it('should add text when Add Text is clicked', () => {
      render(<MemeStudio />)

      fireEvent.click(screen.getByText('Add Text'))

      // Properties panel should show text is selected
      expect(screen.getByTestId('selected-info')).toHaveTextContent('text')
    })

    it('should add image when Add Image is clicked', () => {
      render(<MemeStudio />)

      fireEvent.click(screen.getByText('Add Image'))

      // Properties panel should show image is selected
      expect(screen.getByTestId('selected-info')).toHaveTextContent('image')
    })
  })

  describe('drawing mode', () => {
    it('should toggle drawing mode', () => {
      render(<MemeStudio />)

      fireEvent.click(screen.getByText('Toggle Draw'))

      expect(screen.getByTestId('drawing-mode')).toBeInTheDocument()
    })
  })

  describe('keyboard shortcuts', () => {
    it('should handle delete key for selected object', () => {
      render(<MemeStudio />)

      // Add an object first
      fireEvent.click(screen.getByText('Add Text'))

      // Press delete
      fireEvent.keyDown(window, { key: 'Delete' })

      // Object should be deleted (no selected info)
      expect(screen.queryByTestId('selected-info')).not.toBeInTheDocument()
    })

    it('should handle escape to clear selection', () => {
      render(<MemeStudio />)

      // Add an object first
      fireEvent.click(screen.getByText('Add Text'))
      expect(screen.getByTestId('selected-info')).toBeInTheDocument()

      // Press escape
      fireEvent.keyDown(window, { key: 'Escape' })

      // Selection should be cleared
      expect(screen.queryByTestId('selected-info')).not.toBeInTheDocument()
    })
  })

  describe('clear all confirmation', () => {
    it('should show confirmation before clearing', () => {
      render(<MemeStudio />)

      // Add some objects
      fireEvent.click(screen.getByText('Add Text'))
      fireEvent.click(screen.getByText('Add Image'))

      // Click clear all
      fireEvent.click(screen.getByText(/clear all/i))

      // Confirm should have been called
      expect(global.confirm).toHaveBeenCalled()
    })
  })

  describe('desktop mode', () => {
    it('should apply desktop-mode class when isDesktopMode is true', () => {
      const { container } = render(<MemeStudio isDesktopMode={true} />)

      expect(container.querySelector('.meme-studio.desktop-mode')).toBeInTheDocument()
    })

    it('should not apply desktop-mode class when isDesktopMode is false', () => {
      const { container } = render(<MemeStudio isDesktopMode={false} />)

      expect(container.querySelector('.meme-studio.desktop-mode')).not.toBeInTheDocument()
    })
  })
})
