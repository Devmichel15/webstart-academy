export function AuthorAvatar({ name, photoURL, size = 36 }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full border-2 border-strong object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-strong bg-brand-500 font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
