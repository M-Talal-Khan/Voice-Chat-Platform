import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find all expired attachments
    const { data: expiredAttachments, error: fetchError } = await supabaseClient
      .from('attachments')
      .select('*')
      .lt('expires_at', new Date().toISOString())

    if (fetchError) throw fetchError

    if (!expiredAttachments || expiredAttachments.length === 0) {
      return new Response(JSON.stringify({ message: "No expired attachments found", count: 0 }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    let deletedCount = 0

    // Delete files from storage
    for (const att of expiredAttachments) {
      // file_url is a public URL, we need to extract the path inside the 'attachments' bucket
      // e.g. https://<project>.supabase.co/storage/v1/object/public/attachments/<user_id>/<file>
      const urlParts = att.file_url.split('/attachments/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        
        // delete from storage
        const { error: storageError } = await supabaseClient
          .storage
          .from('attachments')
          .remove([filePath])
          
        if (storageError) {
          console.error(`Failed to delete storage file ${filePath}:`, storageError)
          continue
        }
      }

      // delete from database
      const { error: dbError } = await supabaseClient
        .from('attachments')
        .delete()
        .eq('id', att.id)

      if (dbError) {
        console.error(`Failed to delete db record ${att.id}:`, dbError)
      } else {
        deletedCount++
      }
    }

    return new Response(JSON.stringify({ message: "Successfully deleted expired attachments", count: deletedCount }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
