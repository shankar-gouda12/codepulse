@echo off
set PG_BIN=%~dp0pgsql\pgsql\bin
if not exist "%PG_BIN%" set PG_BIN=%~dp0pgsql\bin
set PG_DATA=%~dp0pgsql\data
set PG_LOG=%~dp0pgsql\postgres.log
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" start

