import { useState } from 'react'

const InviteCollaborator = () => {
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <>
      {/* 按钮 */}
      <button
        className="text-blue-600 flex items-center gap-1 hover:underline"
        onClick={() => setShowModal(true)}
      >
        {/* 使用 SVG 图标替代 UserPlus */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6m3-3h-6M7 7a4 4 0 100 8 4 4 0 000-8zM7 15a6 6 0 00-6 6h12a6 6 0 00-6-6z" />
        </svg>
        添加协作者
      </button>

      {/* 弹框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80">
            <h2 className="text-lg font-semibold mb-4">邀请协作者</h2>
            <input
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-black"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 处理邀请逻辑
                  console.log('邀请：', email)
                  setShowModal(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                发送邀请
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InviteCollaborator
