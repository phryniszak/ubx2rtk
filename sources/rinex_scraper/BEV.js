// https://epncb.eu/ftp/center/data/BEV.RDC

import { BaseAdapter, FILE_TYPE } from "./base.js";

export class BEV extends BaseAdapter {

    constructor(args) {
        super(args);
    }

    /**
     * /nrt/<year>/<doy>/<hour> 
     * <site>00<CCC>_<S>_<YYYY><DDD><HH><MM>_<T>N.rnx.gz       GNSS navigation/ephemeris data (Rx3)
     * MAH100IRL_R_20231910000_01D_CN.rnx.gz
     * MAH100IRL_R_20231910000_01D_EN.rnx.gz
     * MAH100IRL_R_20231910000_01D_GN.rnx.gz
     * MAH100IRL_R_20231910000_01D_RN.rnx.gz
     * https://bobbyhadz.com/blog/javascript-format-date-yyyymmdd
     * 
     *  <site>00<CCC>_<S>_<YYYY><DDD><HH><MM>_01H_MO.crx.gz     verified GNSS observed data in
     *                                                          compressed Compact_RINEX format (Rx3)
     * MAH100IRL_R_20231910000_01D_30S_MO.crx.gz
     */
    buildHourUrl = async (date, station, file_type) => {

        let files = [];
        const year = date.getUTCFullYear();
        const dofy = this.dayOfYear(date).toString().padStart(3, "0");
        const hour = date.getUTCHours().toString().padStart(2, "0");
        const url = `https://gnss.bev.gv.at/at.gv.bev.dc/data/nrt/${year}/${dofy}/${hour}/`;
        const page = await this.getHTTPSPage(url);
        const a_href = "<a href=\"";
        const stop_str = "</a>";
        // find all occurrence
        let start_index = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            start_index = page.indexOf(a_href + station, start_index);
            if (start_index < 0) break;
            const stop_index = page.indexOf(stop_str, start_index);
            if (stop_index < 0) break;
            const a_tag = page.substring(start_index + a_href.length, stop_index);
            const file_name = a_tag.split("\"")[0];
            start_index = stop_index;
            switch (file_type) {
                case FILE_TYPE.NAV:
                    if (file_name.endsWith(".rnx.gz"))
                        files.push(url + file_name);
                    break;
                case FILE_TYPE.OBS:
                    if (file_name.endsWith("_MO.crx.gz"))
                        files.push(url + file_name);
                    break;
                default:
                    throw new Error("Not known file type: " + file_type);
            }

        }

        return files;
    };

    /**
     * https://gnss.bev.gv.at/at.gv.bev.dc/data/obs/2023/191/
     * @param {*} date 
     * @param {*} station 
     * @param {*} file_type 
     * @returns 
     */
    buildDayUrl = async (date, station, file_type) => {

        let files = [];
        const year = date.getUTCFullYear();
        const dofy = this.dayOfYear(date).toString().padStart(3, "0");
        const url = `https://gnss.bev.gv.at/at.gv.bev.dc/data/obs/${year}/${dofy}/`;
        const page = await this.getHTTPSPage(url);
        const a_href = "<a href=\"";
        const stop_str = "</a>";
        // find all occurrence
        let start_index = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            start_index = page.indexOf(a_href + station, start_index);
            if (start_index < 0) break;
            const stop_index = page.indexOf(stop_str, start_index);
            if (stop_index < 0) break;
            const a_tag = page.substring(start_index + a_href.length, stop_index);
            const file_name = a_tag.split("\"")[0];
            start_index = stop_index;
            switch (file_type) {
                case FILE_TYPE.NAV:
                    if (file_name.endsWith(".rnx.gz"))
                        files.push(url + file_name);
                    break;
                case FILE_TYPE.OBS:
                    if (file_name.endsWith("_MO.crx.gz"))
                        files.push(url + file_name);
                    break;
                default:
                    throw new Error("Not known file type: " + file_type);
            }

        }

        return files;
    };

    /**
     * 
     * @param {*} date 
     * @param {*} station 
     * @returns 
     */
    buildHourUrl_OBS = async (date, station) => {
        return this.buildHourUrl(date, station, FILE_TYPE.OBS);
    };

    /**
     * 
     * @param {*} date 
     * @param {*} station 
     * @returns 
     */
    buildHourUrl_NAV = async (date, station) => {
        return this.buildHourUrl(date, station, FILE_TYPE.NAV);
    };

    /**
    * 
    * @param {*} date 
    * @param {*} station 
    * @returns 
    */
    buildDayUrl_OBS = async (date, station) => {
        return this.buildDayUrl(date, station, FILE_TYPE.OBS);
    };

    /**
    * 
    * @param {*} date 
    * @param {*} station 
    * @returns 
    */
    buildDayUrl_NAV = async (date, station) => {
        return this.buildDayUrl(date, station, FILE_TYPE.NAV);
    };

    /**
     * 
     * @param {*} ts 
     * @param {*} station 
     */
    async downloadFilesFromDateTime(ts, station) {
        let files = [];

        let urlOBS = [];
        urlOBS = await this.getFilesToDownload(ts, station, FILE_TYPE.OBS);
        console.log("downloading observation files:", urlOBS);
        let downloadedOBS = await this.downloadFiles(urlOBS);
        files.push(downloadedOBS);

        let urlNAV = [];
        urlNAV = await this.getFilesToDownload(ts, station, FILE_TYPE.NAV);
        console.log("downloading navigation files:", urlNAV);
        let downloadedNAV = await this.downloadFiles(urlNAV);
        files.push(downloadedNAV);

        return files;
    }
}