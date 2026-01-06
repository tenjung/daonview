
import { supabase } from "@/lib/supabaseClient";

export default async function DiagnosticPage() {
    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .limit(1);

    return (
        <div className="p-10">
            <h1 className="text-xl font-bold">Diagnostic Info</h1>
            <pre className="mt-4 p-4 bg-gray-100 rounded">
                {JSON.stringify({ data, error }, null, 2)}
            </pre>
        </div>
    );
}
