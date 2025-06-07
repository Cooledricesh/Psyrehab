import type { AssessmentFormConfig, AssessmentStep } from '@/types/assessment'

// 평가 폼 설정 정의
export const assessmentFormConfigs: Record<AssessmentStep, AssessmentFormConfig> = {
  concentration_time: {
    step: 'concentration_time',
    title: '집중 시간 평가',
    description: '환자의 집중 능력과 최적의 집중 환경을 평가합니다.',
    fields: [
      {
        id: 'duration',
        type: 'number',
        label: '지속 가능한 집중 시간 (분)',
        placeholder: '예: 30',
        required: true,
        min: 5,
        max: 180,
        step: 5,
        validation: {
          custom: (value) => {
            if (value < 5) return '최소 5분 이상이어야 합니다'
            if (value > 180) return '최대 180분 이하로 입력해주세요'
            return true
          }
        }
      },
      {
        id: 'environment',
        type: 'radio',
        label: '최적의 집중 환경',
        required: true,
        options: [
          { value: 'quiet', label: '조용한 환경 (도서관, 개인 공간)' },
          { value: 'moderate', label: '적당한 소음 환경 (카페, 사무실)' },
          { value: 'noisy', label: '시끄러운 환경에서도 집중 가능' }
        ]
      },
      {
        id: 'time_of_day',
        type: 'radio',
        label: '최적의 집중 시간대',
        required: true,
        options: [
          { value: 'morning', label: '오전 (6시-12시)' },
          { value: 'afternoon', label: '오후 (12시-18시)' },
          { value: 'evening', label: '저녁 (18시-24시)' }
        ]
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '추가 관찰사항',
        placeholder: '집중 패턴, 방해 요소, 특이사항 등을 기록해주세요',
        required: false,
        validation: {
          maxLength: 500
        }
      }
    ],
    validation: {
      required_fields: ['duration', 'environment', 'time_of_day']
    }
  },

  motivation_level: {
    step: 'motivation_level',
    title: '동기 수준 평가',
    description: '환자의 내적/외적 동기와 목표 의식을 평가합니다.',
    fields: [
      {
        id: 'self_motivation',
        type: 'scale',
        label: '자기 동기 (내적 동기)',
        required: true,
        min: 1,
        max: 5,
        options: [
          { value: 1, label: '매우 낮음' },
          { value: 2, label: '낮음' },
          { value: 3, label: '보통' },
          { value: 4, label: '높음' },
          { value: 5, label: '매우 높음' }
        ]
      },
      {
        id: 'external_motivation',
        type: 'scale',
        label: '외적 동기 (타인의 격려, 보상 등)',
        required: true,
        min: 1,
        max: 5,
        options: [
          { value: 1, label: '매우 낮음' },
          { value: 2, label: '낮음' },
          { value: 3, label: '보통' },
          { value: 4, label: '높음' },
          { value: 5, label: '매우 높음' }
        ]
      },
      {
        id: 'goal_clarity',
        type: 'scale',
        label: '목표 명확성',
        required: true,
        min: 1,
        max: 5,
        options: [
          { value: 1, label: '매우 불분명' },
          { value: 2, label: '불분명' },
          { value: 3, label: '보통' },
          { value: 4, label: '명확' },
          { value: 5, label: '매우 명확' }
        ]
      },
      {
        id: 'confidence_level',
        type: 'scale',
        label: '자신감 수준',
        required: true,
        min: 1,
        max: 5,
        options: [
          { value: 1, label: '매우 낮음' },
          { value: 2, label: '낮음' },
          { value: 3, label: '보통' },
          { value: 4, label: '높음' },
          { value: 5, label: '매우 높음' }
        ]
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '동기 관련 추가 관찰사항',
        placeholder: '동기 부여 요인, 동기 저하 요인 등을 기록해주세요',
        required: false,
        validation: {
          maxLength: 500
        }
      }
    ],
    validation: {
      required_fields: ['self_motivation', 'external_motivation', 'goal_clarity', 'confidence_level']
    }
  },

  past_successes: {
    step: 'past_successes',
    title: '과거 성공 경험 평가',
    description: '환자의 과거 성취와 성공 경험을 파악하여 강점을 활용합니다.',
    fields: [
      {
        id: 'academic_achievements',
        type: 'checkbox',
        label: '학업 성취',
        required: false,
        options: [
          { value: 'true', label: '학업 관련 성취 경험이 있음' }
        ]
      },
      {
        id: 'work_experience',
        type: 'checkbox',
        label: '업무 경험',
        required: false,
        options: [
          { value: 'true', label: '직업적 성취 경험이 있음' }
        ]
      },
      {
        id: 'social_achievements',
        type: 'checkbox',
        label: '사회적 성취',
        required: false,
        options: [
          { value: 'true', label: '대인관계나 사회활동에서의 성취가 있음' }
        ]
      },
      {
        id: 'creative_accomplishments',
        type: 'checkbox',
        label: '창작 활동',
        required: false,
        options: [
          { value: 'true', label: '예술, 창작 등의 분야에서 성취가 있음' }
        ]
      },
      {
        id: 'physical_achievements',
        type: 'checkbox',
        label: '신체적 성취',
        required: false,
        options: [
          { value: 'true', label: '운동, 체육 활동에서의 성취가 있음' }
        ]
      },
      {
        id: 'personal_growth',
        type: 'checkbox',
        label: '개인적 성장',
        required: false,
        options: [
          { value: 'true', label: '자기계발, 극복 경험 등이 있음' }
        ]
      },
      {
        id: 'descriptions',
        type: 'textarea',
        label: '구체적인 성공 경험 설명',
        placeholder: '각 성취에 대한 구체적인 내용을 줄바꿈으로 구분하여 입력해주세요',
        required: false,
        validation: {
          maxLength: 1000
        }
      },
      {
        id: 'most_significant',
        type: 'textarea',
        label: '가장 의미 있는 성취',
        placeholder: '환자에게 가장 큰 의미를 가지는 성취 경험을 설명해주세요',
        required: false,
        validation: {
          maxLength: 300
        }
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '추가 관찰사항',
        placeholder: '성취에 대한 환자의 인식, 자부심 정도 등을 기록해주세요',
        required: false,
        validation: {
          maxLength: 500
        }
      }
    ],
    validation: {
      required_fields: []
    }
  },

  constraints: {
    step: 'constraints',
    title: '제약 조건 평가',
    description: '환자가 직면한 다양한 제약 조건과 장애 요소를 파악합니다.',
    fields: [
      {
        id: 'physical_limitations',
        type: 'multiselect',
        label: '신체적 제약',
        required: false,
        options: [
          { value: 'mobility', label: '이동성 제약' },
          { value: 'vision', label: '시각 장애' },
          { value: 'hearing', label: '청각 장애' },
          { value: 'chronic_pain', label: '만성 통증' },
          { value: 'fatigue', label: '쉽게 피로함' },
          { value: 'motor_skills', label: '운동 능력 제약' },
          { value: 'other_physical', label: '기타 신체적 제약' }
        ]
      },
      {
        id: 'cognitive_challenges',
        type: 'multiselect',
        label: '인지적 어려움',
        required: false,
        options: [
          { value: 'memory', label: '기억력 문제' },
          { value: 'attention', label: '주의력 문제' },
          { value: 'processing_speed', label: '처리 속도 저하' },
          { value: 'executive_function', label: '실행 기능 문제' },
          { value: 'learning_difficulty', label: '학습 장애' },
          { value: 'language', label: '언어 처리 어려움' },
          { value: 'other_cognitive', label: '기타 인지적 어려움' }
        ]
      },
      {
        id: 'emotional_barriers',
        type: 'multiselect',
        label: '정서적 장벽',
        required: false,
        options: [
          { value: 'anxiety', label: '불안' },
          { value: 'depression', label: '우울' },
          { value: 'low_self_esteem', label: '낮은 자존감' },
          { value: 'fear_of_failure', label: '실패에 대한 두려움' },
          { value: 'perfectionism', label: '완벽주의' },
          { value: 'emotional_instability', label: '정서 불안정' },
          { value: 'other_emotional', label: '기타 정서적 문제' }
        ]
      },
      {
        id: 'social_obstacles',
        type: 'multiselect',
        label: '사회적 장애요소',
        required: false,
        options: [
          { value: 'social_anxiety', label: '사회적 불안' },
          { value: 'communication_difficulty', label: '의사소통 어려움' },
          { value: 'isolation', label: '사회적 고립' },
          { value: 'stigma', label: '편견과 차별' },
          { value: 'family_conflict', label: '가족 갈등' },
          { value: 'peer_pressure', label: '또래 압력' },
          { value: 'other_social', label: '기타 사회적 문제' }
        ]
      },
      {
        id: 'environmental_factors',
        type: 'multiselect',
        label: '환경적 요인',
        required: false,
        options: [
          { value: 'noisy_environment', label: '소음이 많은 환경' },
          { value: 'lack_of_space', label: '적절한 공간 부족' },
          { value: 'transportation', label: '교통 문제' },
          { value: 'technology_access', label: '기술 접근성 부족' },
          { value: 'safety_concerns', label: '안전 우려' },
          { value: 'weather_sensitivity', label: '날씨 민감성' },
          { value: 'other_environmental', label: '기타 환경적 요인' }
        ]
      },
      {
        id: 'financial_constraints',
        type: 'checkbox',
        label: '경제적 제약',
        required: false,
        options: [
          { value: 'true', label: '경제적 어려움이 있음' }
        ]
      },
      {
        id: 'time_limitations',
        type: 'multiselect',
        label: '시간적 제약',
        required: false,
        options: [
          { value: 'work_schedule', label: '업무 일정' },
          { value: 'family_responsibilities', label: '가족 돌봄 책임' },
          { value: 'medical_appointments', label: '의료 약속' },
          { value: 'educational_commitments', label: '교육 일정' },
          { value: 'other_commitments', label: '기타 약속' }
        ]
      },
      {
        id: 'severity_rating',
        type: 'scale',
        label: '전반적인 제약의 심각도',
        required: true,
        min: 1,
        max: 5,
        options: [
          { value: 1, label: '매우 경미' },
          { value: 2, label: '경미' },
          { value: 3, label: '보통' },
          { value: 4, label: '심각' },
          { value: 5, label: '매우 심각' }
        ]
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '제약 조건 관련 추가 설명',
        placeholder: '각 제약의 구체적인 내용이나 영향을 설명해주세요',
        required: false,
        validation: {
          maxLength: 800
        }
      }
    ],
    validation: {
      required_fields: ['severity_rating']
    }
  },

  social_preference: {
    step: 'social_preference',
    title: '사회적 선호 평가',
    description: '환자의 사회적 상호작용 선호도와 소통 방식을 파악합니다.',
    fields: [
      {
        id: 'group_size_preference',
        type: 'radio',
        label: '선호하는 그룹 크기',
        required: true,
        options: [
          { value: 'individual', label: '개별 활동 (1:1 또는 혼자)' },
          { value: 'small_group', label: '소그룹 (2-5명)' },
          { value: 'large_group', label: '대그룹 (6명 이상)' },
          { value: 'flexible', label: '상황에 따라 유연하게' }
        ]
      },
      {
        id: 'interaction_style',
        type: 'radio',
        label: '상호작용 스타일',
        required: true,
        options: [
          { value: 'active_participant', label: '적극적 참여자' },
          { value: 'observer', label: '관찰자 (주로 듣기)' },
          { value: 'leader', label: '리더 역할 선호' },
          { value: 'supporter', label: '지지자 역할 선호' }
        ]
      },
      {
        id: 'communication_preference',
        type: 'radio',
        label: '의사소통 선호 방식',
        required: true,
        options: [
          { value: 'verbal', label: '구두 의사소통' },
          { value: 'written', label: '문서/텍스트 의사소통' },
          { value: 'non_verbal', label: '비언어적 의사소통' },
          { value: 'mixed', label: '혼합 방식' }
        ]
      },
      {
        id: 'support_type_needed',
        type: 'multiselect',
        label: '필요한 지원 유형',
        required: false,
        options: [
          { value: 'emotional_support', label: '정서적 지원' },
          { value: 'practical_guidance', label: '실용적 안내' },
          { value: 'skill_teaching', label: '기술 지도' },
          { value: 'encouragement', label: '격려와 동기부여' },
          { value: 'problem_solving', label: '문제 해결 도움' },
          { value: 'social_connection', label: '사회적 연결' },
          { value: 'advocacy', label: '권익 옹호' },
          { value: 'resource_information', label: '자원 정보 제공' }
        ]
      },
      {
        id: 'comfort_with_strangers',
        type: 'scale',
        label: '낯선 사람과의 편안함 정도',
        required: true,
        min: 1,
        max: 5,
        options: [
          { value: 1, label: '매우 불편함' },
          { value: 2, label: '불편함' },
          { value: 3, label: '보통' },
          { value: 4, label: '편안함' },
          { value: 5, label: '매우 편안함' }
        ]
      },
      {
        id: 'collaboration_willingness',
        type: 'scale',
        label: '협력 의지',
        required: true,
        min: 1,
        max: 5,
        options: [
          { value: 1, label: '매우 낮음' },
          { value: 2, label: '낮음' },
          { value: 3, label: '보통' },
          { value: 4, label: '높음' },
          { value: 5, label: '매우 높음' }
        ]
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '사회적 선호 관련 추가 관찰사항',
        placeholder: '사회적 상황에서의 특별한 패턴이나 선호사항을 기록해주세요',
        required: false,
        validation: {
          maxLength: 500
        }
      }
    ],
    validation: {
      required_fields: ['group_size_preference', 'interaction_style', 'communication_preference', 'comfort_with_strangers', 'collaboration_willingness']
    }
  }
}

// 평가 단계 순서
export const assessmentStepOrder: AssessmentStep[] = [
  'concentration_time',
  'motivation_level', 
  'past_successes',
  'constraints',
  'social_preference'
]

// 평가 단계별 아이콘
export const assessmentStepIcons: Record<AssessmentStep, string> = {
  'concentration_time': '🎯',
  'motivation_level': '💪',
  'past_successes': '🏆',
  'constraints': '⚠️',
  'social_preference': '👥'
}

// 평가 단계별 색상
export const assessmentStepColors: Record<AssessmentStep, string> = {
  'concentration_time': 'blue',
  'motivation_level': 'green',
  'past_successes': 'yellow',
  'constraints': 'red',
  'social_preference': 'purple'
} 