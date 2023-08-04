// https://blog.logrocket.com/node-js-child-process-launch-external-programs/
import util from "node:util";
import { execFile } from "node:child_process";
const async_exec_file = util.promisify(execFile);
import path from "node:path";
import { access, constants } from "node:fs/promises";
import { createReadStream } from "node:fs";
import readline from "node:readline";
import { once } from "node:events";


const RINEX_OBS = "->rinex obs : ";
const RINEX_NAV = "->rinex nav : ";
const RINEX_SBS = "->sbas log  : ";

export let output_folder;

/**
 * 
 * @param {*} ubx_file 
 * @returns 
 */
export const ubx2rinex = async (ubx_file) => {
    // to set working folder use { cwd: get_working_folder() }
    const { error, stdout, stderr } = await async_exec_file("convbin", ["-v", "3.04", "-r", "ubx", "-od", "-os", ubx_file]);
    // console.log("error:", error);
    // console.log("stdout:", stdout);
    // console.log("stderr:", stderr);

    let pos_obs = stderr.indexOf(RINEX_OBS);
    let pos_nav = stderr.indexOf(RINEX_NAV);
    let pos_sbs = stderr.indexOf(RINEX_SBS);

    // find output files
    const files = {};
    files.obs_file_name = stderr.slice(pos_obs + RINEX_OBS.length, pos_nav).trimEnd();
    files.nav_file_name = stderr.slice(pos_nav + RINEX_NAV.length, pos_sbs).trimEnd();
    console.log("Observation file: ", files.obs_file_name);
    console.log("Navigation file: ", files.nav_file_name);
    set_output_dir(files.obs_file_name);

    // check result file, if not present we raise exception...
    await access(files.obs_file_name, constants.R_OK);
    await access(files.nav_file_name, constants.R_OK);

    return files;
};

/**
 * 
 * @param {*} file_name 
 */
const set_output_dir = (file_name) => {
    output_folder = path.dirname(file_name);
};


/**
 * 
 * @param {*} file_name 
 * @returns 
 */
export const get_ts_from_obs = async (file_name) => {

    const ts = {};

    const rl = readline.createInterface({
        input: createReadStream(file_name),
        crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
        // Process the line.
        if (!ts.date_begin && line.includes("TIME OF FIRST OBS")) {
            let arr = line.trim().split(/\s+/);
            // WARNING: monthIndex  - Integer value representing the month, 
            // beginning with 0 for January to 11 for December. Defaults to 0.
            ts.date_begin = new Date(Date.UTC(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]));
        }
        if (!ts.date_end && line.includes("TIME OF LAST OBS")) {
            let arr = line.trim().split(/\s+/);
            // WARNING: monthIndex  - Integer value representing the month, 
            // beginning with 0 for January to 11 for December. Defaults to 0.
            ts.date_end = new Date(Date.UTC(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]));
        }
    });

    await once(rl, "close");

    return ts;
};


/**
 * 
 * @param {string} rover_obs 
 * @param {string} base_obs 
 * @param {[string]} base_nav 
 * @param {string} config_file 
 * @param {string} output_file 
 * @param {boolean} convert2kml 
 * @returns 
 */
export const run_rtk = async (rover_obs, base_obs, base_nav, config_file, output_file, convert2kml) => {

    // The first RINEX OBS file shall contain receiver (rover) observations. For the relative mode, the second RINEX
    // OBS file shall contain reference (base station) receiver observations. At least one RINEX NAV/GNAV/HNAV
    // file shall be included in input files. 

    // -x debug trace level (0:off,1-5:debug)
    // -o set output file
    // -y level output solution status (0:off,1:states,2:residuals)
    // -k file input options from configuration file
    let args = ["-x", "0", "-y", "1", "-k", config_file, "-o", output_file, rover_obs, base_obs, ...base_nav];

    const { error, stdout, stderr } = await async_exec_file("rnx2rtkp", args);

    // console.log("error:", error);
    // console.log("stdout:", stdout);
    // console.log("stderr:", stderr);

    // now read .stat file, that look like this:
    // $POS,2270,233391.600,2,3759959.8591,-642616.9082,5094742.8776,0.0000,0.0000,0.0000
    // $VELACC,2270,233391.600,2,0.0116,0.0054,0.0701,0.00000,-0.00000,0.00000,0.0000,0.0000,0.0000,0.00000,0.00000,0.00000
    // $CLK,2270,233391.600,2,1,-10981816.851,6.752,0.000,0.000
    /*   $POS,week,tow,stat,posx,posy,posz,posxf,posyf,poszf
    *          week/tow : gps week no/time of week (s)
    *          stat     : solution status
    *          posx/posy/posz    : position x/y/z ecef (m) float
    *          posxf/posyf/poszf : position x/y/z ecef (m) fixed
    *
    *   $VELACC,week,tow,stat,vele,veln,velu,acce,accn,accu,velef,velnf,veluf,accef,accnf,accuf
    *          week/tow : gps week no/time of week (s)
    *          stat     : solution status
    *          vele/veln/velu    : velocity e/n/u (m/s) float
    *          acce/accn/accu    : acceleration e/n/u (m/s^2) float
    *          velef/velnf/veluf : velocity e/n/u (m/s) fixed
    *          accef/accnf/accuf : acceleration e/n/u (m/s^2) fixed
    *
    *   $CLK,week,tow,stat,clk1,clk2,clk3,clk4
    *          week/tow : gps week no/time of week (s)
    *          stat     : solution status
    *          clk1     : receiver clock bias GPS (ns)
    *          clk2     : receiver clock bias GLO-GPS (ns)
    *          clk3     : receiver clock bias GAL-GPS (ns)
    *          clk4     : receiver clock bias BDS-GPS (ns)
    */

    const stream = createReadStream(output_file + ".stat");
    const rl = readline.createInterface({ input: stream });

    // 1:fix,2:float,3:sbas,4:dgps,5:single,6:ppp
    const stat_res = [0, 0, 0, 0, 0, 0, 0];

    rl.on("line", (row) => {
        if (row.startsWith("$CLK")) {
            // console.log(row);
            const line_parts = row.split(",");
            const stat = line_parts[3];
            stat_res[stat] += 1;
        }
    });

    await once(rl, "close");

    console.log("stat results:", stat_res);
    let res = stat_res[1] / (stat_res[1] + stat_res[2]) * 100;
    console.log(`${res.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`);

    // convert pos to kml file, don't wait for result
    if (convert2kml) {
        async_exec_file("pos2kml", ["-ag", output_file]);
    }
    return res;
};

