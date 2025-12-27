"use client";

import { useEffect, useState } from 'react';
import StudentGrid from '@/components/StudentGrid';
import AdminLoginModal from '@/components/AdminLoginModal';
import AttendanceModal from '@/components/AttendanceModal';
import { Student } from '@/types';

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state (simple)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to load students', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedStudent.name,
          className: selectedStudent.className,
          status: '출석',
          note: '',
        }),
      });

      if (res.ok) {
        setToastMessage(`${selectedStudent.name} 어린이 출석 완료!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert('출석 처리에 실패했습니다. 선생님께 문의해주세요.');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <main className="min-h-screen bg-sky-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md">
        <h1 className="text-2xl font-bold text-sky-600">
          💒 교회 학교 출석 관리
        </h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto py-8 flex-1">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"></div>
          </div>
        ) : (
          <StudentGrid students={students} onSelect={handleStudentClick} />
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400">
        <button
          onClick={() => setIsAdminModalOpen(true)}
          className="text-xs hover:text-gray-600 transition-colors"
        >
          🔒 관리자 모드
        </button>
      </footer>

      {/* Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        student={selectedStudent}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />

      {/* Admin Login Modal */}
      {isAdminModalOpen && (
        <AdminLoginModal onClose={() => setIsAdminModalOpen(false)} />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-full bg-green-500 px-8 py-4 text-2xl font-bold text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          ✨ {toastMessage}
        </div>
      )}
    </main>
  );
}
