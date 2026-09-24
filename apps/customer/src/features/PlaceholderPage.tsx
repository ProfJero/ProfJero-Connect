export function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="p-4 sm:p-6 lg:p-8 flex-1">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 text-center">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-2">
          This screen will be built in a later step.
        </p>
      </div>
    </main>
  );
}