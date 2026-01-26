export default function StatusBar({ children, fields = [] }) {
  return (
    <div className="status-bar">
      {fields.map((field, index) => (
        <p key={index} className="status-bar-field" style={field.style}>
          {field.content}
        </p>
      ))}
      {children}
    </div>
  )
}
