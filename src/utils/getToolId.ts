/**
 * 난독화된 lightweight-charts Line Tool 결과에서 도구 ID를 추출합니다.
 *
 * lightweight-charts의 minified 빌드에서 `addLineTool()`의 반환값은
 * `result.ak.ji` 형태의 난독화된 프로퍼티 경로에 ID가 들어있습니다.
 * 이 헬퍼를 사용하면 난독화 경로가 변경될 때 한 곳만 수정하면 됩니다.
 */
export function getToolIdFromResult(result: any): string | null {
  try {
    return result?.ak?.ji ?? null;
  } catch {
    return null;
  }
}
