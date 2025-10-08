// Tambahkan quick action buttons setelah semua password fields di SecuritySettingsPageV4.tsx
// Insert setelah Super User Password section (setelah line 700-an)

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Quick Actions & Debug Tools
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAllPasswords}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate Semua
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetToDefaults}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Set Default
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllPasswords}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Clear Semua
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDebugStorage}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Debug Storage
                  </Button>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• <strong>Generate Semua:</strong> Membuat password baru untuk semua level</p>
                  <p>• <strong>Set Default:</strong> staff123, owner456, super789</p>
                  <p>• <strong>Clear Semua:</strong> Menghapus semua password (reset)</p>
                  <p>• <strong>Debug Storage:</strong> Menampilkan config localStorage di console</p>
                </div>
              </div>