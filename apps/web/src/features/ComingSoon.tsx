export function ComingSoon({ title }: { title: string }) {
  return (
    <main className="p-7 flex-1">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-10 text-center">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">
          This screen will be built in a later step.
        </p>
      </div>
    </main>
  );
}