import { AssessmentFormConfig, AssessmentStep } from '@/types/assessment'

// 5단계 평가 폼 설정
export const ASSESSMENT_FORM_CONFIGS: Record<AssessmentStep, AssessmentFormConfig> = {
  // 1단계: 집중 시간 평가
  concentration_time: {
    step: 'concentration_time',
    title: '집중 시간 평가',
    description: '환자의 집중력과 관련된 정보를 수집합니다. 환경, 시간대, 지속 시간 등을 평가합니다.',
    fields: [
      {
        id: 'duration',
        type: 'number',
        label: '집중 가능한 시간',
        placeholder: '분 단위로 입력하세요',
        required: true,
        min: 1,
        max: 480, // 8시간
        step: 1,
        validation: {
          message: '1분 이상 480분 이하로 입력해주세요'
        }
      },
      {
        id: 'environment',
        type: 'radio',
        label: '선호하는 집중 환경',
        required: true,
        options: [
          { 
            value: 'quiet', 
            label: '조용한 환경', 
            description: '완전히 조용하거나 최소한의 소음만 있는 환경' 
          },
          { 
            value: 'moderate', 
            label: '적당한 환경', 
            description: '일상적인 배경 소음이 있는 환경' 
          },
          { 
            value: 'noisy', 
            label: '활기찬 환경', 
            description: '다소 시끄럽거나 활발한 환경' 
          }
        ]
      },
      {
        id: 'time_of_day',
        type: 'radio',
        label: '집중이 가장 잘 되는 시간대',
        required: true,
        options: [
          { value: 'morning', label: '오전 (6시-12시)', description: '아침 일찍부터 정오까지' },
          { value: 'afternoon', label: '오후 (12시-18시)', description: '점심시간부터 저녁까지' },
          { value: 'evening', label: '저녁 (18시-24시)', description: '저녁부터 밤늦게까지' }
        ]
      },
      {
        id: 'preferred_environment',
        type: 'multiselect',
        label: '집중에 도움이 되는 환경 요소 (복수 선택 가능)',
        options: [
          { value: 'natural_light', label: '자연광' },
          { value: 'artificial_light', label: '인공조명' },
          { value: 'background_music', label: '배경음악' },
          { value: 'silence', label: '완전한 정적' },
          { value: 'comfortable_temperature', label: '적절한 온도' },
          { value: 'familiar_space', label: '익숙한 공간' },
          { value: 'organized_space', label: '정리된 공간' },
          { value: 'personal_items', label: '개인 소지품' }
        ]
      },
      {
        id: 'distraction_factors',
        type: 'multiselect',
        label: '집중을 방해하는 요소들 (복수 선택 가능)',
        options: [
          { value: 'noise', label: '소음' },
          { value: 'visual_distractions', label: '시각적 방해 요소' },
          { value: 'people_movement', label: '사람들의 움직임' },
          { value: 'phone_notifications', label: '휴대폰 알림' },
          { value: 'uncomfortable_seating', label: '불편한 자세' },
          { value: 'hunger_thirst', label: '배고픔/갈증' },
          { value: 'worry_anxiety', label: '걱정/불안' },
          { value: 'fatigue', label: '피로감' }
        ]
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '추가 메모',
        placeholder: '집중력과 관련된 추가 정보나 특이사항을 기록해주세요',
        required: false
      }
    ],
    validation: {
      required_fields: ['duration', 'environment', 'time_of_day'],
      conditional_logic: [
        {
          field: 'duration',
          condition: 'greater_than 120',
          action: 'show',
          target: ['break_preferences']
        }
      ]
    }
  },

  // 2단계: 동기 수준 평가
  motivation_level: {
    step: 'motivation_level',
    title: '동기 수준 평가',
    description: '환자의 동기 부여 상태와 목표 의식을 평가합니다.',
    fields: [
      {
        id: 'goal_clarity',
        type: 'scale',
        label: '목표 명확성',
        required: true,
        min: 1,
        max: 5,
        scaleLabels: {
          min: '목표가 전혀 명확하지 않음',
          max: '목표가 매우 명확함',
          steps: [
            '전혀 명확하지 않음',
            '조금 명확하지 않음', 
            '보통',
            '꽤 명확함',
            '매우 명확함'
          ]
        }
      },
      {
        id: 'effort_willingness',
        type: 'scale',
        label: '노력 의지',
        required: true,
        min: 1,
        max: 5,
        scaleLabels: {
          min: '노력할 의지가 전혀 없음',
          max: '노력할 의지가 매우 강함',
          steps: [
            '전혀 없음',
            '조금 있음',
            '보통',
            '꽤 강함',
            '매우 강함'
          ]
        }
      },
      {
        id: 'confidence_level',
        type: 'scale',
        label: '자신감 수준',
        required: true,
        min: 1,
        max: 5,
        scaleLabels: {
          min: '전혀 자신이 없음',
          max: '매우 자신 있음',
          steps: [
            '전혀 없음',
            '조금 없음',
            '보통',
            '꽤 있음',
            '매우 있음'
          ]
        }
      },
      {
        id: 'external_support',
        type: 'scale',
        label: '외부 지원 정도',
        required: true,
        min: 1,
        max: 5,
        scaleLabels: {
          min: '전혀 지원받지 못함',
          max: '충분히 지원받음',
          steps: [
            '전혀 없음',
            '조금 있음',
            '보통',
            '꽤 있음',
            '충분함'
          ]
        }
      },
      {
        id: 'motivation_sources',
        type: 'multiselect',
        label: '동기의 주요 원천 (복수 선택 가능)',
        options: [
          { value: 'personal_growth', label: '개인적 성장' },
          { value: 'family_expectations', label: '가족의 기대' },
          { value: 'career_advancement', label: '경력 발전' },
          { value: 'financial_security', label: '경제적 안정' },
          { value: 'social_recognition', label: '사회적 인정' },
          { value: 'helping_others', label: '타인 도움' },
          { value: 'challenge_completion', label: '도전 완수' },
          { value: 'skill_mastery', label: '기술 습득' }
        ]
      },
      {
        id: 'motivation_barriers',
        type: 'multiselect',
        label: '동기를 저해하는 요인들 (복수 선택 가능)',
        options: [
          { value: 'fear_of_failure', label: '실패에 대한 두려움' },
          { value: 'lack_of_resources', label: '자원 부족' },
          { value: 'time_constraints', label: '시간 제약' },
          { value: 'health_issues', label: '건강 문제' },
          { value: 'lack_of_support', label: '지원 부족' },
          { value: 'unclear_expectations', label: '불분명한 기대' },
          { value: 'past_disappointments', label: '과거 실망 경험' },
          { value: 'low_self_esteem', label: '낮은 자존감' }
        ]
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '동기 관련 추가 정보',
        placeholder: '동기 부여와 관련된 추가 정보나 특이사항을 기록해주세요',
        required: false
      }
    ],
    validation: {
      required_fields: ['goal_clarity', 'effort_willingness', 'confidence_level', 'external_support']
    }
  },

  // 3단계: 과거 성공 경험 평가
  past_successes: {
    step: 'past_successes',
    title: '과거 성공 경험 평가',
    description: '환자의 과거 성취와 성공 경험을 파악하여 강점을 식별합니다.',
    fields: [
      {
        id: 'achievement_areas',
        type: 'checkbox',
        label: '성취를 경험한 분야들 (복수 선택 가능)',
        required: true,
        options: [
          { value: 'academic', label: '학업 성취', description: '학교, 시험, 학습 관련 성공' },
          { value: 'work', label: '직업적 성취', description: '업무, 경력, 프로젝트 관련 성공' },
          { value: 'social', label: '사회적 성취', description: '인간관계, 리더십, 팀워크 관련 성공' },
          { value: 'creative', label: '창작 활동', description: '예술, 창작, 혁신 관련 성공' },
          { value: 'physical', label: '신체적 성취', description: '운동, 건강, 체력 관련 성공' },
          { value: 'personal', label: '개인적 성장', description: '자기계발, 습관 형성, 목표 달성' },
          { value: 'volunteer', label: '봉사 활동', description: '자원봉사, 사회 기여 관련 성공' },
          { value: 'hobby', label: '취미 활동', description: '개인적 관심사, 여가 활동 관련 성공' }
        ]
      },
      {
        id: 'most_significant_achievement',
        type: 'textarea',
        label: '가장 의미 있는 성취 경험',
        placeholder: '가장 자랑스럽고 의미 있었던 성공 경험을 구체적으로 설명해주세요',
        required: true,
        condition: {
          field: 'achievement_areas',
          operator: 'not_equals',
          value: []
        }
      },
      {
        id: 'achievement_factors',
        type: 'multiselect',
        label: '성공에 기여한 주요 요인들 (복수 선택 가능)',
        options: [
          { value: 'persistence', label: '끈기와 인내' },
          { value: 'planning', label: '체계적 계획' },
          { value: 'hard_work', label: '노력과 헌신' },
          { value: 'creativity', label: '창의적 사고' },
          { value: 'teamwork', label: '팀워크' },
          { value: 'learning', label: '지속적 학습' },
          { value: 'mentorship', label: '멘토의 도움' },
          { value: 'opportunity', label: '좋은 기회' },
          { value: 'skills', label: '특별한 재능/기술' },
          { value: 'support', label: '주변의 지원' }
        ],
        condition: {
          field: 'achievement_areas',
          operator: 'not_equals',
          value: []
        }
      },
      {
        id: 'learning_from_success',
        type: 'textarea',
        label: '성공 경험에서 배운 교훈',
        placeholder: '과거 성공 경험을 통해 배운 중요한 교훈이나 깨달음을 적어주세요',
        condition: {
          field: 'achievement_areas',
          operator: 'not_equals',
          value: []
        }
      },
      {
        id: 'skills_developed',
        type: 'multiselect',
        label: '성공을 통해 개발된 핵심 능력들 (복수 선택 가능)',
        options: [
          { value: 'problem_solving', label: '문제 해결 능력' },
          { value: 'communication', label: '의사소통 능력' },
          { value: 'leadership', label: '리더십' },
          { value: 'time_management', label: '시간 관리' },
          { value: 'stress_management', label: '스트레스 관리' },
          { value: 'adaptability', label: '적응력' },
          { value: 'critical_thinking', label: '비판적 사고' },
          { value: 'collaboration', label: '협력 능력' },
          { value: 'self_discipline', label: '자기 통제력' },
          { value: 'resilience', label: '회복력' }
        ]
      },
      {
        id: 'transferable_strategies',
        type: 'textarea',
        label: '현재 상황에 적용 가능한 전략',
        placeholder: '과거 성공 경험에서 사용한 전략 중 현재 재활이나 치료에 활용할 수 있는 것들을 적어주세요',
        condition: {
          field: 'achievement_areas',
          operator: 'not_equals',
          value: []
        }
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '추가 성공 경험',
        placeholder: '기타 성공 경험이나 특이사항을 기록해주세요',
        required: false
      }
    ],
    validation: {
      required_fields: ['achievement_areas', 'most_significant_achievement'],
      conditional_logic: [
        {
          field: 'achievement_areas',
          condition: 'not_equals []',
          action: 'require',
          target: ['most_significant_achievement']
        }
      ]
    }
  },

  // 4단계: 제약 조건 평가
  constraints: {
    step: 'constraints',
    title: '제약 조건 평가',
    description: '재활이나 치료 과정에서 고려해야 할 제약 사항과 장애 요소를 파악합니다.',
    fields: [
      {
        id: 'physical_limitations',
        type: 'multiselect',
        label: '신체적 제약 사항 (복수 선택 가능)',
        options: [
          { value: 'mobility_issues', label: '이동성 제한' },
          { value: 'chronic_pain', label: '만성 통증' },
          { value: 'fatigue', label: '만성 피로' },
          { value: 'vision_problems', label: '시력 문제' },
          { value: 'hearing_problems', label: '청력 문제' },
          { value: 'fine_motor_skills', label: '정밀 운동 기능 저하' },
          { value: 'gross_motor_skills', label: '전신 운동 기능 저하' },
          { value: 'balance_issues', label: '균형감각 문제' },
          { value: 'coordination_problems', label: '협응 능력 저하' },
          { value: 'none', label: '해당 없음' }
        ]
      },
      {
        id: 'cognitive_challenges',
        type: 'multiselect',
        label: '인지적 어려움 (복수 선택 가능)',
        options: [
          { value: 'memory_problems', label: '기억력 저하' },
          { value: 'attention_deficit', label: '주의집중 어려움' },
          { value: 'processing_speed', label: '정보처리 속도 저하' },
          { value: 'executive_function', label: '실행 기능 저하' },
          { value: 'language_difficulties', label: '언어 이해/표현 어려움' },
          { value: 'reading_comprehension', label: '읽기 이해 어려움' },
          { value: 'mathematical_skills', label: '수리 능력 저하' },
          { value: 'abstract_thinking', label: '추상적 사고 어려움' },
          { value: 'none', label: '해당 없음' }
        ]
      },
      {
        id: 'emotional_barriers',
        type: 'multiselect',
        label: '정서적 장벽 (복수 선택 가능)',
        options: [
          { value: 'anxiety', label: '불안감' },
          { value: 'depression', label: '우울감' },
          { value: 'low_self_esteem', label: '낮은 자존감' },
          { value: 'fear_of_failure', label: '실패에 대한 두려움' },
          { value: 'anger_issues', label: '분노 조절 어려움' },
          { value: 'mood_swings', label: '기분 변화' },
          { value: 'social_anxiety', label: '사회불안' },
          { value: 'trauma_effects', label: '트라우마 영향' },
          { value: 'grief', label: '상실감/슬픔' },
          { value: 'none', label: '해당 없음' }
        ]
      },
      {
        id: 'social_obstacles',
        type: 'multiselect',
        label: '사회적 장벽 (복수 선택 가능)',
        options: [
          { value: 'lack_of_support', label: '사회적 지원 부족' },
          { value: 'family_conflicts', label: '가족 갈등' },
          { value: 'social_isolation', label: '사회적 고립' },
          { value: 'stigma', label: '사회적 편견' },
          { value: 'communication_barriers', label: '의사소통 장벽' },
          { value: 'cultural_differences', label: '문화적 차이' },
          { value: 'language_barriers', label: '언어 장벽' },
          { value: 'workplace_issues', label: '직장 내 문제' },
          { value: 'none', label: '해당 없음' }
        ]
      },
      {
        id: 'environmental_factors',
        type: 'multiselect',
        label: '환경적 제약 요소 (복수 선택 가능)',
        options: [
          { value: 'transportation', label: '교통편 문제' },
          { value: 'accessibility', label: '접근성 부족' },
          { value: 'noise_pollution', label: '소음 공해' },
          { value: 'air_quality', label: '공기질 문제' },
          { value: 'housing_conditions', label: '주거 환경 문제' },
          { value: 'weather_sensitivity', label: '날씨 민감성' },
          { value: 'geographic_isolation', label: '지리적 고립' },
          { value: 'unsafe_neighborhood', label: '불안전한 지역' },
          { value: 'none', label: '해당 없음' }
        ]
      },
      {
        id: 'financial_constraints',
        type: 'radio',
        label: '경제적 제약 정도',
        required: true,
        options: [
          { value: 'none', label: '제약 없음', description: '경제적 문제가 치료에 영향을 주지 않음' },
          { value: 'mild', label: '경미한 제약', description: '일부 비용 부담이 있으나 치료 지속 가능' },
          { value: 'moderate', label: '중간 정도 제약', description: '비용 때문에 일부 치료 옵션이 제한됨' },
          { value: 'severe', label: '심각한 제약', description: '경제적 문제로 인해 치료에 큰 어려움이 있음' }
        ]
      },
      {
        id: 'time_limitations',
        type: 'multiselect',
        label: '시간적 제약 요소 (복수 선택 가능)',
        options: [
          { value: 'work_schedule', label: '직장 근무 시간' },
          { value: 'caregiving_duties', label: '돌봄 의무' },
          { value: 'childcare', label: '육아 책임' },
          { value: 'other_appointments', label: '기타 의료 약속' },
          { value: 'education_commitments', label: '교육/학습 일정' },
          { value: 'travel_time', label: '이동 시간' },
          { value: 'energy_levels', label: '에너지 수준 변화' },
          { value: 'seasonal_factors', label: '계절적 요인' },
          { value: 'none', label: '해당 없음' }
        ]
      },
      {
        id: 'severity_rating',
        type: 'scale',
        label: '전반적인 제약 정도',
        required: true,
        min: 1,
        max: 5,
        scaleLabels: {
          min: '제약이 거의 없음',
          max: '제약이 매우 심함',
          steps: [
            '거의 없음',
            '경미함',
            '보통',
            '심함',
            '매우 심함'
          ]
        }
      },
      {
        id: 'coping_strategies',
        type: 'textarea',
        label: '현재 사용하고 있는 대처 방법',
        placeholder: '제약 사항들을 극복하기 위해 현재 사용하고 있는 방법들을 설명해주세요',
        required: false
      },
      {
        id: 'support_needs',
        type: 'textarea',
        label: '필요한 지원 사항',
        placeholder: '제약 사항을 해결하기 위해 필요한 지원이나 도움을 구체적으로 적어주세요',
        required: false
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '추가 제약 사항',
        placeholder: '기타 제약 사항이나 특이사항을 기록해주세요',
        required: false
      }
    ],
    validation: {
      required_fields: ['financial_constraints', 'severity_rating']
    }
  },

  // 5단계: 사회적 선호도 평가
  social_preference: {
    step: 'social_preference',
    title: '사회적 선호도 평가',
    description: '환자의 사회적 상호작용 선호도와 참여 스타일을 파악합니다.',
    fields: [
      {
        id: 'preferred_group_size',
        type: 'radio',
        label: '선호하는 그룹 크기',
        required: true,
        options: [
          { 
            value: 'individual', 
            label: '개별 활동', 
            description: '1:1 또는 혼자서 하는 활동 선호' 
          },
          { 
            value: 'small', 
            label: '소그룹 (2-4명)', 
            description: '소수의 인원과 함께하는 활동 선호' 
          },
          { 
            value: 'medium', 
            label: '중그룹 (5-10명)', 
            description: '중간 규모의 그룹 활동 선호' 
          },
          { 
            value: 'large', 
            label: '대그룹 (10명 이상)', 
            description: '큰 규모의 그룹 활동 선호' 
          },
          { 
            value: 'flexible', 
            label: '유연함', 
            description: '상황에 따라 다양한 크기의 그룹 참여 가능' 
          }
        ]
      },
      {
        id: 'interaction_style',
        type: 'radio',
        label: '선호하는 상호작용 스타일',
        required: true,
        options: [
          { 
            value: 'active', 
            label: '적극적 참여', 
            description: '활발하게 의견을 제시하고 참여하는 것을 선호' 
          },
          { 
            value: 'moderate', 
            label: '적당한 참여', 
            description: '필요시에만 참여하고 대부분 관찰하는 것을 선호' 
          },
          { 
            value: 'observer', 
            label: '관찰자', 
            description: '주로 듣고 관찰하며 최소한의 참여만 선호' 
          },
          { 
            value: 'leader', 
            label: '리더 역할', 
            description: '그룹을 이끌고 방향을 제시하는 역할을 선호' 
          },
          { 
            value: 'supporter', 
            label: '지원자 역할', 
            description: '다른 사람들을 돕고 지원하는 역할을 선호' 
          }
        ]
      },
      {
        id: 'communication_preference',
        type: 'radio',
        label: '선호하는 의사소통 방식',
        required: true,
        options: [
          { value: 'verbal', label: '구두 의사소통', description: '말로 표현하고 대화하는 것을 선호' },
          { value: 'written', label: '서면 의사소통', description: '글로 쓰거나 읽는 것을 통한 소통 선호' },
          { value: 'non_verbal', label: '비언어적 의사소통', description: '몸짓, 표정, 행동을 통한 소통 선호' },
          { value: 'mixed', label: '혼합 방식', description: '상황에 따라 다양한 방식을 유연하게 사용' }
        ]
      },
      {
        id: 'comfort_with_strangers',
        type: 'scale',
        label: '낯선 사람과의 상호작용 편안함 정도',
        required: true,
        min: 1,
        max: 5,
        scaleLabels: {
          min: '매우 불편함',
          max: '매우 편안함',
          steps: [
            '매우 불편함',
            '조금 불편함',
            '보통',
            '조금 편안함',
            '매우 편안함'
          ]
        }
      },
      {
        id: 'collaboration_willingness',
        type: 'scale',
        label: '협력 활동 참여 의지',
        required: true,
        min: 1,
        max: 5,
        scaleLabels: {
          min: '전혀 원하지 않음',
          max: '매우 원함',
          steps: [
            '전혀 원하지 않음',
            '별로 원하지 않음',
            '보통',
            '어느 정도 원함',
            '매우 원함'
          ]
        }
      },
      {
        id: 'support_type_needed',
        type: 'multiselect',
        label: '필요한 사회적 지원 유형 (복수 선택 가능)',
        options: [
          { value: 'emotional_support', label: '정서적 지원', description: '공감, 격려, 위로' },
          { value: 'informational_support', label: '정보적 지원', description: '조언, 정보 제공, 안내' },
          { value: 'instrumental_support', label: '도구적 지원', description: '실질적 도움, 자원 제공' },
          { value: 'companionship', label: '동반자 지원', description: '함께 있어주기, 소속감' },
          { value: 'motivational_support', label: '동기부여 지원', description: '격려, 동기 유발, 목표 설정 도움' },
          { value: 'skill_guidance', label: '기술 지도', description: '방법 알려주기, 실습 도움' },
          { value: 'accountability', label: '책임감 지원', description: '점검, 피드백, 약속 이행 도움' },
          { value: 'advocacy', label: '옹호 지원', description: '대변, 권익 보호, 중재' }
        ]
      },
      {
        id: 'social_anxiety_factors',
        type: 'multiselect',
        label: '사회적 불안을 유발하는 요소들 (복수 선택 가능)',
        options: [
          { value: 'large_crowds', label: '많은 사람들' },
          { value: 'public_speaking', label: '공개 발언' },
          { value: 'being_judged', label: '평가받는 상황' },
          { value: 'new_environments', label: '새로운 환경' },
          { value: 'authority_figures', label: '권위자 인물' },
          { value: 'conflict_situations', label: '갈등 상황' },
          { value: 'performance_pressure', label: '성과 압박' },
          { value: 'personal_disclosure', label: '개인정보 공개' },
          { value: 'none', label: '해당 없음' }
        ]
      },
      {
        id: 'preferred_social_activities',
        type: 'multiselect',
        label: '선호하는 사회적 활동 유형 (복수 선택 가능)',
        options: [
          { value: 'discussion_groups', label: '토론/대화 모임' },
          { value: 'skill_workshops', label: '기술 워크숍' },
          { value: 'creative_activities', label: '창작 활동' },
          { value: 'physical_activities', label: '신체 활동' },
          { value: 'educational_sessions', label: '교육 세션' },
          { value: 'social_games', label: '사회적 게임' },
          { value: 'cultural_events', label: '문화 행사' },
          { value: 'volunteer_work', label: '봉사 활동' },
          { value: 'peer_support_groups', label: '동료 지원 그룹' },
          { value: 'informal_gatherings', label: '비공식적 모임' }
        ]
      },
      {
        id: 'cultural_considerations',
        type: 'textarea',
        label: '문화적 고려사항',
        placeholder: '사회적 상호작용에 영향을 줄 수 있는 문화적, 종교적, 가족적 배경이나 가치관을 설명해주세요',
        required: false
      },
      {
        id: 'social_goals',
        type: 'textarea',
        label: '사회적 목표',
        placeholder: '사회적 상호작용이나 관계 개선과 관련해서 달성하고 싶은 목표를 적어주세요',
        required: false
      },
      {
        id: 'notes',
        type: 'textarea',
        label: '추가 사회적 선호사항',
        placeholder: '기타 사회적 선호도나 특이사항을 기록해주세요',
        required: false
      }
    ],
    validation: {
      required_fields: [
        'preferred_group_size', 
        'interaction_style', 
        'communication_preference', 
        'comfort_with_strangers', 
        'collaboration_willingness'
      ]
    }
  }
}

