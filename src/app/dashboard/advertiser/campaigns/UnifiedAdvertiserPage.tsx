"use client"

import * as React from "react"
import { useAuthStore } from "@/store/authStore"
import { supabase } from "@/lib/supabaseClient"
import { UnifiedAdvertiserCampaigns } from "@/components/admin/UnifiedAdvertiserCampaigns"

export default function UnifiedAdvertiserPage() {
    const { user, isLoading: authLoading } = useAuthStore()
    const [campaigns, setCampaigns] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (!authLoading && user) {
            fetchCampaigns()
        } else if (!authLoading && !user) {
            setLoading(false)
        }
    }, [authLoading, user])

    const fetchCampaigns = async () => {
        if (!user) return
        setLoading(true)

        const { data, error } = await supabase
            .from("campaigns")
            .select("*, applications(count)")
            .eq("created_by", user.id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching campaigns:", error)
        } else {
            setCampaigns(data || [])
        }
        setLoading(false)
    }

    return (
        <UnifiedAdvertiserCampaigns initialData={campaigns} />
    )
}
