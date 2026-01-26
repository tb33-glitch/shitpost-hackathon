export default function Button({ children, onClick, disabled, className = '', ...props }) {
  return (
    <button
      className={`${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
