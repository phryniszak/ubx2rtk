import { join, parse } from "node:path";
import { createWriteStream, mkdtempSync } from "node:fs";
import https from "node:https";
import zlib from "node:zlib";

import { output_folder } from "../internals.js"
/**
 * Base adapter class with common functions
 * and instance constructions
 */
const FIRST_CHAR = 97;

export const FILE_TYPE = {
    OBS: "OBS",
    NAV: "NAV"
};

export class BaseAdapter {

    constructor(args) {
        this.verbose = args.verbose || false;
        this.baseId = args.baseId || "";
        this.begin = args.date_begin;
        this.end = args.date_end;
    }

    async downloadFilesFromDateTime() {
        throw new Error("Not implemented");
    }

    /**
     * It requires implementations from
     * every specific adapter
     */
    buildHourUrl_NAV() {
        throw new Error("Not implemented");
    }

    /**
    * It requires implementations from
    * every specific adapter
    */
    buildHourUrl_OBS() {
        throw new Error("Not implemented");
    }

    /**
    * It requires implementations from
    * every specific adapter
    */
    buildDayUrl_NAV() {
        throw new Error("Not implemented");
    }

    /**
    * It requires implementations from
    * every specific adapter
    */
    buildDayUrl_OBS() {
        throw new Error("Not implemented");
    }

    /**
     * It requires implementation from parent class
     */
    cleanUp() {
        throw new Error("Not implemented");
    }

    downloadedFiles() {
        throw new Error("Not implemented");

        // const files = fs.readdirSync(this.#temp_folder).map(x => `${this.#temp_folder}/${x}`);
        // files.sort();
        // return files;
    }

    /**
     * 
     * @param {*} files_url 
     */
    downloadFiles = async (files_url) => {

        let downloaded_files = [];
        await Promise.allSettled(files_url.map(async (file_url) => {
            let local_file_name = join(output_folder, parse(file_url).name);
            downloaded_files.push(local_file_name);
            await this.downloadHttpsGunzipFile(file_url, local_file_name);
        }));

        return (downloaded_files);
    };

    /**
     * It returns an map from a=0 to z=23
     */
    getHourBlock(hour) {
        return String.fromCharCode(FIRST_CHAR + parseInt(hour));
    }

    /**
     * NOT USED - as for now no attempt to merge downloaded RINEX files
     * @param {*} file_type 
     * @param {*} ts 
     * @param {*} station 
     * @returns 
     */
    getFilesToDownload_multiple = async (ts, station, file_type) => {
        const files = [];

        // start ts - make copy
        let begin = new Date(ts.date_begin);
        let file_name;

        // eslint-disable-next-line no-constant-condition
        while (true) {

            switch (file_type) {
                case FILE_TYPE.NAV:
                    file_name = await this.buildUrl_NAV(begin, station);
                    files.push(...file_name);
                    break;
                case FILE_TYPE.OBS:
                    file_name = await this.buildUrl_OBS(begin, station);
                    files.push(...file_name);
                    break;
                default:
                    throw new Error("Not known file type: " + file_type);
            }

            if (begin >= ts.date_end) {
                break;
            }
            this.addHours(begin, 1);
        }
        return files;
    };

    /**
    * NOT USED - as for now no attempt to merge downloaded RINEX files
    * @param {*} file_type 
    * @param {*} ts 
    * @param {*} station 
    * @returns 
    */
    getFilesToDownload = async (ts, station, file_type) => {

        // TODO: check if to close to now > 1 hour

        // can not cross one hour boundaries
        if (ts.date_begin.getUTCHours() == ts.date_end.getUTCHours()) {
            switch (file_type) {
                case FILE_TYPE.NAV:
                    return await this.buildHourUrl_NAV(ts.date_begin, station);
                case FILE_TYPE.OBS:
                    return await this.buildHourUrl_OBS(ts.date_begin, station);
                default:
                    throw new Error("Not known file type: " + file_type);

            }
        } else if (ts.date_begin.getUTCDate() == ts.date_end.getUTCDate()) {
            switch (file_type) {
                case FILE_TYPE.NAV:
                    return await this.buildDayUrl_NAV(ts.date_begin, station);
                case FILE_TYPE.OBS:
                    return await this.buildDayUrl_OBS(ts.date_begin, station);
                default:
                    throw new Error("Not known file type: " + file_type);
            }
        }
    };

    /**
     * 
     * @param {*} url 
     * @param {*} outputPath 
     * @returns 
     */
    downloadFileAxios = async (url, outputPath) => {
        try {
            const response = await axios({
                method: "GET",
                url,
                responseType: "stream",
            });

            if (response.status !== 200) {
                console.error("Failed to download the file.");
                return;
            }

            const fileStream = createWriteStream(outputPath);
            response.data.pipe(fileStream);

            fileStream.on("finish", () => {
                console.log("File downloaded successfully.");
            });
        } catch (error) {
            console.error("Error while downloading:", error.message);
        }
    };

    /**
     * 
     * @param {*} url 
     * @param {*} outputPath 
     * @returns 
     */
    downloadHttpsGunzipFile = (url, outputPath) => {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download the file. Status code: ${response.statusCode}`));
                    return;
                }

                const gunzip = zlib.createGunzip();
                const fileStream = createWriteStream(outputPath);

                response.pipe(gunzip).pipe(fileStream);

                fileStream.on("finish", () => {
                    fileStream.close();
                    resolve(outputPath);
                });

                fileStream.on("error", (err) => {
                    reject(err);
                });
            }).on("error", (err) => {
                reject(err);
            });
        });
    };

    /**
    * 
    * @param {*} url 
    * @param {*} outputPath 
    * @returns 
    */
    downloadHttpsFile = (url, outputPath) => {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download the file. Status code: ${response.statusCode}`));
                    return;
                }

                const fileStream = createWriteStream(outputPath);
                response.pipe(fileStream);

                fileStream.on("finish", () => {
                    fileStream.close();
                    resolve(outputPath);
                });

                fileStream.on("error", (err) => {
                    reject(err);
                });
            }).on("error", (err) => {
                reject(err);
            });
        });
    };


    /**
     * 
     * @param {*} url 
     * @returns 
     */
    getHTTPSPage = (url) => {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = "";
                response.on("data", chunk => { data += chunk; });
                response.on("end", () => {
                    if (response.statusCode !== 200) {
                        reject(new Error(`Failed to download the file. Status code: ${response.statusCode}`));
                        return;
                    }

                    resolve(data);
                });

            }).on("error", (err) => {
                reject(err);
            });
        });
    };

    /**
     * 
     * @param {*} date 
     * @param {*} hours 
     * @returns 
     */
    addHours = (date, hours) => date.setTime(date.getTime() + hours * 60 * 60 * 1000);

    /**
     * 
     * @param {*} date 
     * @returns 
     */
    dayOfYear = date => Math.floor((date - new Date(date.getUTCFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
}
