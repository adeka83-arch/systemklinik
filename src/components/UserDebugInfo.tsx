interface UserDebugInfoProps {
  userRole?: string
  userType?: string
  filteredItemsCount: number
  totalItemsCount: number
}

export function UserDebugInfo({ userRole, userType, filteredItemsCount, totalItemsCount }: UserDebugInfoProps) {
  return (
    <div className="text-center py-4 px-2 text-pink-600 border border-pink-200 rounded-lg m-2 bg-pink-50">
      <p className="text-sm font-medium mb-2">🔧 Debug Info</p>
      <div className="text-xs space-y-1">
        <div><strong>Role:</strong> {userRole || 'undefined'}</div>
        <div><strong>Type:</strong> {userType || 'undefined'}</div>
        <div><strong>Menu Items:</strong> {filteredItemsCount}/{totalItemsCount}</div>
        
        {filteredItemsCount === 0 && (
          <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
            <strong>Sidebar kosong!</strong><br/>
            Menu items difilter berdasarkan user role/type.<br/>
            Jika ini error, check user metadata di console.
          </div>
        )}
      </div>
    </div>
  )
}