import { TEMPLATES } from '../../config/templates'

export default function TemplatePicker({ onSelectTemplate, onClose }) {
  return (
    <div className="picker-panel template-picker">
      <div className="picker-header">
        <span>Templates</span>
        <button className="picker-close" onClick={onClose}>X</button>
      </div>
      <div className="picker-list">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="picker-list-item"
            onClick={() => {
              onSelectTemplate(template.getData())
              onClose()
            }}
          >
            <span className="template-name">{template.name}</span>
            <span className="template-desc">{template.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
