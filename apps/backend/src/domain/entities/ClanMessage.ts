export class ClanMessage {
    private constructor(
        public readonly id: string,
        public readonly clanId: string,
        public readonly userId: string,
        public readonly body: string,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        clanId: string;
        userId: string;
        body: string;
        createdAt?: Date;
    }): ClanMessage {
        return new ClanMessage(
            props.id,
            props.clanId,
            props.userId,
            props.body,
            props.createdAt ?? new Date(),
        );
    }
}
