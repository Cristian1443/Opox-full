/**
 * Entidad de dominio Notification.
 * Cubre tanto las notificaciones normales de la bandeja (2.3) como los
 * nudges flotantes (2.4 a/b/c) — un nudge es una notificación con
 * `isNudge: true` y un `nudgeKind` que el mobile usa para decidir
 * mostrarla como bottom-sheet en vez de en la lista.
 */
export type NotificationCategory = 'boe' | 'social' | 'general';
export type NudgeKind = 'fatigue' | 'academic' | 'boe';

export class Notification {
    private constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly category: NotificationCategory,
        public readonly icon: string,
        public readonly title: string,
        public readonly body: string,
        public readonly isNudge: boolean,
        public readonly nudgeKind: NudgeKind | null,
        public readonly primaryLabel: string | null,
        public readonly secondaryLabel: string | null,
        public readonly actionRoute: string | null,
        public readonly readAt: Date | null,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        userId: string;
        category: NotificationCategory;
        icon: string;
        title: string;
        body: string;
        isNudge?: boolean;
        nudgeKind?: NudgeKind | null;
        primaryLabel?: string | null;
        secondaryLabel?: string | null;
        actionRoute?: string | null;
        readAt?: Date | null;
        createdAt?: Date;
    }): Notification {
        return new Notification(
            props.id,
            props.userId,
            props.category,
            props.icon,
            props.title,
            props.body,
            props.isNudge ?? false,
            props.nudgeKind ?? null,
            props.primaryLabel ?? null,
            props.secondaryLabel ?? null,
            props.actionRoute ?? null,
            props.readAt ?? null,
            props.createdAt ?? new Date(),
        );
    }

    isUnread(): boolean {
        return this.readAt === null;
    }
}
