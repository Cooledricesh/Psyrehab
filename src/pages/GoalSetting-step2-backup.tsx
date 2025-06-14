          <div className="space-y-8">
            {/* 헤더 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">맞춤형 목표 설정 질문지</h2>
              <p className="text-gray-600">
                {patients?.find(p => p.id === selectedPatient)?.full_name}님의 개인별 특성을 파악하여 최적의 재활 목표를 추천해드립니다.
              </p>
            </div>

            {/* 1. 집중력 & 인지 부담 측정 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-2 rounded-lg mr-3">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">1. 집중력 & 인지 부담 측정</h3>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-base font-medium text-gray-900 mb-4">
                  한 가지 일에 집중할 수 있는 시간은 얼마나 되나요?
                </label>
                <div className="space-y-3">
                  {FOCUS_TIME_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="focusTime"
                        value={option.value}
                        checked={formData.focusTime === option.value}
                        onChange={(e) => handleFocusTimeChange(e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 나머지 섹션들... */}
          </div>