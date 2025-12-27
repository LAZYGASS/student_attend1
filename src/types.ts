export interface Student {
    id: string;
    name: string;
    className: string;
    photoUrl: string;
}

export interface AttendanceRecord {
    name: string;
    className: string;
    status: '출석' | '취소';
    note?: string;
}
