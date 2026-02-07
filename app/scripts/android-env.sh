#!/bin/sh
# Source this before running expo run:android so the CLI finds the SDK:
#   source scripts/android-env.sh
# Or: . scripts/android-env.sh

# Default Android Studio SDK on Linux (change if yours is different, e.g. /opt/android-sdk)
export ANDROID_HOME="${ANDROID_HOME:-/home/sidnei/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
