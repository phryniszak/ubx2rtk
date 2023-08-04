convbin -v 3.02 -r ubx -od -os /home/pawel/rtk/11.07/rover_usb_0711_1649.ubx

---------------------------------------------------

rinex nav file description:
https://www.gsc-europa.eu/gsc-products/galileo-rinex-navigation-parameters

---------------------------------------------------

stderr: sh: 1: crx2rnx: not found
- can be downloaded from here: https://terras.gsi.go.jp/ja/crx2rnx.html
- look for capital letters, when downloaded it is in form of CRX2RNX not crx2rnx
gzip, tar and crx2rnx commands have to be installed in commands path

---------------------------------------------------

is SBAS important? - no
https://github.com/tomojitakasu/RTKLIB/issues/175

---------------------------------------------------

build gnsstk deb file

pawel@pawel-ThinkPad-T440s:~/workspace/gnsstk$ ./build.sh -p
Run cmake  -DADDRESS_SANITIZER=ON /home/pawel/workspace/gnsstk ##########################
============================================================
cmake -DADDRESS_SANITIZER=ON /home/pawel/workspace/gnsstk
============================================================
make all -j 4
============================================================
make package
============================================================
make package_source

Tests not run.
See /home/pawel/workspace/gnsstk/build/pawel-ThinkPad-T440s-v14.0.0/Testing/Temporary/LastTest.log for detailed test log
See /home/pawel/workspace/gnsstk/build/pawel-ThinkPad-T440s-v14.0.0/build.log for detailed build log

GNSSTk build done. :-)
Wed 26 Jul 2023 13:54:29 IST

then install it

now you can build gnsstk-apps
