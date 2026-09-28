

export default function AnimalImageFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--toss-gray-100)] text-[var(--toss-gray-400)]">
      <svg
        className="w-10 h-10 mb-2 opacity-50"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
      <span className="text-xs font-semibold tracking-tight">사진 준비중</span>
    </div>
  );
}
