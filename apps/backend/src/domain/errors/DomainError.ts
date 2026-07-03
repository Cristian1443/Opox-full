/**
 * Base de todos los errores de dominio. Nunca se lanzan errores
 * genéricos (`throw new Error(...)`) desde las capas de dominio o
 * aplicación — siempre una subclase de DomainError con `code` estable.
 *
 * El middleware de error global mapea `code` → HTTP status + body.
 */
export abstract class DomainError extends Error {
    abstract readonly code: string;
    abstract readonly httpStatus: number;

    constructor(message: string, public readonly fields?: Record<string, string>) {
        super(message);
        this.name = new.target.name;
    }
}
