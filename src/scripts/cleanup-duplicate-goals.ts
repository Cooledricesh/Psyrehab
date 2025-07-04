import { supabase } from '@/lib/supabase'

interface PatientGoalCleanupResult {
  patientId: string
  patientName: string
  patientStatus: string
  deletedGoals: number
  keptGoals: number
  error?: string
}

/**
 * 중복 목표 정리 스크립트
 * 
 * 규칙:
 * 1. pending/discharged 환자: completed 목표만 유지, 나머지 삭제
 * 2. active 환자: 가장 최신 활성 목표 1개 + completed 목표만 유지
 */
async function cleanupDuplicateGoals(): Promise<void> {
  console.log('🧹 중복 목표 정리 시작...')
  
  const results: PatientGoalCleanupResult[] = []
  
  try {
    // 1. 모든 환자 조회
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name, status')
      .order('full_name')
    
    if (patientsError || !patients) {
      throw new Error('환자 목록 조회 실패')
    }
    
    console.log(`총 ${patients.length}명의 환자 확인`)
    
    for (const patient of patients) {
      const result: PatientGoalCleanupResult = {
        patientId: patient.id,
        patientName: patient.full_name,
        patientStatus: patient.status,
        deletedGoals: 0,
        keptGoals: 0
      }
      
      try {
        // 환자의 모든 목표 조회
        const { data: goals, error: goalsError } = await supabase
          .from('rehabilitation_goals')
          .select('id, goal_type, status, created_at, start_date')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false })
        
        if (goalsError) {
          result.error = '목표 조회 실패'
          results.push(result)
          continue
        }
        
        if (!goals || goals.length === 0) {
          results.push(result)
          continue
        }
        
        const goalsToDelete: string[] = []
        const goalsToKeep: string[] = []
        
        // completed 목표는 모두 유지
        const completedGoals = goals.filter(g => g.status === 'completed')
        goalsToKeep.push(...completedGoals.map(g => g.id))
        
        // completed가 아닌 목표들
        const nonCompletedGoals = goals.filter(g => g.status !== 'completed')
        
        if (patient.status === 'pending' || patient.status === 'discharged') {
          // pending/discharged 환자: completed만 유지, 나머지 모두 삭제
          goalsToDelete.push(...nonCompletedGoals.map(g => g.id))
        } else if (patient.status === 'active') {
          // active 환자: 가장 최신 활성 목표 1개만 유지
          const activeGoals = nonCompletedGoals.filter(g => 
            g.status === 'active' || g.status === 'in_progress'
          )
          
          if (activeGoals.length > 0) {
            // 가장 최신 목표 1개만 유지
            goalsToKeep.push(activeGoals[0].id)
            goalsToDelete.push(...activeGoals.slice(1).map(g => g.id))
          }
          
          // pending, on_hold, cancelled 목표는 모두 삭제
          const otherGoals = nonCompletedGoals.filter(g => 
            g.status === 'pending' || g.status === 'on_hold' || g.status === 'cancelled'
          )
          goalsToDelete.push(...otherGoals.map(g => g.id))
        }
        
        // 목표 삭제 실행
        if (goalsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('rehabilitation_goals')
            .delete()
            .in('id', goalsToDelete)
          
          if (deleteError) {
            result.error = '목표 삭제 실패'
          } else {
            result.deletedGoals = goalsToDelete.length
          }
        }
        
        result.keptGoals = goalsToKeep.length
        results.push(result)
        
        if (result.deletedGoals > 0) {
          console.log(`✅ ${patient.full_name} (${patient.status}): ${result.deletedGoals}개 삭제, ${result.keptGoals}개 유지`)
        }
        
      } catch (error) {
        result.error = error instanceof Error ? error.message : '알 수 없는 오류'
        results.push(result)
      }
    }
    
    // 결과 요약
    const totalDeleted = results.reduce((sum, r) => sum + r.deletedGoals, 0)
    const totalKept = results.reduce((sum, r) => sum + r.keptGoals, 0)
    const errors = results.filter(r => r.error)
    
    console.log('\n📊 정리 완료 요약:')
    console.log(`- 총 삭제된 목표: ${totalDeleted}개`)
    console.log(`- 총 유지된 목표: ${totalKept}개`)
    console.log(`- 오류 발생 환자: ${errors.length}명`)
    
    if (errors.length > 0) {
      console.log('\n❌ 오류 발생 환자:')
      errors.forEach(e => {
        console.log(`- ${e.patientName}: ${e.error}`)
      })
    }
    
    // 상세 결과를 파일로 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportContent = JSON.stringify(results, null, 2)
    console.log(`\n💾 상세 결과는 cleanup-report-${timestamp}.json 파일로 저장하세요.`)
    console.log('결과 데이터:', reportContent)
    
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error)
  }
}

// 실행 확인 프롬프트
async function runWithConfirmation() {
  console.log('⚠️  주의: 이 스크립트는 데이터베이스의 목표를 영구적으로 삭제합니다.')
  console.log('규칙:')
  console.log('1. pending/discharged 환자: completed 목표만 유지')
  console.log('2. active 환자: 최신 활성 목표 1개 + completed 목표만 유지')
  console.log('\n계속하려면 "CONFIRM"을 입력하세요:')
  
  // Node.js 환경에서 실행 시
  if (typeof process !== 'undefined' && process.stdin) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    readline.question('입력: ', async (answer) => {
      if (answer === 'CONFIRM') {
        await cleanupDuplicateGoals()
      } else {
        console.log('❌ 취소되었습니다.')
      }
      readline.close()
    })
  } else {
    // 브라우저 환경에서 실행 시
    const answer = prompt('입력:')
    if (answer === 'CONFIRM') {
      await cleanupDuplicateGoals()
    } else {
      console.log('❌ 취소되었습니다.')
    }
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runWithConfirmation()
}

export { cleanupDuplicateGoals }