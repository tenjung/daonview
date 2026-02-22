# notifications 엔터티/가시성 필드 추가

알림을 역할(관리자/광고주/인플루언서) 공통 컴포넌트에서 동일하게 처리하고,  
캠페인 단위 읽음 상태(`seen_at`)를 표현하기 위한 마이그레이션입니다.

## 적용 SQL

```sql
alter table public.notifications
  add column if not exists entity_type text,
  add column if not exists entity_id bigint,
  add column if not exists priority smallint not null default 0,
  add column if not exists seen_at timestamptz;

create index if not exists idx_notifications_user_entity
  on public.notifications (user_id, entity_type, entity_id);

create index if not exists idx_notifications_user_priority_created
  on public.notifications (user_id, priority desc, created_at desc);
```

## 권장 데이터 규칙

- `entity_type`: `campaign` | `application` | `review` | `system` | `notice`
- `entity_id`: 엔터티 PK (캠페인은 campaign id)
- `priority`: `0`(기본) / `1`(중요) / `2`(긴급)
- `seen_at`: 사용자가 실제 확인(해당 캠페인 진입/알림 클릭)한 시각
