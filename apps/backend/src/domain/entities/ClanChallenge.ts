export class ClanChallenge {
    private constructor(
        public readonly id: string,
        public readonly clanId: string,
        /** null si quien lo creó borró su cuenta (ON DELETE SET NULL) */
        public readonly createdBy: string | null,
        public readonly title: string,
        public readonly subtitle: string | null,
        public readonly questionCount: number,
        public readonly rewardPoints: number,
        public readonly expiresAt: Date | null,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        clanId: string;
        createdBy: string | null;
        title: string;
        subtitle?: string | null;
        questionCount?: number;
        rewardPoints?: number;
        expiresAt?: Date | null;
        createdAt?: Date;
    }): ClanChallenge {
        return new ClanChallenge(
            props.id,
            props.clanId,
            props.createdBy,
            props.title,
            props.subtitle ?? null,
            props.questionCount ?? 0,
            props.rewardPoints ?? 0,
            props.expiresAt ?? null,
            props.createdAt ?? new Date(),
        );
    }

    isExpired(now: Date = new Date()): boolean {
        return this.expiresAt !== null && now.getTime() >= this.expiresAt.getTime();
    }
}
