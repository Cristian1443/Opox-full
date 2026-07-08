export type ClanRole = 'leader' | 'member';

export class Clan {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly initials: string,
        public readonly description: string | null,
        /** null si quien lo creó borró su cuenta (ON DELETE SET NULL) */
        public readonly createdBy: string | null,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        name: string;
        initials: string;
        description?: string | null;
        createdBy: string | null;
        createdAt?: Date;
    }): Clan {
        return new Clan(
            props.id,
            props.name,
            props.initials,
            props.description ?? null,
            props.createdBy,
            props.createdAt ?? new Date(),
        );
    }
}

export class ClanMembership {
    private constructor(
        public readonly clanId: string,
        public readonly userId: string,
        public readonly role: ClanRole,
        public readonly joinedAt: Date,
    ) { }

    static create(props: {
        clanId: string;
        userId: string;
        role?: ClanRole;
        joinedAt?: Date;
    }): ClanMembership {
        return new ClanMembership(
            props.clanId,
            props.userId,
            props.role ?? 'member',
            props.joinedAt ?? new Date(),
        );
    }
}
