"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminLoginModalProps {
    onClose: () => void;
}

export default function AdminLoginModal({ onClose }: AdminLoginModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '0000') {
            router.push('/admin');
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">🔐 관리자 접속</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            placeholder="비밀번호 (0000)"
                            className="w-full rounded-xl border border-gray-300 p-4 text-lg text-center font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm mt-2 text-center">비밀번호가 틀렸습니다.</p>}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 hover:bg-gray-200"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
                        >
                            접속
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
