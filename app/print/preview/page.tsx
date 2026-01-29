import { Suspense } from "react"
import PrintPreviewContent from "./PrintPreviewContent"

export const dynamic = 'force-dynamic'

export default function PrintPreviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintPreviewContent />
    </Suspense>
  )
}
