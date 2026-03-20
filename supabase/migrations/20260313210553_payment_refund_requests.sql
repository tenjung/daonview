CREATE TABLE IF NOT EXISTS public.payment_refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL,
    requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    request_reason TEXT NOT NULL,
    admin_note TEXT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ NULL,
    reviewed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    refund_type TEXT NULL,
    refund_amount BIGINT NULL,
    CONSTRAINT payment_refund_requests_status_check
        CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT payment_refund_requests_refund_type_check
        CHECK (refund_type IS NULL OR refund_type IN ('FULL', 'PARTIAL')),
    CONSTRAINT payment_refund_requests_refund_amount_check
        CHECK (refund_amount IS NULL OR refund_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payment_refund_requests_payment_id
    ON public.payment_refund_requests (payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_refund_requests_requester_user_id
    ON public.payment_refund_requests (requester_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_refund_requests_open_request
    ON public.payment_refund_requests (payment_id)
    WHERE status IN ('REQUESTED', 'APPROVED');

ALTER TABLE public.payment_refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_refund_requests_select_own" ON public.payment_refund_requests;
CREATE POLICY "payment_refund_requests_select_own"
    ON public.payment_refund_requests
    FOR SELECT
    TO authenticated
    USING (
        requester_user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND UPPER(COALESCE(profiles.role, '')) = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS "payment_refund_requests_insert_own" ON public.payment_refund_requests;
CREATE POLICY "payment_refund_requests_insert_own"
    ON public.payment_refund_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "payment_refund_requests_update_admin" ON public.payment_refund_requests;
CREATE POLICY "payment_refund_requests_update_admin"
    ON public.payment_refund_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND UPPER(COALESCE(profiles.role, '')) = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND UPPER(COALESCE(profiles.role, '')) = 'ADMIN'
        )
    );
