// https://epncb.eu/ftp/center/data/BKGE.RDC

// 
import { BaseAdapter } from "./base.js";

export class BKGE extends BaseAdapter {
    constructor(args) {
        super(args);
    }

    /**
     * It requires implementations from
     * every specific adapter
     */
    buildUrl_NAV() {
        throw new Error("Not implemented");
    }

    /**
    * It requires implementations from
    * every specific adapter
    */
    buildUrl_OBS() {
        throw new Error("Not implemented");
    }
}