"use client";

import { useEffect, useState } from 'react';
import { Student } from '@/types';
import { Check, X } from 'lucide-react';

interface AttendanceModalProps {
    student: Student | null;
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
    isLoading: boolean;
}

export default function AttendanceModal({ student, onConfirm, onCancel, isOpen, isLoading }: AttendanceModalProps) {
    const [timeLeft, setTimeLeft] = useState(10);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(10);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onCancel(); // Auto cancel
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen, onCancel]);

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
                    <span className="text-blue-600">{student.name}</span> 님<br />
                    출석을 하시겠습니까?
                </h2>

                <div className="mb-8 flex justify-center">
                    {/* Simple photo preview using standard img for speed, or reusing next/image if passed */}
                    {student.photoUrl && (
                        <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="h-48 w-48 rounded-full object-cover border-4 border-blue-100 shadow-md"
                        />
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-4 text-xl font-bold text-gray-600 transition hover:bg-gray-200 active:scale-95"
                    >
                        <X size={28} />
                        아니요
                        <span className="text-sm font-normal text-gray-400">({timeLeft}초)</span>
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-95 disabled:bg-blue-400"
                    >
                        {isLoading ? (
                            <span className="animate-spin text-2xl">↻</span>
                        ) : (
                            <>
                                <Check size={28} />
                                네, 출석!
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
