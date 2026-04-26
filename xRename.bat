@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

set count=1

:: converte jpeg para jpg primeiro
for %%f in (*.jpeg) do (
    ren "%%f" "%%~nf.jpg"
)

:: renomeia tudo, MAS ignora arquivos já numerados
for %%f in (*.*) do (
    if /I not "%%~nxf"=="%~nx0" (
        if /I not "%%~nxf"=="rename.bat" (

            :: verifica se o nome já é número
            echo %%~nf | findstr /r "^[0-9][0-9]*$" >nul

            if errorlevel 1 (
                ren "%%f" "!count!%%~xf"
                set /a count+=1
            )

        )
    )
)

exit