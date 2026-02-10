'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function CreateCommunityForm() {
  const [showForm, setShowForm] = useState(false)
  const [newCommunityName, setNewCommunityName] = useState('')
  const [communityDescription, setCommunityDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateCommunity = () => {
    setShowForm((prev) => !prev)
  }

  const handleSubmitCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const group_name = newCommunityName.trim()
    const description = communityDescription.trim()
    if (!group_name || !description) {
      alert('请填写群名和简介')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        alert('请先登录')
        return
      }

      const { error } = await supabase.from('community_submissions').insert({
        group_name,
        description,
      })

      if (error) throw error

      alert('提交成功！我们会尽快审核。')
      setNewCommunityName('')
      setCommunityDescription('')
      setShowForm(false)
    } catch (err: any) {
      console.error(err)
      alert(`提交失败：${err?.message ?? String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-[#c9d9ea] bg-[#f4f9ff] text-[#4f6883] hover:bg-[#e9f2fb]"
        onClick={handleCreateCommunity}
      >
        创建社群
      </Button>

      {showForm ? (
        <div className="mb-8 rounded-lg border border-[#c9d9ea] bg-[#eef5fb] p-4 text-[#36597a]">
          <p className="mb-4 text-sm">本功能正在内测中，请填写想要创建的群名和简介。</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block">群名</span>
              <input
                value={newCommunityName}
                onChange={(event) => setNewCommunityName(event.target.value)}
                placeholder="例如：青年影像共学社"
                className="w-full rounded-md border border-[#b5c8db] bg-white px-3 py-2 text-sm text-[#36597a] outline-none ring-[#7ea1c4] focus:ring-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">简介</span>
              <input
                value={communityDescription}
                onChange={(event) => setCommunityDescription(event.target.value)}
                placeholder="请输入社群简介"
                className="w-full rounded-md border border-[#b5c8db] bg-white px-3 py-2 text-sm text-[#36597a] outline-none ring-[#7ea1c4] focus:ring-2"
              />
            </label>
          </div>
          <Button
            className="mt-4 bg-[#6e8fb1] text-white hover:bg-[#5d7fa2]"
            onClick={handleSubmitCreateRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交申请'}
          </Button>
        </div>
      ) : null}
    </>
  )
}
