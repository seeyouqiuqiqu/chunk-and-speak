import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CopyButton({ text, label = '复制内容' }) {
  const handleCopy = async () => {
    if (!text?.trim()) {
      toast.error('暂无可复制内容')
      return
    }

    try {
      await navigator.clipboard.writeText(text.trim())
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败，请手动选择文本')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={label}
      className="absolute bottom-3 right-3 rounded-lg border border-gray-200 bg-white/90 p-2 text-gray-500 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
