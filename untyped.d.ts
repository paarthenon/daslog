declare module 'streamroller' {
    interface RollingFileStreamOptions {
        encoding?: 'utf8',
        mode?: number,
        flags?: string,
        compress?: boolean,
        keepFileExt?: boolean,
    }
    class RollingFileStream {
        constructor(filename: string, maxSize?: number, numBackups?: number, options?: RollingFileStreamOptions);
        write(chunk: string | Uint8Array | any, encoding?: string, callback?: Function): boolean;
        end(): void;
    }
}