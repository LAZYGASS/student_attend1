"use client";

import { useEffect, useState } from 'react';
import { Student } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';

interface AttendanceLog {
    timestamp: string;
    name: string;
    status: string;
    note: string;
    className: string;
}

export default function AdminPage() {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to proxy Google Drive images
    const getPhotoUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('drive.google.com')) {
            return `/api/image?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        isDangerous: false,
        onConfirm: () => { },
    });

    // Add Student Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentClass, setNewStudentClass] = useState('영아부(0-3세)');
    const [newStudentPhoto, setNewStudentPhoto] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentName) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', newStudentName);
            formData.append('className', newStudentClass);
            if (newStudentPhoto) {
                formData.append('file', newStudentPhoto);
            }

            const res = await fetch('/api/students', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                alert('학생이 추가되었습니다.');
                setIsAddModalOpen(false);
                setNewStudentName('');
                setNewStudentPhoto(null);
                fetchData();
            } else {
                const data = await res.json();
                alert(`추가 실패: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStudent = async (student: Student) => {
        if (!confirm(`${student.name} 학생을 정말 삭제하시겠습니까? (복구 불가)`)) return;

        try {
            const res = await fetch('/api/students', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: student.name,
                    className: student.className
                }),
            });

            if (res.ok) {
                alert('삭제되었습니다.');
                setSelectedStudent(null);
                fetchData();
            } else {
                alert('삭제 실패');
            }
        } catch (error) {
            console.error(error);
            alert('오류 발생');
        }
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch both in parallel
            const [logsRes, studentsRes] = await Promise.all([
                fetch('/api/attendance'),
                fetch('/api/students')
            ]);

            const logsData = await logsRes.json();
            const studentsData = await studentsRes.json();

            if (logsData.records) setLogs(logsData.records);
            if (studentsData.students) setStudents(studentsData.students);

        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. Filter for Today
    const todayStr = new Date().toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });

    // Server timestamps are roughly "2024. 12. 23. ..."
    const todayDatePart = todayStr.split('. ').slice(0, 3).join('. ');
    const todayLogs = logs.filter(log => log.timestamp.includes(todayDatePart));

    // 2. Identify Attended Students (Check Latest Status)
    const latestStatusMap = new Map<string, AttendanceLog>();
    todayLogs.forEach(log => {
        // Since logs are newest-first, the first one we see is the latest
        if (!latestStatusMap.has(log.name)) {
            latestStatusMap.set(log.name, log);
        }
    });

    const attendedNames = new Set<string>();
    latestStatusMap.forEach((log, name) => {
        if (log.status !== '취소') {
            attendedNames.add(name);
        }
    });

    // 3. Group by Class
    const groupedData = students.reduce((acc, student) => {
        const className = student.className || '기타';
        if (!acc[className]) {
            acc[className] = { attended: [], notAttended: [] };
        }

        if (attendedNames.has(student.name)) {
            // Find the log for time (use the one from map)
            const log = latestStatusMap.get(student.name);
            acc[className].attended.push({ student, log });
        } else {
            acc[className].notAttended.push(student);
        }
        return acc;
    }, {} as Record<string, { attended: any[], notAttended: Student[] }>);

    const sortedClasses = Object.keys(groupedData).sort();

    // Stats
    const totalCount = students.length;
    const attendedCount = attendedNames.size;

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">📊 출석 현황 대시보드</h1>
                        <p className="text-slate-500 mt-1">{todayStr} 기준</p>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="/"
                            className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm font-bold flex items-center"
                        >
                            🏠 홈으로
                        </a>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-md font-bold flex items-center gap-2"
                        >
                            <span>➕</span> 학생 추가
                        </button>
                        <button
                            onClick={fetchData}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md font-bold"
                        >
                            새로고침
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center md:text-left">
                        <h3 className="text-slate-500 font-medium">총 원생</h3>
                        <p className="text-4xl font-black text-slate-800 mt-2">{totalCount}명</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100 text-center md:text-left">
                        <h3 className="text-emerald-700 font-medium">✅ 등원 완료</h3>
                        <p className="text-4xl font-black text-emerald-600 mt-2">{attendedCount}명</p>
                    </div>
                    <div className="bg-rose-50 p-6 rounded-2xl shadow-sm border border-rose-100 text-center md:text-left">
                        <h3 className="text-rose-700 font-medium">⏳ 미등원</h3>
                        <p className="text-4xl font-black text-rose-500 mt-2">{totalCount - attendedCount}명</p>
                    </div>
                </div>

                {/* Class Detail Sections */}
                {loading ? (
                    <div className="text-center py-20 text-slate-400">데이터를 불러오고 있습니다...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {sortedClasses.map(className => (
                            <div key={className} className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        <span>
                                            {className.includes('토끼') ? '🐰' :
                                                className.includes('기린') ? '🦒' :
                                                    className.includes('사자') ? '🦁' : '🏫'}
                                        </span>
                                        {className}
                                    </h2>
                                    <span className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-600">
                                        총 {groupedData[className].attended.length + groupedData[className].notAttended.length}명
                                    </span>
                                </div>

                                <div className="p-6 grid grid-cols-2 gap-6 divide-x divide-slate-100">
                                    {/* Attended Column */}
                                    <div className="pr-4">
                                        <h3 className="text-sm font-bold text-emerald-600 mb-3 flex items-center">
                                            ✅ 등원 ({groupedData[className].attended.length})
                                        </h3>
                                        <ul className="space-y-2">
                                            {groupedData[className].attended.length > 0 ? (
                                                groupedData[className].attended.map((item: any, idx: number) => (
                                                    <li
                                                        key={idx}
                                                        onClick={() => setSelectedStudent(item.student)}
                                                        className="flex items-center justify-between text-sm p-2 bg-emerald-50 rounded-lg text-slate-700 hover:bg-emerald-100 cursor-pointer transition-colors"
                                                    >
                                                        <span className="font-bold underline decoration-emerald-200 underline-offset-2">{item.student.name}</span>
                                                        <span className="text-xs text-emerald-600 font-mono">
                                                            {(item.log.timestamp.match(/\d{1,2}:\d{2}/) || [item.log.timestamp])[0]}
                                                        </span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-xs text-slate-400 italic py-2">아직 등원한 친구가 없어요</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Not Attended Column */}
                                    <div className="pl-4">
                                        <h3 className="text-sm font-bold text-rose-500 mb-3 flex items-center">
                                            ⏳ 미등원 ({groupedData[className].notAttended.length})
                                        </h3>
                                        <ul className="space-y-2">
                                            {groupedData[className].notAttended.length > 0 ? (
                                                groupedData[className].notAttended.map((student: Student) => (
                                                    <li
                                                        key={student.id}
                                                        onClick={() => setSelectedStudent(student)}
                                                        className="flex items-center text-sm p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors"
                                                    >
                                                        <span className="font-medium hover:text-slate-800 transition-colors">{student.name}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-xs text-emerald-600 font-bold py-2 bg-emerald-50 rounded px-2 text-center">전원 출석 완료! 🎉</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="relative h-48 bg-slate-100">
                            {selectedStudent.photoUrl ? (
                                <img
                                    src={getPhotoUrl(selectedStudent.photoUrl)}
                                    alt={selectedStudent.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'text-6xl');
                                        if (e.currentTarget.parentElement) {
                                            e.currentTarget.parentElement.innerText = selectedStudent.className.includes('토끼') ? '🐰' :
                                                selectedStudent.className.includes('기린') ? '🦒' :
                                                    selectedStudent.className.includes('사자') ? '🦁' : '🙂';
                                        }
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl">
                                    {selectedStudent.className.includes('토끼') ? '🐰' :
                                        selectedStudent.className.includes('기린') ? '🦒' :
                                            selectedStudent.className.includes('사자') ? '🦁' : '🙂'}
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold mb-2">
                                    {selectedStudent.className}
                                </span>
                                <h3 className="text-3xl font-black text-slate-800">{selectedStudent.name}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl mr-4 shadow-sm">📞</div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">비상연락망</p>
                                        <p className="text-slate-700 font-medium">010-1234-5678</p>
                                        {/* TODO: Add phone to Google Sheet columns */}
                                    </div>
                                </div>
                            </div>

                            {/* Status Toggle Buttons */}
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                {/* Attended Button */}
                                <button
                                    onClick={() => {
                                        if (attendedNames.has(selectedStudent.name)) return;

                                        setConfirmModal({
                                            isOpen: true,
                                            title: '등원 처리',
                                            message: `${selectedStudent.name} 어린이를 '등원' 상태로 변경하시겠습니까?`,
                                            isDangerous: false,
                                            onConfirm: async () => {
                                                try {
                                                    const res = await fetch('/api/attendance', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            name: selectedStudent.name,
                                                            className: selectedStudent.className,
                                                            status: '출석',
                                                            note: '관리자에 의한 상태 변경',
                                                        }),
                                                    });

                                                    if (res.ok) {
                                                        // alert('등원 처리되었습니다.'); // Optional: Toast preferred
                                                        setSelectedStudent(null);
                                                        fetchData();
                                                    } else {
                                                        alert('처리 실패');
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    alert('오류 발생');
                                                }
                                                closeConfirmModal();
                                            }
                                        });
                                    }}
                                    className={`py-4 rounded-xl font-bold text-lg transition-all ${attendedNames.has(selectedStudent.name)
                                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200'
                                        : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                                        }`}
                                >
                                    {attendedNames.has(selectedStudent.name) ? '✅ 등원 완료' : '등원 처리'}
                                </button>

                                {/* Not Attended Button */}
                                <button
                                    onClick={() => {
                                        if (!attendedNames.has(selectedStudent.name)) return;

                                        setConfirmModal({
                                            isOpen: true,
                                            title: '미등원(취소) 처리',
                                            message: `${selectedStudent.name} 어린이를 '미등원' 상태로 변경하시겠습니까?`,
                                            isDangerous: true,
                                            onConfirm: async () => {
                                                try {
                                                    const res = await fetch('/api/attendance', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            name: selectedStudent.name,
                                                            className: selectedStudent.className,
                                                            status: '취소',
                                                            note: '관리자에 의한 상태 변경',
                                                        }),
                                                    });

                                                    if (res.ok) {
                                                        setSelectedStudent(null);
                                                        fetchData();
                                                    } else {
                                                        alert('처리 실패');
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    alert('오류 발생');
                                                }
                                                closeConfirmModal();
                                            }
                                        });
                                    }}
                                    className={`py-4 rounded-xl font-bold text-lg transition-all ${!attendedNames.has(selectedStudent.name)
                                        ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-200'
                                        : 'bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500'
                                        }`}
                                >
                                    {!attendedNames.has(selectedStudent.name) ? '⏳ 미등원' : '등원 취소'}
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="w-full mt-4 py-3 text-slate-400 hover:text-slate-600 font-medium transition-colors"
                            >
                                닫기
                            </button>

                            <button
                                onClick={() => handleDeleteStudent(selectedStudent)}
                                className="w-full mt-2 py-3 text-rose-400 hover:text-rose-600 font-medium transition-colors text-sm"
                            >
                                🗑️ 학생 삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">새 친구 등록</h2>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={newStudentName}
                                    onChange={e => setNewStudentName(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="이름을 입력하세요"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">반</label>
                                <select
                                    value={newStudentClass}
                                    onChange={e => setNewStudentClass(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="영아부(0-3세)">영아부(0-3세)</option>
                                    <option value="유치부(4-7세)_토끼반">유치부(4-7세)_토끼반</option>
                                    <option value="유치부(4-7세)_기린반">유치부(4-7세)_기린반</option>
                                    <option value="유치부(4-7세)_사자반">유치부(4-7세)_사자반</option>
                                    <option value="초등부(8-13세)">초등부(8-13세)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">사진 (선택)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setNewStudentPhoto(e.target.files?.[0] || null)}
                                    className="w-full p-2 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? '등록 중...' : '등록하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Global Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                isDangerous={confirmModal.isDangerous}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirmModal}
            />
        </main>
    );
}
