// 리뷰 증빙(구매금액·구매평 스샷, 링크형 리뷰 첨부) 전용 private 버킷.
// 공개 URL을 만들지 않고 DB에는 버킷 내부 경로만 저장한다. 열람은 서버에서 서명 URL로만 발급한다.
export const REVIEW_PROOF_BUCKET = 'review-proofs';

export const getReviewProofPathPrefix = (campaignId: number, userId: string) =>
  `reviews/${campaignId}/${userId}/`;

/** 본인·해당 캠페인 폴더 안의 정상 경로인지 확인한다. */
export const isOwnReviewProofPath = (value: string, campaignId: number, userId: string) => {
  const prefix = getReviewProofPathPrefix(campaignId, userId);
  if (!value.startsWith(prefix)) return false;
  const fileName = value.slice(prefix.length);
  return /^[A-Za-z0-9._-]+$/.test(fileName) && !fileName.includes('..');
};

/** http(s) URL이 아니면 private 버킷 경로로 본다(이전 공개 URL은 그대로 통과). */
export const isReviewProofPath = (value: string) => Boolean(value) && !/^https?:\/\//i.test(value);
