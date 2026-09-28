/** 사진이 없는 동물 카드에 채우는 자리 표시 (부모 요소를 가득 채운다) */
export default function AnimalImageFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-cream-200 text-ink-faint">
      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <ellipse cx="6" cy="10" rx="1.9" ry="2.4" />
        <ellipse cx="10" cy="6.4" rx="1.9" ry="2.4" />
        <ellipse cx="14" cy="6.4" rx="1.9" ry="2.4" />
        <ellipse cx="18" cy="10" rx="1.9" ry="2.4" />
        <path d="M12 11.5c-2.6 0-5.2 3.1-5.2 5.4 0 1.6 1.2 2.4 2.6 2.4 1 0 1.6-.5 2.6-.5s1.6.5 2.6.5c1.4 0 2.6-.8 2.6-2.4 0-2.3-2.6-5.4-5.2-5.4z" />
      </svg>
      <span className="text-xs font-medium tracking-tight text-ink-muted">사진 준비 중</span>
    </div>
  );
}
