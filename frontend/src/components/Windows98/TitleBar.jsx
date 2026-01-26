export default function TitleBar({ title, onClose, onMinimize, onMaximize, showControls = false }) {
  return (
    <div className="title-bar">
      <div className="title-bar-text">{title}</div>
      <div className="title-bar-controls">
        {(showControls || onMinimize) && (
          <button aria-label="Minimize" onClick={onMinimize} />
        )}
        {(showControls || onMaximize) && (
          <button aria-label="Maximize" onClick={onMaximize} />
        )}
        {(showControls || onClose) && (
          <button aria-label="Close" onClick={onClose} />
        )}
      </div>
    </div>
  )
}
