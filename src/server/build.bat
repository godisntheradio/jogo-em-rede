echo off
set "PATH=%APPDATA%\npm;%PATH%"
echo on
tsc --target es5 server.ts