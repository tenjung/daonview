update public.email_templates
set
  subject = '🎉 [다온뷰] 축하합니다! ''{{campaignTitle}}'' 캠페인에 선정되셨습니다.',
  html_content = $template$
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#334155;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:28px;">
    <div style="text-align:center;margin-bottom:20px;">
      <img src="https://daonview.com/daonview_logo.png" alt="다온뷰" style="height:40px;" />
      <div style="font-size:24px;font-weight:800;color:#0f172a;">다온뷰</div>
    </div>
    <div style="background:linear-gradient(135deg,#fff1f5 0%,#ffe4ee 100%);border:1px solid #fecdd3;border-radius:14px;padding:20px;margin-bottom:20px;text-align:center;">
      <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.25;margin-bottom:8px;">캠페인 선정 축하드립니다!</div>
      <div style="font-size:14px;color:#475569;">구매 전 확정 옵션과 구매 링크를 확인해 주세요.</div>
    </div>
    <p>안녕하세요, <b>{{nickname}}</b>님.</p>
    <p>신청하신 <b>[{{campaignTitle}}]</b> 캠페인에 최종 선정되셨습니다.</p>
    {{selectionDetailsHtml}}
    <div style="text-align:center;margin-top:24px;">
      <a href="{{campaignUrl}}" style="display:inline-block;padding:14px 22px;background:#0f172a;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;margin:4px;">캠페인 가이드 보기</a>
      <a href="https://daonview.com/dashboard/influencer/campaigns" style="display:inline-block;padding:14px 22px;background:#f43f5e;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;margin:4px;">리뷰 등록하기</a>
    </div>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
      <p><a href="https://pf.kakao.com/_xbxhDgn/chat" style="display:inline-block;padding:10px 18px;background:#FEE500;color:#111827;text-decoration:none;border-radius:8px;font-weight:700;">💬 카카오톡 문의하기</a></p>
      <p>© 2026 다온뷰(Daonview). All rights reserved.</p>
      <p>본 메일은 발신전용으로 회신이 되지 않습니다.</p>
      <p>더 이상 소식을 받고 싶지 않으시다면 <a href="https://daonview.com/unsubscribe?email={{email}}" style="color:#94a3b8;text-decoration:underline;">수신거부</a>를 클릭해 주세요.</p>
    </div>
  </div>
</body>
</html>
$template$,
  updated_at = timezone('utc'::text, now())
where type = 'CAMPAIGN_SELECTED'
  and is_active = true;

