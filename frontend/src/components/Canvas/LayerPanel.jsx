export default function LayerPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  canAddLayer,
  canRemoveLayer,
}) {
  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <span>Layers</span>
        <div className="layer-panel-buttons">
          <button
            className="layer-btn"
            onClick={onAddLayer}
            disabled={!canAddLayer}
            title="Add Layer"
          >
            +
          </button>
          <button
            className="layer-btn"
            onClick={() => onRemoveLayer(activeLayerId)}
            disabled={!canRemoveLayer}
            title="Remove Layer"
          >
            -
          </button>
        </div>
      </div>

      <div className="layer-list">
        {/* Render layers in reverse order (top layer first in list) */}
        {[...layers].reverse().map((layer, index) => (
          <div
            key={layer.id}
            className={`layer-item ${activeLayerId === layer.id ? 'active' : ''}`}
            onClick={() => onSelectLayer(layer.id)}
          >
            <button
              className={`layer-visibility ${layer.visible ? 'visible' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleVisibility(layer.id)
              }}
              title={layer.visible ? 'Hide Layer' : 'Show Layer'}
            >
              {layer.visible ? '👁️' : '👁️‍🗨️'}
            </button>

            <span className="layer-name">{layer.name}</span>

            <div className="layer-order-buttons">
              <button
                className="layer-order-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveUp(layer.id)
                }}
                disabled={index === 0}
                title="Move Up"
              >
                ▲
              </button>
              <button
                className="layer-order-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveDown(layer.id)
                }}
                disabled={index === layers.length - 1}
                title="Move Down"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="layer-hint">
        Draw on: {layers.find(l => l.id === activeLayerId)?.name}
      </div>
    </div>
  )
}
