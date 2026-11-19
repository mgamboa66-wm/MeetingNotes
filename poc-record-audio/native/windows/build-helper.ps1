$ErrorActionPreference = 'Stop'

$nativeDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildDirectory = Join-Path $nativeDirectory 'build'
$sourceFile = Join-Path $nativeDirectory 'AudioCapture.cpp'
$outputFile = Join-Path $buildDirectory 'MeetingNotesAudioCapture.exe'

if (-not (Get-Command cl.exe -ErrorAction SilentlyContinue)) {
    throw 'No se encontró cl.exe. Abre el Developer Command Prompt de Visual Studio 2022 para la arquitectura que vas a compilar e inténtalo de nuevo.'
}

New-Item -ItemType Directory -Path $buildDirectory -Force | Out-Null
& cl.exe /nologo /std:c++17 /EHsc /O2 /W4 /utf-8 /DUNICODE /D_UNICODE $sourceFile "/Fe:$outputFile" /link Ole32.lib Uuid.lib
if ($LASTEXITCODE -ne 0) {
    throw "Falló la compilación del helper de Windows (código $LASTEXITCODE)."
}

Write-Host "Helper de Windows compilado: $outputFile"