// 폼 진행 순서 정의
export const ASSESSMENT_STEP_ORDER: AssessmentStep[] = [
  'concentration_time',
  'motivation_level', 
  'past_successes',
  'constraints',
  'social_preference'
]

// 각 단계별 예상 완료 시간 (분)
export const ASSESSMENT_STEP_DURATION: Record<AssessmentStep, number> = {
  concentration_time: 8,
  motivation_level: 10,
  past_successes: 15,
  constraints: 12,
  social_preference: 10
}

// 폼 유효성 검사 규칙
export const ASSESSMENT_FORM_VALIDATION = {
  // 전체 폼 완료를 위한 최소 요구사항
  minimum_completion_percentage: 80,
  
  // 필수 단계들 (적어도 이 단계들은 완료되어야 함)
  required_steps: ['concentration_time', 'motivation_level'] as AssessmentStep[],
  
  // 단계별 최소 필수 필드 비율
  step_minimum_completion: {
    concentration_time: 0.6, // 60% 이상 필드 완료
    motivation_level: 0.75,  // 75% 이상 필드 완료  
    past_successes: 0.5,     // 50% 이상 필드 완료
    constraints: 0.4,        // 40% 이상 필드 완료
    social_preference: 0.7   // 70% 이상 필드 완료
  },
  
  // 데이터 품질 검사 규칙
  data_quality_checks: {
    // 텍스트 필드 최소 글자 수
    min_text_length: {
      most_significant_achievement: 20,
      learning_from_success: 15,
      coping_strategies: 10,
      support_needs: 10
    },
    
    // 스케일 필드 일관성 검사 (극단값 주의)
    scale_consistency_check: true,
    
    // 선택형 필드 최소 선택 개수
    min_selections: {
      achievement_areas: 1,
      motivation_sources: 1,
      support_type_needed: 1
    }
  }
}

// 접근성 설정
export const ASSESSMENT_ACCESSIBILITY_CONFIG = {
  // 키보드 네비게이션 지원
  keyboard_navigation: true,
  
  // 화면 읽기 프로그램 지원
  screen_reader_support: true,
  
  // 고대비 모드 지원
  high_contrast_mode: true,
  
  // 폰트 크기 조절 지원
  font_size_adjustment: true,
  
  // 색상 외 추가 시각적 표시
  non_color_indicators: true,
  
  // 자동 저장 간격 (초)
  auto_save_interval: 30,
  
  // 세션 만료 경고 시간 (분)
  session_warning_time: 5
} 