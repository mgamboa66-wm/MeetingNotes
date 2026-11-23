#!/bin/zsh
set -euo pipefail

NATIVE_DIR="${0:A:h}"
APP_DIR="$NATIVE_DIR/build/MeetingNotesAudioCapture.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"

mkdir -p "$MACOS_DIR"
cp "$NATIVE_DIR/Info.plist" "$CONTENTS_DIR/Info.plist"
/usr/bin/swiftc -O \
  -framework CoreAudio \
  -framework Foundation \
  "$NATIVE_DIR/AudioCapture.swift" \
  -o "$MACOS_DIR/MeetingNotesAudioCapture"
/usr/bin/codesign --force --deep --sign - "$APP_DIR"

print "Built $APP_DIR"
