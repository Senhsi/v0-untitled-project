export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 h-10 w-48 animate-pulse rounded-md bg-muted"></div>

      <div className="mb-6 h-10 w-full max-w-md animate-pulse rounded-md bg-muted"></div>

      <div className="w-full rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 h-8 w-64 animate-pulse rounded-md bg-muted"></div>
        <div className="mb-4 h-4 w-full max-w-md animate-pulse rounded-md bg-muted"></div>

        <div className="mb-8 flex justify-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted"></div>
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted"></div>
            <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted"></div>
            <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="h-4 w-20 animate-pulse rounded-md bg-muted"></div>
          <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
        </div>

        <div className="mb-8 space-y-2">
          <div className="h-4 w-20 animate-pulse rounded-md bg-muted"></div>
          <div className="h-32 w-full animate-pulse rounded-md bg-muted"></div>
        </div>

        <div className="flex justify-start">
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted"></div>
        </div>
      </div>
    </div>
  )
}
