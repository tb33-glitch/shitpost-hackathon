import TitleBar from './TitleBar'

export default function Window({ title, children, className = '', onClose, onMinimize, onMaximize, showControls = false }) {
  return (
    <div className={`window ${className}`}>
      <TitleBar
        title={title}
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        showControls={showControls}
      />
      <div className="window-body">{children}</div>
    </div>
  )
}
