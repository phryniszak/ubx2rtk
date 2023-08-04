[Title](rtklib_wasm.md)

https://rtklibexplorer.wordpress.com/2016/02/12/converting-raw-receiver-data-to-standard-text-format-using-convbin/


To convert binary data from a file named “testdata.ubx” the format of the command to CONVBIN will look like this:

convbin -od -os -oi -ot -f 1 -ts 2015/12/14 17:25:00 -te 2015/12/14 18:25:00 testdata.ubx

The command line options are all well documented in the RTKLIB user manual and there are many I am not using but here’s a brief explanation of the options I am using:

-od: include doppler frequency data in observation output file

-os: include SNR data in observation output file

-oi: include iono correction in nav output file header

-ot: include time correction in nav output file header

-f 1: one frequency (L1 only)

-ts: start time

-te: end time

I leave off the start time and end time options when I choose to process the complete file.

The output of this command will be a set of text files. The .obs file contains the observation data which in this case is the pseudorange, carrier phase, doppler, and SNR from each satellite for each epoch. The start of this file should look something like this:

(...)

The top section is the file header, followed by a timedate stamp and list of satellites for the first epoch. After that is a list of pseudorange, carrier phase, doppler, and SNR numbers for five satellites from the first epoch, each row being one satellite. See here for a complete description for the RINEX observation file data format.

There will also be a .nav file containing navigation data for the GPS satellites, a .gnav file for GLONASS navigation data, a .hnav file for geosynchronous satellite navigation data and a .sbs file containing SBAS correction data. All of these files are in text format and we will need most, if not all of them, as inputs to generate position data.

