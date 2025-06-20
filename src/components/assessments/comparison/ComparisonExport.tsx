import React, { useState } from 'react'
import { Download, FileText, Image, Table, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { ComparisonMode } from './ComparisonManager'

interface ComparisonExportProps {
  data: unknown
  comparisonMode: ComparisonMode
  settings: unknown
}

type ExportFormat = 'csv' | 'excel' | 'pdf' | 'png' | 'json'
type ExportScope = 'summary' | 'detailed' | 'charts' | 'all'

interface ExportOption {
  format: ExportFormat
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
}

interface ExportResult {
  success: boolean
  message: string
  downloadUrl?: string
}

export const ComparisonExport: React.FC<ComparisonExportProps> = ({
  data,
  comparisonMode,
  settings
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [selectedScope, setSelectedScope] = useState<ExportScope>('summary')
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  const exportOptions: ExportOption[] = [
    {
      format: 'csv',
      label: 'CSV',
      description: '스프레드시트 호환 데이터',
      icon: Table,
      enabled: true
    },
    {
      format: 'excel',
      label: 'Excel',
      description: '상세 분석 가능한 엑셀 파일',
      icon: FileText,
      enabled: true
    },
    {
      format: 'pdf',
      label: 'PDF',
      description: '인쇄 가능한 보고서',
      icon: FileText,
      enabled: true
    },
    {
      format: 'png',
      label: 'PNG',
      description: '차트 이미지',
      icon: Image,
      enabled: true
    },
    {
      format: 'json',
      label: 'JSON',
      description: '원시 데이터',
      icon: FileText,
      enabled: true
    }
  ]

  const scopeOptions = [
    { value: 'summary' as ExportScope, label: '요약', description: '핵심 결과만' },
    { value: 'detailed' as ExportScope, label: '상세', description: '모든 분석 결과' },
    { value: 'charts' as ExportScope, label: '차트', description: '시각화 자료만' },
    { value: 'all' as ExportScope, label: '전체', description: '모든 데이터와 차트' }
  ]

  const getModeLabel = (mode: ComparisonMode): string => {
    switch (mode) {
      case 'time': return '시간_비교'
      case 'patient': return '환자_비교'
      case 'group': return '그룹_비교'
      case 'progress': return '진전도_분석'
    }
  }

  const generateFileName = (): string => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '')
    const modeLabel = getModeLabel(comparisonMode)
    
    return `평가비교_${modeLabel}_${selectedScope}_${dateStr}_${timeStr}`
  }

  const prepareCsvData = (): string => {
    let csvContent = ''
    
    switch (comparisonMode) {
      case 'time':
        if (data.timeComparison) {
          csvContent = '차원,현재기간,이전기간,차이,변화율,유의성\n'
          // 실제 데이터 구조에 맞게 조정 필요
          csvContent += `집중력,${data.timeComparison.currentAverage || 0},${data.timeComparison.previousAverage || 0},${data.timeComparison.difference || 0},${data.timeComparison.changeRate || 0},${data.timeComparison.significance || 'N/A'}\n`
        }
        break
        
      case 'patient':
        if (data.patientComparison && data.patientComparison.length > 0) {
          csvContent = '환자ID,환자명,집중력,동기,성공경험,제약요인,사회성,전체평균,순위\n'
          data.patientComparison.forEach((patient: unknown) => {
            csvContent += `${patient.patientId},${patient.patientName},${patient.averageScores.concentration},${patient.averageScores.motivation},${patient.averageScores.success},${patient.averageScores.constraints},${patient.averageScores.social},${patient.averageScores.overall},${patient.rank}\n`
          })
        }
        break
        
      case 'progress':
        if (data.progressAnalysis && data.progressAnalysis.length > 0) {
          csvContent = '환자ID,기울기,R제곱,예측값,개선률\n'
          data.progressAnalysis.forEach((analysis: unknown) => {
            csvContent += `${analysis.patientId},${analysis.trend.slope},${analysis.trend.rSquared},${analysis.prediction},${analysis.improvementRate}\n`
          })
        }
        break
        
      default:
        csvContent = '데이터 없음\n'
    }
    
    return csvContent
  }

  const prepareJsonData = (scope: ExportScope): string => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        comparisonMode,
        scope,
        settings: scope === 'detailed' || scope === 'all' ? settings : undefined
      },
      data: scope === 'charts' ? undefined : data,
      summary: {
        comparisonType: comparisonMode,
        dataPoints: getDataPointCount(),
        generatedAt: new Date().toISOString()
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const getDataPointCount = (): number => {
    switch (comparisonMode) {
      case 'time':
        return data.timeComparison ? 1 : 0
      case 'patient':
        return data.patientComparison ? data.patientComparison.length : 0
      case 'progress':
        return data.progressAnalysis ? data.progressAnalysis.length : 0
      default:
        return 0
    }
  }

  const simulateExport = async (): Promise<ExportResult> => {
    // 실제 구현에서는 서버 API 호출 또는 클라이언트 사이드 파일 생성
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 지연 시뮬레이션
    
    const fileName = generateFileName()
    
    // 간단한 클라이언트 사이드 내보내기 시뮬레이션
    if (selectedFormat === 'csv') {
      const csvData = prepareCsvData(selectedScope)
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      // 자동 다운로드 트리거
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return {
        success: true,
        message: 'CSV 파일이 성공적으로 다운로드되었습니다.',
        downloadUrl: url
      }
    }
    
    if (selectedFormat === 'json') {
      const jsonData = prepareJsonData(selectedScope)
      const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return {
        success: true,
        message: 'JSON 파일이 성공적으로 다운로드되었습니다.',
        downloadUrl: url
      }
    }
    
    // 다른 포맷들은 추후 구현
    return {
      success: false,
      message: `${selectedFormat.toUpperCase()} 형식은 현재 개발 중입니다.`
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)
    
    try {
      const result = await simulateExport()
      setExportResult(result)
    } catch {
      setExportResult({
        success: false,
        message: '내보내기 중 오류가 발생했습니다.'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const isExportEnabled = (): boolean => {
    const dataCount = getDataPointCount()
    return dataCount > 0 && !isExporting
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Download className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">데이터 내보내기</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 파일 형식 선택 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">내보내기 형식</h4>
          
          <div className="space-y-2">
            {exportOptions.map((option) => {
              const Icon = option.icon
              return (
                <label
                  key={option.format}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === option.format
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!option.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.format}
                    checked={selectedFormat === option.format}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    disabled={!option.enabled}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* 내보내기 범위 선택 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">내보내기 범위</h4>
          
          <div className="space-y-2">
            {scopeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedScope === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={option.value}
                  checked={selectedScope === option.value}
                  onChange={(e) => setSelectedScope(e.target.value as ExportScope)}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 내보내기 미리보기 정보 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">내보내기 정보</h5>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• 비교 유형: {getModeLabel(comparisonMode).replace('_', ' ')}</p>
          <p>• 데이터 포인트: {getDataPointCount()}개</p>
          <p>• 파일 형식: {exportOptions.find(o => o.format === selectedFormat)?.label}</p>
          <p>• 내보내기 범위: {scopeOptions.find(o => o.value === selectedScope)?.label}</p>
          <p>• 예상 파일명: {generateFileName()}.{selectedFormat}</p>
        </div>
      </div>

      {/* 내보내기 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          {!isExportEnabled() && getDataPointCount() === 0 && (
            <p className="text-sm text-amber-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>내보낼 데이터가 없습니다. 먼저 비교 분석을 실행해주세요.</span>
            </p>
          )}
        </div>
        
        <button
          onClick={handleExport}
          disabled={!isExportEnabled()}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isExportEnabled()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExporting ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>내보내는 중...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>내보내기</span>
            </>
          )}
        </button>
      </div>

      {/* 내보내기 결과 */}
      {exportResult && (
        <div className={`p-4 rounded-lg flex items-start space-x-3 ${
          exportResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {exportResult.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div>
            <div className={`font-medium ${
              exportResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {exportResult.success ? '내보내기 완료' : '내보내기 실패'}
            </div>
            <div className={`text-sm ${
              exportResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {exportResult.message}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 