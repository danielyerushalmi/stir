export default function DashboardLoading() {
  return (
    <div className="p-8 animate-pulse space-y-6">
      <div className="h-8 w-48 bg-orange-light/30 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-orange-light/20 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-orange-light/20 rounded-2xl" />
    </div>
  )
}
