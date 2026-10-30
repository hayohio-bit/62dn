/** 정적 스냅샷에서 id로 찾지 못했을 때 던진다. 백엔드의 404와 같은 뜻 */
export class NotFoundError extends Error {
  constructor(message = "찾을 수 없습니다.") {
    super(message);
    this.name = "NotFoundError";
  }
}
