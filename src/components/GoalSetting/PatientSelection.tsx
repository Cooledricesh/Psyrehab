import React from 'react';
import { User, Loader2 } from 'lucide-react';

interface Patient {
  id: string;
  patient_identifier: string;
  full_name: string;
  birth_date: string;
  gender: string;
  diagnosis: string;
  status: string;
}

interface PatientSelectionProps {
  patients: Patient[];
  patientsLoading: boolean;
  onSelectPatient: (patientId: string) => void;
}

const PatientSelection: React.FC<PatientSelectionProps> = ({
  patients,
  patientsLoading,
  onSelectPatient
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">회원을 선택하세요</h2>
      
      {patientsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-3 text-gray-600">회원 목록을 불러오는 중...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {patients?.map((patient) => (
            <button
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{patient.full_name}</div>
                  <div className="text-sm text-gray-500">IDNO: {patient.patient_identifier}</div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  목표 설정 대기
                </span>
              </div>
            </button>
          ))}
          
          {patients?.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">목표 설정이 필요한 회원이 없습니다</h3>
              <p className="text-sm text-gray-500">
                새로운 회원을 등록하거나, 기존 회원의 상태를 '목표 설정 대기(pending)'로 변경해주세요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSelection;