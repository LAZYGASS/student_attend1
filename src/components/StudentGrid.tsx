import { useState } from 'react';
import { Student } from '@/types';
import Image from 'next/image';

interface StudentGridProps {
    students: Student[];
    onSelect: (student: Student) => void;
}

export default function StudentGrid({ students, onSelect }: StudentGridProps) {
    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    // Group students by className to get the list of classes
    const groupedStudents = students.reduce((groups, student) => {
        const className = student.className || '기타';
        if (!groups[className]) {
            groups[className] = [];
        }
        groups[className].push(student);
        return groups;
    }, {} as Record<string, Student[]>);

    const sortedClassNames = Object.keys(groupedStudents).sort();

    // View 1: Class Selection
    if (!selectedClass) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-in fade-in zoom-in duration-300">
                <h2 className="text-4xl font-black text-gray-800 mb-8 border-b-8 border-yellow-300 px-4 transform -rotate-2">
                    어떤 반인가요? 👇
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl px-6">
                    {sortedClassNames.map((className) => (
                        <button
                            key={className}
                            onClick={() => setSelectedClass(className)}
                            className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] shadow-xl border-4 border-white hover:border-yellow-400 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 group"
                        >
                            <span className="text-8xl mb-6 group-hover:scale-125 transition-transform duration-300 filter drop-shadow-md">
                                {className.includes('토끼') ? '🐰' :
                                    className.includes('기린') ? '🦒' :
                                        className.includes('사자') ? '🦁' : '🏫'}
                            </span>
                            <span className="text-4xl font-black text-gray-800 group-hover:text-blue-600 tracking-tight">
                                {className}
                            </span>
                            <span className="mt-4 text-2xl font-bold text-gray-400 bg-gray-100 px-4 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-500">
                                {groupedStudents[className].length}명
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // View 2: Student List (Specific Class)
    return (
        <div className="pb-20 animate-in slide-in-from-right duration-300">
            <div className="flex items-center mb-6 px-4">
                <button
                    onClick={() => setSelectedClass(null)}
                    className="flex items-center px-4 py-2 bg-white rounded-xl shadow-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors mr-4"
                >
                    <span className="text-lg mr-2">←</span>
                    다른 반 고르기
                </button>
                <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">
                    {selectedClass} 친구들 ({groupedStudents[selectedClass].length}명)
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-4">
                {groupedStudents[selectedClass].map((student) => (
                    <button
                        key={student.id + student.name}
                        onClick={() => onSelect(student)}
                        className="group relative flex flex-col items-center overflow-hidden rounded-2xl bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
                    >
                        <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-full bg-gray-100 border-4 border-transparent group-hover:border-blue-200 transaction-colors">
                            {student.photoUrl ? (
                                <img
                                    src={student.photoUrl}
                                    alt={student.name}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">
                                    ☺
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600">
                            {student.name}
                        </h3>
                        {/* Class name removed from card as context is clear */}
                    </button>
                ))}
            </div>
        </div>
    );
}
