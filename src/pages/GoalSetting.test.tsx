import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Target, History, AlertTriangle, Users, ChevronRight, Check, Loader2, User, Calendar } from 'lucide-react';
// import ReactMarkdown from 'react-markdown'; // 임시 제거
import { useQuery, useMutation } from '@tanstack/react-query';
import { PatientService } from '@/services/patients';
import { supabase } from '@/lib/supabase';
import useAIResponseParser from '@/hooks/useAIResponseParser';
import { useAIRecommendationByAssessment } from '@/hooks/useAIRecommendations';
import { ENV } from '@/lib/env';
import { eventBus, EVENTS } from '@/lib/eventBus';

interface AssessmentFormData {
  focusTime: string;
  motivationLevel: number;
  pastSuccesses: string[];
  pastSuccessesOther: string;
  constraints: string[];
  constraintsOther: string;
  socialPreference: string;
}

// 아래에 원본 코드의 나머지 부분을 그대로 복사...
