import * as cp from "child_process";

export class Utils {
    static executeShell = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });

    static delay = (ms: number) => new Promise(res => setTimeout(res, ms));
}