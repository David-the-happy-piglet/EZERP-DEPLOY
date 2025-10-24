export const Role = {
    ADMIN: 'ADMIN',
    MKT: 'MKT',
    MACHINING: 'MACHINING',
    QC: 'QC',
    CHEMIST: 'CHEMIST',
    FINANCE: 'FINANCE',
    HR: 'HR',
    GUEST: 'GUEST'
} as const;

const chineseToCodeMap: Record<string, string> = {
    '管理员': Role.ADMIN,
    '营销': Role.MKT,
    '机加工': Role.MACHINING,
    '质检': Role.QC,
    '镀金': Role.CHEMIST,
    '财务': Role.FINANCE,
    '人力资源': Role.HR,
    '访客': Role.GUEST,
};

export function normalizeRole(role?: string): string | undefined {
    if (!role) return role;
    const trimmed = role.trim();
    if (chineseToCodeMap[trimmed]) return chineseToCodeMap[trimmed];
    return trimmed.toUpperCase();
}

export function hasAnyRole(user: any, ...roles: string[]): boolean {
    const userRole = normalizeRole(user?.role);
    return !!userRole && roles.some(r => userRole === r);
}


