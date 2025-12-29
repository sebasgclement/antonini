export default function Pagination({
  page, totalPages, onPage
}: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
      <button className="link" onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}>← Anterior</button>
      <span style={{ color: 'var(--color-muted)' }}>{page} / {totalPages}</span>
      <button className="link" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Siguiente →</button>
    </div>
  )
}
