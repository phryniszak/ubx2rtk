import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "path";
import { exit } from "node:process";

// private imports
import { ubx2rinex, get_ts_from_obs, run_rtk, output_folder } from "./sources/internals.js";
import { BEV } from "./sources/rinex_scraper/BEV.js";
import { BKGE } from "./sources/rinex_scraper/BKGE.js";


// https://github.com/pkgjs/parseargs
const options = {
    station: {
        type: "string",
        short: "s",
        default: "MAH100IRL"
    },
    rinex: {
        type: "string",
        short: "r",
        default: "BEV"
    },
    config: {
        type: "string",
        short: "c",
        default: "./config/"
    },
    basenav: {
        type: "string",
        short: "n",
        multiple: true
    },
    baseobs: {
        type: "string",
        short: "o",
    },
};

// args {string[]} array of argument strings. Default: process.argv with execPath and filename removed.
const { values, positionals } = parseArgs({ strict: false, options });

if (positionals.length < 1) {
    console.error("missing ubx file");
}

values.ubx_file = positionals[0];

console.log("values:", values);

// convert ubx to RINEX
const rover_rinex_files = await ubx2rinex(values.ubx_file);

// get time stamp from obs
const ts = await get_ts_from_obs(rover_rinex_files.obs_file_name);
console.log("ts:", ts);

let base_from_file = (values.basenav.length > 1) && typeof (values.baseobs) == "string";
let base_rinex_files = [];

if (base_from_file) {
    // get base position from cli
    base_rinex_files.push([values.baseobs]);
    base_rinex_files.push(values.basenav);
} else {
    // get base position from website
    let adapter;

    if (values.rinex == "BEV") {
        adapter = BEV;
    } else if (values.rinex == "BKGE") {
        adapter = BKGE;
    } else {
        throw new Error(`Adapter ${values.rinex} not implemented`);
    }

    let rs = new adapter({ date_begin: ts.date_begin, date_end: ts.date_end });
    base_rinex_files = await rs.downloadFilesFromDateTime(ts, values.station);
}

console.log("base rinex files", base_rinex_files);

// read config files
const config_files = fs.readdirSync(values.config)
    .map(file_name => path.join(values.config, file_name))
    .filter(file_path => path.extname(file_path) === ".conf");

// exit if no config file
if (config_files.length < 1) {
    console.log("no config files");
    exit();
}

// create output folder
// for now lets place it in the same place as rover files
const result_folder = path.join(output_folder, "out");
fs.mkdirSync(result_folder, { recursive: true });

// for each config run RTK
let convert2kml = true;
const results = await Promise.allSettled(config_files.map((config) => {
    const output_file_name = path.join(result_folder, path.parse(config).name) + ".pos";
    return run_rtk(rover_rinex_files.obs_file_name, base_rinex_files[0][0][0], base_rinex_files[1], config,
        output_file_name, convert2kml);
}));

// print results
results.forEach((result, index) => {
    let stat = result.value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
    console.log(`${config_files[index]} returned ${stat}%`);
});
